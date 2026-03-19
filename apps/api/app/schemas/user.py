from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal['admin', 'manager', 'operator', 'viewer']
VerificationStatus = Literal['unreviewed', 'verified_real', 'internal', 'flagged_test']


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: Role
    company_id: str
    company_name: str | None = None
    is_super_admin: bool = False
    is_active: bool
    signup_source: str = 'self_serve'
    verification_status: VerificationStatus = 'unreviewed'
    verification_notes: str | None = None
    verified_by_user_id: str | None = None
    verified_at: datetime | None = None
    created_at: datetime
    last_seen_at: datetime | None = None
    last_login: datetime | None = None


class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    role: Role
    password: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    role: Role | None = None
    is_active: bool | None = None
