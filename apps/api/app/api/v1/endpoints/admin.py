import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_super_admin
from app.core.audit import log_audit
from app.core.super_admin import is_super_admin_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.user import User
from app.schemas.admin import (
    AdminActivityRecord,
    AdminCompanyRecord,
    AdminInsightsResponse,
    AdminOverviewStats,
    AdminTrendPoint,
    AdminUserRecord,
    AdminUserReviewRequest,
)

router = APIRouter(prefix='/admin', tags=['admin'])

TEST_EMAIL_DOMAINS = {'example.com', 'mailinator.com'}
TEST_TOKENS = ('test', 'demo', 'sample', 'mock', 'fake', 'qa', 'sandbox', 'dummy')


def _normalize_text(value: str | None) -> str:
    return (value or '').strip().lower()


def _infer_test_signals(user: User, company_name: str | None) -> list[str]:
    signals: list[str] = []
    email = _normalize_text(user.email)
    full_name = _normalize_text(user.full_name)
    company = _normalize_text(company_name)

    domain = email.split('@', 1)[1] if '@' in email else ''
    if domain in TEST_EMAIL_DOMAINS:
        signals.append(f'email domain is {domain}')

    if any(token in email for token in TEST_TOKENS):
        signals.append('email contains test-like keyword')

    if any(token in full_name for token in TEST_TOKENS):
        signals.append('name contains test-like keyword')

    if any(token in company for token in TEST_TOKENS):
        signals.append('company contains test-like keyword')

    return signals


def _parse_metadata(raw: str) -> dict[str, str]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}

    if not isinstance(parsed, dict):
        return {}

    metadata: dict[str, str] = {}
    for key, value in parsed.items():
        metadata[str(key)] = '' if value is None else str(value)
    return metadata


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _classification_label(user: User, is_likely_test_user: bool) -> str:
    if user.verification_status == 'verified_real':
        return 'Verified real'
    if user.verification_status == 'internal':
        return 'Internal'
    if user.verification_status == 'flagged_test':
        return 'Flagged test'
    return 'Likely test' if is_likely_test_user else 'Likely real'


def _build_user_record(
    *,
    user: User,
    company_name: str | None,
    login_count: int,
    reviewer_email: str | None,
) -> AdminUserRecord:
    likely_test_signals = _infer_test_signals(user, company_name)
    is_likely_test_user = len(likely_test_signals) > 0
    return AdminUserRecord(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        company_id=user.company_id,
        company_name=company_name,
        is_active=user.is_active,
        is_super_admin=is_super_admin_user(user),
        is_likely_test_user=is_likely_test_user,
        likely_test_signals=likely_test_signals,
        signup_source=user.signup_source,
        verification_status=user.verification_status,
        verification_notes=_normalize_optional_text(user.verification_notes),
        verified_by_user_id=user.verified_by_user_id,
        verified_by_email=reviewer_email,
        verified_at=_as_utc(user.verified_at),
        created_at=_as_utc(user.created_at) or user.created_at,
        last_seen_at=_as_utc(user.last_seen_at),
        last_login=_as_utc(user.last_login),
        login_count=login_count,
    )


def _build_trend_points(users: list[User], login_events: list[AuditLog], *, days: int = 14) -> list[AdminTrendPoint]:
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)

    login_counts: dict[str, int] = {}
    for event in login_events:
        created_at = _as_utc(event.created_at)
        if created_at is None:
            continue
        key = created_at.date().isoformat()
        login_counts[key] = login_counts.get(key, 0) + 1

    signup_counts: dict[str, int] = {}
    for user in users:
        created_at = _as_utc(user.created_at)
        if created_at is None:
            continue
        key = created_at.date().isoformat()
        signup_counts[key] = signup_counts.get(key, 0) + 1

    points: list[AdminTrendPoint] = []
    for offset in range(days):
        day = start_date + timedelta(days=offset)
        key = day.isoformat()
        points.append(
            AdminTrendPoint(
                date=key,
                login_count=login_counts.get(key, 0),
                signup_count=signup_counts.get(key, 0),
            )
        )
    return points


@router.get('/insights', response_model=AdminInsightsResponse)
def get_admin_insights(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
    user_limit: int = Query(default=200, ge=1, le=500),
    activity_limit: int = Query(default=100, ge=1, le=300),
) -> AdminInsightsResponse:
    now = datetime.now(timezone.utc)
    users = db.query(User).order_by(User.created_at.desc()).all()
    companies = db.query(Company).order_by(Company.created_at.desc()).all()
    company_by_id = {company.id: company for company in companies}
    reviewer_ids = {user.verified_by_user_id for user in users if user.verified_by_user_id}
    reviewers = db.query(User).filter(User.id.in_(reviewer_ids)).all() if reviewer_ids else []
    reviewer_by_id = {reviewer.id: reviewer for reviewer in reviewers}

    login_counts = {
        user_id: count
        for user_id, count in (
            db.query(AuditLog.user_id, func.count(AuditLog.id))
            .filter(AuditLog.action == 'auth.login', AuditLog.user_id.is_not(None))
            .group_by(AuditLog.user_id)
            .all()
        )
    }

    last_logins_by_company = {
        company_id: last_login
        for company_id, last_login in (
            db.query(AuditLog.company_id, func.max(AuditLog.created_at))
            .filter(AuditLog.action == 'auth.login', AuditLog.company_id.is_not(None))
            .group_by(AuditLog.company_id)
            .all()
        )
    }

    trend_cutoff = now - timedelta(days=13)
    login_events_for_trends = (
        db.query(AuditLog)
        .filter(AuditLog.action == 'auth.login', AuditLog.created_at >= trend_cutoff)
        .order_by(AuditLog.created_at.asc())
        .all()
    )

    user_records: list[AdminUserRecord] = []
    for user in users:
        company_name = company_by_id.get(user.company_id).name if user.company_id in company_by_id else None
        reviewer_email = reviewer_by_id[user.verified_by_user_id].email if user.verified_by_user_id in reviewer_by_id else None
        user_records.append(
            _build_user_record(
                user=user,
                company_name=company_name,
                login_count=int(login_counts.get(user.id, 0) or 0),
                reviewer_email=reviewer_email,
            )
        )

    user_count_by_company: dict[str, int] = {}
    active_user_count_by_company: dict[str, int] = {}
    likely_real_user_count_by_company: dict[str, int] = {}
    for record in user_records:
        user_count_by_company[record.company_id] = user_count_by_company.get(record.company_id, 0) + 1
        if record.is_active:
            active_user_count_by_company[record.company_id] = active_user_count_by_company.get(record.company_id, 0) + 1
        if record.verification_status == 'verified_real' or (
            record.verification_status == 'unreviewed' and not record.is_likely_test_user
        ):
            likely_real_user_count_by_company[record.company_id] = (
                likely_real_user_count_by_company.get(record.company_id, 0) + 1
            )

    company_records = [
        AdminCompanyRecord(
            id=company.id,
            name=company.name,
            user_count=user_count_by_company.get(company.id, 0),
            active_user_count=active_user_count_by_company.get(company.id, 0),
            likely_real_user_count=likely_real_user_count_by_company.get(company.id, 0),
            last_login_at=_as_utc(last_logins_by_company.get(company.id)),
            created_at=_as_utc(company.created_at) or company.created_at,
        )
        for company in companies
    ]
    company_records.sort(key=lambda company: (company.user_count, company.created_at), reverse=True)

    audit_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(activity_limit).all()
    user_by_id = {user.id: user for user in users}

    recent_activity = [
        AdminActivityRecord(
            id=event.id,
            action=event.action,
            created_at=_as_utc(event.created_at) or event.created_at,
            user_id=event.user_id,
            email=user_by_id[event.user_id].email if event.user_id and event.user_id in user_by_id else metadata.get('email'),
            full_name=user_by_id[event.user_id].full_name if event.user_id and event.user_id in user_by_id else None,
            company_id=event.company_id,
            company_name=company_by_id[event.company_id].name if event.company_id and event.company_id in company_by_id else None,
            metadata=metadata,
        )
        for event in audit_logs
        for metadata in [_parse_metadata(event.metadata_json)]
    ]

    likely_test_user_count = sum(
        1
        for user in user_records
        if user.verification_status == 'flagged_test'
        or (user.verification_status == 'unreviewed' and user.is_likely_test_user)
    )
    verified_real_user_count = sum(1 for user in user_records if user.verification_status == 'verified_real')
    internal_user_count = sum(1 for user in user_records if user.verification_status == 'internal')
    flagged_test_user_count = sum(1 for user in user_records if user.verification_status == 'flagged_test')

    overview = AdminOverviewStats(
        total_users=len(user_records),
        active_users=sum(1 for user in user_records if user.is_active),
        total_companies=len(company_records),
        recent_logins_24h=db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == 'auth.login', AuditLog.created_at >= now - timedelta(hours=24))
        .scalar()
        or 0,
        new_users_7d=sum(
            1
            for user in user_records
            if _as_utc(user.created_at) and _as_utc(user.created_at) >= now - timedelta(days=7)
        ),
        likely_test_users=likely_test_user_count,
        likely_real_users=len(user_records) - likely_test_user_count,
        verified_real_users=verified_real_user_count,
        internal_users=internal_user_count,
        flagged_test_users=flagged_test_user_count,
    )

    return AdminInsightsResponse(
        overview=overview,
        trends=_build_trend_points(users, login_events_for_trends),
        users=user_records[:user_limit],
        companies=company_records[:50],
        recent_activity=recent_activity,
    )


@router.patch('/users/{user_id}/review', response_model=AdminUserRecord)
def review_user(
    user_id: str,
    payload: AdminUserReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
) -> AdminUserRecord:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail='User not found.')

    user.verification_status = payload.verification_status
    user.verification_notes = _normalize_optional_text(payload.verification_notes)
    if payload.verification_status == 'unreviewed':
        user.verified_at = None
        user.verified_by_user_id = None
    else:
        user.verified_at = datetime.now(timezone.utc)
        user.verified_by_user_id = current_user.id

    log_audit(
        db,
        action='admin.user_review',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={
            'target_user_id': user.id,
            'target_email': user.email,
            'verification_status': user.verification_status,
        },
    )
    db.commit()
    db.refresh(user)

    company_name = db.query(Company.name).filter(Company.id == user.company_id).scalar()
    login_count = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.action == 'auth.login', AuditLog.user_id == user.id)
        .scalar()
        or 0
    )
    return _build_user_record(
        user=user,
        company_name=company_name,
        login_count=int(login_count),
        reviewer_email=current_user.email if user.verified_by_user_id else None,
    )
