from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=['argon2', 'bcrypt'], deprecated='auto')
settings = get_settings()


class TokenError(ValueError):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def validate_password_policy(password: str) -> None:
    if len(password) < 8:
        raise TokenError('Password must be at least 8 characters long.')
    if not any(char.isupper() for char in password):
        raise TokenError('Password must include at least one uppercase letter.')
    if not any(char.isdigit() for char in password):
        raise TokenError('Password must include at least one number.')


def _encode_token(payload: dict[str, Any], secret_key: str, expires_delta_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    to_encode = payload.copy()
    to_encode.update({'iat': now, 'exp': now + timedelta(minutes=expires_delta_minutes)})
    return jwt.encode(to_encode, secret_key, algorithm='HS256')


def create_access_token(*, user_id: str, company_id: str, role: str) -> str:
    return _encode_token(
        {'sub': user_id, 'company_id': company_id, 'role': role, 'type': 'access'},
        settings.jwt_secret_key,
        settings.jwt_access_token_expires_minutes,
    )


def create_refresh_token(*, user_id: str, company_id: str, role: str) -> str:
    return _encode_token(
        {'sub': user_id, 'company_id': company_id, 'role': role, 'type': 'refresh'},
        settings.jwt_refresh_secret_key,
        settings.jwt_refresh_token_expires_minutes,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=['HS256'])
    except JWTError as exc:
        raise TokenError('Invalid access token.') from exc
    if payload.get('type') != 'access':
        raise TokenError('Invalid token type.')
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_refresh_secret_key, algorithms=['HS256'])
    except JWTError as exc:
        raise TokenError('Invalid refresh token.') from exc
    if payload.get('type') != 'refresh':
        raise TokenError('Invalid token type.')
    return payload
