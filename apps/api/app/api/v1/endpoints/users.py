import secrets
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.audit import log_audit
from app.core.config import get_settings
from app.core.security import hash_password, validate_password_policy
from app.core.super_admin import is_super_admin_email
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.user import UserCreateRequest, UserResponse, UserUpdateRequest

router = APIRouter(prefix='/users', tags=['users'])
settings = get_settings()


@router.get('', response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
) -> list[UserResponse]:
    users = db.query(User).filter(User.company_id == current_user.company_id).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(user) for user in users]


@router.post('', response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
) -> MessageResponse:
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already exists.')

    temp_password = payload.password or secrets.token_urlsafe(10) + 'A1'
    validate_password_policy(temp_password)

    invited_user = User(
        id=str(uuid4()),
        email=payload.email.lower(),
        password_hash=hash_password(temp_password),
        full_name=payload.full_name,
        role=payload.role,
        company_id=current_user.company_id,
        is_active=True,
        signup_source='admin_invite',
        verification_status='internal' if is_super_admin_email(payload.email.lower()) else 'unreviewed',
        verified_at=datetime.now(timezone.utc) if is_super_admin_email(payload.email.lower()) else None,
    )
    db.add(invited_user)

    log_audit(
        db,
        action='users.invite',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'invited_email': invited_user.email, 'role': invited_user.role},
    )
    db.commit()

    suffix = (
        f' Temporary password: {temp_password}'
        if settings.app_env != 'production' and payload.password is None
        else ''
    )
    return MessageResponse(message=f'User invited successfully.{suffix}')


@router.put('/{user_id}', response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
) -> UserResponse:
    user = db.query(User).filter(User.id == user_id, User.company_id == current_user.company_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        if user.id == current_user.id and not payload.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot deactivate your own account.')
        user.is_active = payload.is_active

    log_audit(
        db,
        action='users.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'target_user_id': user.id},
    )
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete('/{user_id}', response_model=MessageResponse)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin')),
) -> MessageResponse:
    user = db.query(User).filter(User.id == user_id, User.company_id == current_user.company_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot deactivate your own account.')

    user.is_active = False
    log_audit(
        db,
        action='users.deactivate',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'target_user_id': user.id},
    )
    db.commit()
    return MessageResponse(message='User deactivated successfully.')
