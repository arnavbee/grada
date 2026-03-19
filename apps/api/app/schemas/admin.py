from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


class AdminOverviewStats(BaseModel):
    total_users: int
    active_users: int
    total_companies: int
    recent_logins_24h: int
    new_users_7d: int
    likely_test_users: int
    likely_real_users: int
    verified_real_users: int
    internal_users: int
    flagged_test_users: int


class AdminTrendPoint(BaseModel):
    date: str
    login_count: int
    signup_count: int


class AdminUserRecord(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    company_id: str
    company_name: str | None = None
    is_active: bool
    is_super_admin: bool
    is_likely_test_user: bool
    likely_test_signals: list[str]
    signup_source: str
    verification_status: str
    verification_notes: str | None = None
    verified_by_user_id: str | None = None
    verified_by_email: str | None = None
    verified_at: datetime | None = None
    created_at: datetime
    last_seen_at: datetime | None = None
    last_login: datetime | None = None
    login_count: int


class AdminCompanyRecord(BaseModel):
    id: str
    name: str
    user_count: int
    active_user_count: int
    likely_real_user_count: int
    last_login_at: datetime | None = None
    created_at: datetime


class AdminActivityRecord(BaseModel):
    id: str
    action: str
    created_at: datetime
    user_id: str | None = None
    email: str | None = None
    full_name: str | None = None
    company_id: str | None = None
    company_name: str | None = None
    metadata: dict[str, str]


class AdminInsightsResponse(BaseModel):
    overview: AdminOverviewStats
    trends: list[AdminTrendPoint]
    users: list[AdminUserRecord]
    companies: list[AdminCompanyRecord]
    recent_activity: list[AdminActivityRecord]


class AdminUserReviewRequest(BaseModel):
    verification_status: Literal['unreviewed', 'verified_real', 'internal', 'flagged_test']
    verification_notes: str | None = None
