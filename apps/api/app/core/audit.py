import json
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_audit(
    db: Session,
    *,
    action: str,
    user_id: str | None = None,
    company_id: str | None = None,
    metadata: dict[str, str] | None = None,
) -> None:
    event = AuditLog(
        id=str(uuid4()),
        user_id=user_id,
        company_id=company_id,
        action=action,
        metadata_json=json.dumps(metadata or {}),
    )
    db.add(event)
    db.flush()
