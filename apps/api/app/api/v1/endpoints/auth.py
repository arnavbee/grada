import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.db.session import get_db
from app.models.company import Company
from app.models.company_settings import CompanySettings
from app.models.user import User
from app.schemas.auth import (
    AuthTokens,
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


def _build_user_response(db: Session, user: User) -> UserResponse:
    company_name = db.query(Company.name).filter(Company.id == user.company_id).scalar()
    user_payload = UserResponse.model_validate(user).model_dump()
    user_payload['company_name'] = company_name
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

    user.last_login = datetime.now(timezone.utc)
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
