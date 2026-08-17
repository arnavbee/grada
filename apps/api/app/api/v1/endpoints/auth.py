import json
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit import log_audit
from app.core.config import get_settings
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    validate_password_policy,
    verify_password,
)
from app.core.super_admin import is_super_admin_email, is_super_admin_user
from app.db.session import get_db
from app.models.carton_capacity_rule import CartonCapacityRule
from app.models.company import Company
from app.models.company_settings import CompanySettings
from app.models.po_request import PORequest, PORequestItem
from app.models.po_request_row import PORequestRow
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.received_po import ReceivedPO, ReceivedPOLineItem
from app.models.user import User
from app.schemas.auth import (
    AuthTokens,
    DemoSessionResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserResponse

router = APIRouter(prefix='/auth', tags=['auth'])
settings = get_settings()


def _demo_asset_base_url(request: Request) -> str:
    """Serve the sample apparel images from the configured frontend origin."""
    origins = [origin.strip().rstrip('/') for origin in settings.frontend_origins.split(',') if origin.strip()]
    request_origin = request.headers.get('origin', '').strip().rstrip('/')
    if request_origin in origins:
        return request_origin
    return origins[0] if origins else 'http://localhost:3000'


def _seed_demo_workspace(*, db: Session, company_id: str, user_id: str, asset_base_url: str) -> None:
    """Create a compact but complete apparel-operations story for a new demo visitor."""
    # Real catalog rows exported from the brand's workspace (catalog 1.xlsx),
    # images extracted from the same workbook into /images/apparel/.
    def _item(sku, title, category, color, fabric, composition, knit, image):
        return {
            'sku': sku,
            'title': title,
            'category': category,
            'color': color,
            'image': image,
            'price': 600,
            'osp': 95,
            'fabric': fabric,
            'composition': composition,
            'knit': knit,
        }

    products = (
        _item('HRD-DRESSES-26-JINX', 'Bodycon', 'DRESSES', 'Black', 'Poly Georgette', '100% Polyester', 'Woven', 'hrd-dresses-26-jinx.jpg'),
        _item('JIDS26001', 'Maxi Dress', 'DRESSES', 'Brown', 'Poly Georgette', '100% Polyester', 'Woven', 'jids26001.jpg'),
        _item('GEN-DRESSES-NA-OS-11', 'Midi Dress', 'DRESSES', 'Pink', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-11.jpg'),
        _item('GEN-DRESSES-NA-OS-10', 'Midi Dress', 'DRESSES', 'Black', 'Polycrepe', '100% Polyester', 'Woven', 'gen-dresses-na-os-10.jpg'),
        _item('GEN-DRESSES-NA-OS-09', 'Maxi Dress', 'DRESSES', 'Navy', 'Polycrepe', '100% Polyester', 'Woven', 'gen-dresses-na-os-09.jpg'),
        _item('GEN-DRESSES-NA-OS-08', 'Maxi Dress', 'DRESSES', 'Blue', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-08.jpg'),
        _item('GEN-CORD-SETS-NA-OS', 'Knot Cord Set', 'CORD SETS', 'Brown', 'Pleated Knitted Fabric', '100% Polyester', 'Knitted', 'gen-cord-sets-na-os.jpg'),
        _item('GEN-DRESSES-NA-OS-07', 'Maxi Dress', 'DRESSES', 'Lilac', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-07.jpg'),
        _item('GEN-DRESSES-NA-OS-06', 'Knee Length', 'DRESSES', 'Brown', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-06.jpg'),
        _item('GEN-DRESSES-NA-OS-05', 'Maxi Dress', 'DRESSES', 'Lilac', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-05.jpg'),
        _item('GEN-DRESSES-NA-OS-04', 'Knee Length', 'DRESSES', 'Brown', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-04.jpg'),
        _item('GEN-DRESSES-NA-OS-03', 'Knee Length', 'DRESSES', 'Brown', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-03.jpg'),
        _item('GEN-DRESSES-NA-OS-02', 'Maxi Dress', 'DRESSES', 'Lilac', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os-02.jpg'),
        _item('GEN-DRESSES-NA-OS', 'Maxi Dress', 'DRESSES', 'Black', 'Poly Georgette', '100% Polyester', 'Woven', 'gen-dresses-na-os.jpg'),
    )
    product_records: list[Product] = []
    for item in products:
        product = Product(
            id=str(uuid4()),
            company_id=company_id,
            sku=item['sku'],
            title=item['title'],
            description=f"Sample {item['category'].lower()} record for the Grada portfolio demo.",
            brand='House of Raeli',
            category=item['category'],
            color=item['color'],
            size='M',
            status='ready',
            confidence_score=0.96,
            ai_attributes_json=json.dumps(
                {
                    'fabric': item['fabric'],
                    'composition': item['composition'],
                    'woven_knits': item['knit'],
                    'units': 24,
                    'po_price': item['price'],
                    'osp': item['osp'],
                }
            ),
            created_by_user_id=user_id,
        )
        db.add(product)
        product_records.append(product)
        db.add(
            ProductImage(
                id=str(uuid4()),
                company_id=company_id,
                product_id=product.id,
                file_name=item['image'],
                file_url=f"{asset_base_url}/images/apparel/{item['image']}",
                mime_type='image/jpeg',
                processing_status='completed',
                analysis_json=json.dumps({'source': 'portfolio_demo'}),
            )
        )

    po_request = PORequest(
        id=str(uuid4()), company_id=company_id, status='draft', created_by_user_id=user_id
    )
    db.add(po_request)
    for row_index, product in enumerate(product_records[:2]):
        item = products[row_index]
        request_item = PORequestItem(
            id=str(uuid4()),
            po_request_id=po_request.id,
            product_id=product.id,
            po_price=item['price'],
            osp_inside_price=item['osp'],
            fabric_composition='100% Polyester',
            size_ratio={'S': 6, 'M': 10, 'L': 8},
            extracted_attributes={'source': 'portfolio_demo'},
        )
        db.add(request_item)
        db.add(
            PORequestRow(
                id=str(uuid4()),
                po_request_id=po_request.id,
                po_request_item_id=request_item.id,
                product_id=product.id,
                row_index=row_index,
                sku_id=product.sku,
                brand_name='House of Raeli',
                category_type=product.category,
                color=product.color,
                size='M',
                l1='Women',
                fibre_composition='100% Polyester',
                coo='India',
                po_price=item['price'],
                osp_in_sar=item['osp'],
                po_qty=24,
                knitted_woven='Woven',
                product_name=product.title,
            )
        )

    parsed_po = ReceivedPO(
        id=str(uuid4()),
        company_id=company_id,
        file_url=f'{asset_base_url}/marketing/grada-received-po-processing-animated.html',
        po_number='70058611',
        distributor='Styli',
        status='parsed',
        raw_extracted_json=json.dumps({'source': 'portfolio_demo'}),
        auto_resolve_rate=92,
        exception_count=1,
        review_required_count=1,
    )
    confirmed_po = ReceivedPO(
        id=str(uuid4()),
        company_id=company_id,
        file_url=f'{asset_base_url}/marketing/grada-received-po-processing-animated.html',
        po_number='70058596',
        distributor='Styli',
        status='confirmed',
        raw_extracted_json=json.dumps({'source': 'portfolio_demo'}),
        auto_resolve_rate=100,
        exception_count=0,
        review_required_count=0,
    )
    db.add_all((parsed_po, confirmed_po))
    for index, product in enumerate(product_records[:3]):
        item = products[index]
        db.add(
            ReceivedPOLineItem(
                received_po_id=parsed_po.id,
                brand_style_code=product.sku,
                styli_style_id=f'{70329104 + index}',
                model_number=product.sku,
                option_id=f'{70329104 + index}02',
                sku_id=f'{70329104 + index}0202',
                color=product.color,
                knitted_woven='Woven',
                size='M',
                quantity=24,
                po_price=item['price'],
                confidence_score=0.74 if index == 1 else 0.98,
                resolution_status='needs_review' if index == 1 else 'auto_resolved',
                exception_reason='Confirm colour mapping' if index == 1 else None,
                suggested_fix_json=json.dumps({'color': product.color}),
            )
        )
    for index, product in enumerate(product_records[:2]):
        item = products[index]
        db.add(
            ReceivedPOLineItem(
                received_po_id=confirmed_po.id,
                brand_style_code=product.sku,
                styli_style_id=f'{70329204 + index}',
                model_number=product.sku,
                option_id=f'{70329204 + index}02',
                sku_id=f'{70329204 + index}0202',
                color=product.color,
                knitted_woven='Woven',
                size='M',
                quantity=18,
                po_price=item['price'],
                confidence_score=0.99,
                resolution_status='auto_resolved',
                suggested_fix_json='{}',
            )
        )

    db.add(
        CartonCapacityRule(
            company_id=company_id,
            category='DRESSES',
            pieces_per_carton=24,
            is_default=True,
        )
    )


@router.post('/demo', response_model=DemoSessionResponse, status_code=status.HTTP_201_CREATED)
def create_demo_session(request: Request, db: Session = Depends(get_db)) -> DemoSessionResponse:
    """Create an isolated sample workspace without collecting visitor details."""
    company_id = str(uuid4())
    user_id = str(uuid4())
    demo_suffix = uuid4().hex[:12]
    company = Company(id=company_id, name='Apex Retail Solutions — Demo')
    user = User(
        id=user_id,
        email=f'demo-{demo_suffix}@grada-demo.example.com',
        password_hash=hash_password(secrets.token_urlsafe(24)),
        full_name='Demo Visitor',
        role='admin',
        company_id=company_id,
        signup_source='portfolio_demo',
        verification_status='internal',
        verified_at=datetime.now(timezone.utc),
        last_seen_at=datetime.now(timezone.utc),
    )
    settings_record = CompanySettings(
        id=str(uuid4()),
        company_id=company_id,
        invoice_prefix='ARS',
        settings_json=json.dumps(
            {
                'brand_profile': {
                    'supplier_name': 'Apex Retail Solutions Pvt Ltd',
                    'brand_name': 'House of Raeli',
                    'fbs_name': 'FBS-House of Raeli Modern Sanskriti',
                    'address': 'Plot No. 45, Udyog Vihar Phase-II, Gurgaon - 122015',
                    'gst_number': '06AAECA7890K1ZP',
                    'pan_number': 'AAECA7890K',
                    'bill_to_address': 'Styli Marketplace, Dubai',
                    'ship_to_address': 'Styli Distribution Centre, Dubai',
                    'invoice_prefix': 'ARS',
                    'stamp_image_url': '/static/branding/stamp.png',
                },
                'po_builder_defaults': {'po_price': 600, 'osp_in_sar': 95},
            }
        ),
    )
    db.add_all((company, user, settings_record))
    _seed_demo_workspace(
        db=db,
        company_id=company_id,
        user_id=user_id,
        asset_base_url=_demo_asset_base_url(request),
    )
    log_audit(
        db,
        action='auth.demo_session_created',
        user_id=user.id,
        company_id=company.id,
        metadata={'source': 'portfolio_demo'},
    )
    db.commit()
    db.refresh(user)
    token_response = _token_response(db, user)
    return DemoSessionResponse(
        **token_response.model_dump(),
        demo_company_name=company.name,
    )


def _build_user_response(db: Session, user: User) -> UserResponse:
    company_name = db.query(Company.name).filter(Company.id == user.company_id).scalar()
    user_payload = UserResponse.model_validate(user).model_dump()
    user_payload['company_name'] = company_name
    user_payload['is_super_admin'] = is_super_admin_user(user)
    user_payload['is_demo'] = user.signup_source == 'portfolio_demo'
    return UserResponse(**user_payload)


def _token_response(db: Session, user: User) -> AuthTokens:
    access_token = create_access_token(user_id=user.id, company_id=user.company_id, role=user.role)
    refresh_token = create_refresh_token(user_id=user.id, company_id=user.company_id, role=user.role)
    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expires_minutes * 60,
        user=_build_user_response(db, user),
    )


@router.post('/register', response_model=AuthTokens, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokens:
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered.')

    try:
        validate_password_policy(payload.password)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    now = datetime.now(timezone.utc)
    company = Company(id=str(uuid4()), name=payload.company_name)
    db.add(company)

    company_settings = CompanySettings(id=str(uuid4()), company_id=company.id)
    db.add(company_settings)

    user = User(
        id=str(uuid4()),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role='admin',
        company_id=company.id,
        signup_source='self_serve',
        verification_status='internal' if is_super_admin_email(payload.email.lower()) else 'unreviewed',
        verified_at=now if is_super_admin_email(payload.email.lower()) else None,
        last_seen_at=now,
    )
    db.add(user)
    db.flush()

    log_audit(
        db,
        action='auth.register',
        user_id=user.id,
        company_id=company.id,
        metadata={'email': user.email},
    )
    db.commit()
    db.refresh(user)
    return _token_response(db, user)


@router.post('/login', response_model=AuthTokens)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokens:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password.')
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User account is deactivated.')

    now = datetime.now(timezone.utc)
    user.last_login = now
    user.last_seen_at = now
    log_audit(
        db,
        action='auth.login',
        user_id=user.id,
        company_id=user.company_id,
        metadata={'email': user.email},
    )
    db.commit()
    db.refresh(user)
    return _token_response(db, user)


@router.post('/refresh-token', response_model=AuthTokens)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> AuthTokens:
    try:
        token_payload = decode_refresh_token(payload.refresh_token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = (
        db.query(User)
        .filter(
            User.id == token_payload.get('sub'),
            User.company_id == token_payload.get('company_id'),
            User.is_active.is_(True),
        )
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found or inactive.')

    user.last_seen_at = datetime.now(timezone.utc)
    log_audit(db, action='auth.refresh', user_id=user.id, company_id=user.company_id)
    db.commit()
    return _token_response(db, user)


@router.post('/logout', response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    log_audit(db, action='auth.logout', user_id=current_user.id, company_id=current_user.company_id)
    db.commit()
    return MessageResponse(message='Logged out successfully.')


@router.post('/forgot-password', response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> ForgotPasswordResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None:
        return ForgotPasswordResponse(message='If this account exists, a reset link has been sent.')

    reset_token = secrets.token_urlsafe(32)
    user.reset_password_token = reset_token
    user.reset_password_expires_at = datetime.utcnow() + timedelta(
        minutes=settings.password_reset_token_expires_minutes
    )
    log_audit(
        db,
        action='auth.forgot_password',
        user_id=user.id,
        company_id=user.company_id,
        metadata={'email': user.email},
    )
    db.commit()

    return ForgotPasswordResponse(
        message='If this account exists, a reset link has been sent.',
        reset_token=reset_token if settings.app_env != 'production' else None,
    )


@router.post('/reset-password', response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    try:
        validate_password_policy(payload.new_password)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    user = db.query(User).filter(User.reset_password_token == payload.token).first()
    now = datetime.utcnow()
    if user is None or user.reset_password_expires_at is None or user.reset_password_expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Reset token is invalid or expired.')

    user.password_hash = hash_password(payload.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None

    log_audit(db, action='auth.reset_password', user_id=user.id, company_id=user.company_id)
    db.commit()
    return MessageResponse(message='Password reset successful.')


@router.get('/me', response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    return _build_user_response(db, current_user)
