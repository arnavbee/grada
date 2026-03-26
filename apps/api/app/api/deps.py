from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_access_token
from app.core.super_admin import is_super_admin_user
from app.db.session import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    request: Request,
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
) -> User:
    token: str | None = None
    if credentials is not None:
        token = credentials.credentials.strip() if credentials.credentials else None

    if not token:
        fallback_header = request.headers.get('x-access-token', '').strip()
        if fallback_header.lower().startswith('bearer '):
            fallback_header = fallback_header.removeprefix('Bearer ').strip()
        token = fallback_header or None

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required.')

    try:
        payload = decode_access_token(token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = (
        db.query(User)
        .filter(
            User.id == payload.get('sub'),
            User.company_id == payload.get('company_id'),
            User.is_active.is_(True),
        )
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found or inactive.')

    now = datetime.now(timezone.utc)
    last_seen = user.last_seen_at
    if last_seen is None or (
        (last_seen.replace(tzinfo=timezone.utc) if last_seen.tzinfo is None else last_seen.astimezone(timezone.utc))
        <= now - timedelta(minutes=5)
    ):
        user.last_seen_at = now
        db.commit()
        db.refresh(user)

    return user


def require_roles(*allowed_roles: str) -> Callable[[User], User]:
    def dependency(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Insufficient permissions.')
        return current_user

    return dependency


def require_super_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if not is_super_admin_user(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Super admin access required.')
    return current_user


def optional_user_from_state(request: Request, db: DbSession) -> User | None:
    auth_payload: dict[str, Any] | None = getattr(request.state, 'auth_payload', None)
    if auth_payload is None:
        return None
    user_id = auth_payload.get('sub')
    company_id = auth_payload.get('company_id')
    if not user_id or not company_id:
        return None
    return db.query(User).filter(User.id == user_id, User.company_id == company_id, User.is_active.is_(True)).first()
