import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.db.session import get_db
from app.models.carton_capacity_rule import CartonCapacityRule
from app.models.company_settings import CompanySettings
from app.models.user import User
from app.schemas.settings import (
    BrandProfileResponse,
    BrandProfileSettings,
    CartonCapacityRuleCreateRequest,
    CartonCapacityRuleListResponse,
    CartonCapacityRuleResponse,
    CartonCapacityRuleUpdateRequest,
    POBuilderDefaultsResponse,
    POBuilderDefaultsSettings,
)

router = APIRouter(prefix='/settings', tags=['settings'])

DEFAULT_BILL_TO_NAME = 'NEOM TRADING AND TECHNOLOGY SERVICES PRIVATE LIMITED'
DEFAULT_BILL_TO_ADDRESS = 'Near Pole No. 646, Khasra No. 36/1, V.P.O. Bamnoli, Main Bijwasan Road, New Delhi - 110077'
DEFAULT_BILL_TO_GST = '07AAGCN3134K1ZF'
DEFAULT_BILL_TO_PAN = 'AAGCN3134K'
DEFAULT_SHIP_TO_NAME = 'NEOM TRADING AND TECHNOLOGY SERVICES PRIVATE LIMITED'
DEFAULT_SHIP_TO_ADDRESS = 'Plot no 113, Village Bamnoli, District - South West Delhi, New Delhi - 110077'
DEFAULT_SHIP_TO_GST = '07AAGCN3134K1ZF'


def _json_loads(raw: str | None) -> dict[str, object]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _json_dumps(payload: dict[str, object]) -> str:
    return json.dumps(payload, separators=(',', ':'))


def _get_or_create_company_settings(db: Session, company_id: str) -> CompanySettings:
    company_settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if company_settings is not None:
        return company_settings

    company_settings = CompanySettings(id=str(uuid4()), company_id=company_id)
    db.add(company_settings)
    db.flush()
    return company_settings


def _to_brand_profile_response(company_id: str, company_settings: CompanySettings) -> BrandProfileResponse:
    settings_payload = _json_loads(company_settings.settings_json)
    brand_profile = settings_payload.get('brand_profile')
    brand_profile_payload = brand_profile if isinstance(brand_profile, dict) else {}

    return BrandProfileResponse(
        company_id=company_id,
        supplier_name=str(brand_profile_payload.get('supplier_name') or ''),
        address=str(brand_profile_payload.get('address') or ''),
        gst_number=str(brand_profile_payload.get('gst_number') or ''),
        pan_number=str(brand_profile_payload.get('pan_number') or ''),
        fbs_name=str(brand_profile_payload.get('fbs_name') or ''),
        vendor_company_name=str(brand_profile_payload.get('vendor_company_name') or ''),
        supplier_city=str(brand_profile_payload.get('supplier_city') or ''),
        supplier_state=str(brand_profile_payload.get('supplier_state') or ''),
        supplier_pincode=str(brand_profile_payload.get('supplier_pincode') or ''),
        delivery_from_name=str(brand_profile_payload.get('delivery_from_name') or ''),
        delivery_from_address=str(brand_profile_payload.get('delivery_from_address') or ''),
        delivery_from_city=str(brand_profile_payload.get('delivery_from_city') or ''),
        delivery_from_pincode=str(brand_profile_payload.get('delivery_from_pincode') or ''),
        origin_country=str(brand_profile_payload.get('origin_country') or 'India'),
        origin_state=str(brand_profile_payload.get('origin_state') or 'Haryana'),
        origin_district=str(brand_profile_payload.get('origin_district') or 'Gurugram'),
        bill_to_name=str(brand_profile_payload.get('bill_to_name') or DEFAULT_BILL_TO_NAME),
        bill_to_address=str(brand_profile_payload.get('bill_to_address') or DEFAULT_BILL_TO_ADDRESS),
        bill_to_gst=str(brand_profile_payload.get('bill_to_gst') or DEFAULT_BILL_TO_GST),
        bill_to_pan=str(brand_profile_payload.get('bill_to_pan') or DEFAULT_BILL_TO_PAN),
        ship_to_name=str(brand_profile_payload.get('ship_to_name') or DEFAULT_SHIP_TO_NAME),
        ship_to_address=str(brand_profile_payload.get('ship_to_address') or DEFAULT_SHIP_TO_ADDRESS),
        ship_to_gst=str(brand_profile_payload.get('ship_to_gst') or DEFAULT_SHIP_TO_GST),
        stamp_image_url=str(brand_profile_payload.get('stamp_image_url') or ''),
        instagram_handle=str(brand_profile_payload.get('instagram_handle') or ''),
        website_url=str(brand_profile_payload.get('website_url') or ''),
        facebook_handle=str(brand_profile_payload.get('facebook_handle') or ''),
        snapchat_handle=str(brand_profile_payload.get('snapchat_handle') or ''),
        invoice_prefix=company_settings.invoice_prefix or 'INV',
        default_igst_rate=float(brand_profile_payload.get('default_igst_rate') or 5),
    )


def _to_po_builder_defaults_response(
    company_id: str,
    company_settings: CompanySettings,
) -> POBuilderDefaultsResponse:
    settings_payload = _json_loads(company_settings.settings_json)
    po_builder_defaults = settings_payload.get('po_builder_defaults')
    po_builder_payload = po_builder_defaults if isinstance(po_builder_defaults, dict) else {}
    raw_ratio = po_builder_payload.get('default_size_ratio')
    default_ratio = {'S': 4, 'M': 7, 'L': 7, 'XL': 4, 'XXL': 4}
    ratio_payload = raw_ratio if isinstance(raw_ratio, dict) else {}

    normalized_ratio: dict[str, int] = {}
    for size, fallback in default_ratio.items():
        raw_value = ratio_payload.get(size)
        try:
            normalized_ratio[size] = max(0, int(raw_value))
        except (TypeError, ValueError):
            normalized_ratio[size] = fallback

    return POBuilderDefaultsResponse(
        company_id=company_id,
        default_po_price=float(po_builder_payload.get('default_po_price') or 600),
        default_osp_in_sar=float(po_builder_payload.get('default_osp_in_sar') or 95),
        default_fabric_composition=str(po_builder_payload.get('default_fabric_composition') or '100% Polyester'),
        default_size_ratio=normalized_ratio,
    )


@router.get('/brand', response_model=BrandProfileResponse)
def get_brand_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandProfileResponse:
    company_settings = _get_or_create_company_settings(db, current_user.company_id)
    db.commit()
    db.refresh(company_settings)
    return _to_brand_profile_response(current_user.company_id, company_settings)


@router.patch('/brand', response_model=BrandProfileResponse)
def update_brand_profile(
    payload: BrandProfileSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager')),
) -> BrandProfileResponse:
    company_settings = _get_or_create_company_settings(db, current_user.company_id)
    settings_payload = _json_loads(company_settings.settings_json)
    settings_payload['brand_profile'] = {
        'supplier_name': payload.supplier_name.strip(),
        'address': payload.address.strip(),
        'gst_number': payload.gst_number.strip(),
        'pan_number': payload.pan_number.strip(),
        'fbs_name': payload.fbs_name.strip(),
        'vendor_company_name': payload.vendor_company_name.strip(),
        'supplier_city': payload.supplier_city.strip(),
        'supplier_state': payload.supplier_state.strip(),
        'supplier_pincode': payload.supplier_pincode.strip(),
        'delivery_from_name': payload.delivery_from_name.strip(),
        'delivery_from_address': payload.delivery_from_address.strip(),
        'delivery_from_city': payload.delivery_from_city.strip(),
        'delivery_from_pincode': payload.delivery_from_pincode.strip(),
        'origin_country': payload.origin_country.strip(),
        'origin_state': payload.origin_state.strip(),
        'origin_district': payload.origin_district.strip(),
        'bill_to_name': payload.bill_to_name.strip(),
        'bill_to_address': payload.bill_to_address.strip(),
        'bill_to_gst': payload.bill_to_gst.strip(),
        'bill_to_pan': payload.bill_to_pan.strip(),
        'ship_to_name': payload.ship_to_name.strip(),
        'ship_to_address': payload.ship_to_address.strip(),
        'ship_to_gst': payload.ship_to_gst.strip(),
        'stamp_image_url': payload.stamp_image_url.strip(),
        'instagram_handle': payload.instagram_handle.strip(),
        'website_url': payload.website_url.strip(),
        'facebook_handle': payload.facebook_handle.strip(),
        'snapchat_handle': payload.snapchat_handle.strip(),
        'default_igst_rate': payload.default_igst_rate,
    }
    company_settings.invoice_prefix = payload.invoice_prefix.strip()
    company_settings.settings_json = _json_dumps(settings_payload)

    log_audit(
        db,
        action='settings.brand.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
    )
    db.commit()
    db.refresh(company_settings)
    return _to_brand_profile_response(current_user.company_id, company_settings)


@router.get('/po-builder', response_model=POBuilderDefaultsResponse)
def get_po_builder_defaults(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> POBuilderDefaultsResponse:
    company_settings = _get_or_create_company_settings(db, current_user.company_id)
    db.commit()
    db.refresh(company_settings)
    return _to_po_builder_defaults_response(current_user.company_id, company_settings)


@router.patch('/po-builder', response_model=POBuilderDefaultsResponse)
def update_po_builder_defaults(
    payload: POBuilderDefaultsSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager')),
) -> POBuilderDefaultsResponse:
    company_settings = _get_or_create_company_settings(db, current_user.company_id)
    settings_payload = _json_loads(company_settings.settings_json)
    settings_payload['po_builder_defaults'] = {
        'default_po_price': payload.default_po_price,
        'default_osp_in_sar': payload.default_osp_in_sar,
        'default_fabric_composition': payload.default_fabric_composition.strip(),
        'default_size_ratio': {size: int(value) for size, value in payload.default_size_ratio.items()},
    }
    company_settings.settings_json = _json_dumps(settings_payload)

    log_audit(
        db,
        action='settings.po_builder.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
    )
    db.commit()
    db.refresh(company_settings)
    return _to_po_builder_defaults_response(current_user.company_id, company_settings)


@router.get('/carton-rules', response_model=CartonCapacityRuleListResponse)
def list_carton_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=100, ge=1, le=500),
) -> CartonCapacityRuleListResponse:
    query = db.query(CartonCapacityRule).filter(CartonCapacityRule.company_id == current_user.company_id)
    total = query.count()
    rows = query.order_by(CartonCapacityRule.is_default.desc(), CartonCapacityRule.category.asc()).limit(limit).all()
    return CartonCapacityRuleListResponse(
        items=[CartonCapacityRuleResponse.model_validate(row) for row in rows],
        total=total,
    )


@router.post('/carton-rules', response_model=CartonCapacityRuleResponse, status_code=status.HTTP_201_CREATED)
def create_carton_rule(
    payload: CartonCapacityRuleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager')),
) -> CartonCapacityRuleResponse:
    rule = CartonCapacityRule(
        id=str(uuid4()),
        company_id=current_user.company_id,
        category=payload.category.strip(),
        pieces_per_carton=payload.pieces_per_carton,
        is_default=payload.is_default,
    )
    db.add(rule)
    log_audit(
        db,
        action='settings.carton_rule.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'category': rule.category},
    )
    db.commit()
    db.refresh(rule)
    return CartonCapacityRuleResponse.model_validate(rule)


def _get_carton_rule_or_404(db: Session, company_id: str, rule_id: str) -> CartonCapacityRule:
    rule = db.query(CartonCapacityRule).filter(
        CartonCapacityRule.id == rule_id,
        CartonCapacityRule.company_id == company_id,
    ).first()
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Carton rule not found.')
    return rule


@router.patch('/carton-rules/{rule_id}', response_model=CartonCapacityRuleResponse)
def update_carton_rule(
    rule_id: str,
    payload: CartonCapacityRuleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager')),
) -> CartonCapacityRuleResponse:
    rule = _get_carton_rule_or_404(db, current_user.company_id, rule_id)
    updates = payload.model_dump(exclude_unset=True)
    if 'category' in updates and updates['category'] is not None:
        rule.category = updates['category'].strip()
    if 'pieces_per_carton' in updates and updates['pieces_per_carton'] is not None:
        rule.pieces_per_carton = updates['pieces_per_carton']
    if 'is_default' in updates and updates['is_default'] is not None:
        rule.is_default = updates['is_default']

    log_audit(
        db,
        action='settings.carton_rule.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'rule_id': rule.id},
    )
    db.commit()
    db.refresh(rule)
    return CartonCapacityRuleResponse.model_validate(rule)


@router.delete('/carton-rules/{rule_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_carton_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager')),
) -> None:
    rule = _get_carton_rule_or_404(db, current_user.company_id, rule_id)
    log_audit(
        db,
        action='settings.carton_rule.delete',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'rule_id': rule.id},
    )
    db.delete(rule)
    db.commit()
