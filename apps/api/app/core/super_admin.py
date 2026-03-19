from app.core.config import get_settings
from app.models.user import User


def get_super_admin_emails() -> set[str]:
    raw = get_settings().super_admin_emails
    return {email.strip().lower() for email in raw.split(',') if email.strip()}


def is_super_admin_email(email: str | None) -> bool:
    if not email:
        return False
    return email.strip().lower() in get_super_admin_emails()


def is_super_admin_user(user: User) -> bool:
    return is_super_admin_email(user.email)
