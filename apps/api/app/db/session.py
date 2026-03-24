from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()

connect_args = {'check_same_thread': False} if settings.database_url.startswith('sqlite') else {}
engine = create_engine(settings.database_url, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_user_tracking_columns()
    _ensure_barcode_job_columns()


def _ensure_user_tracking_columns() -> None:
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('users')}
    column_ddls = {
        'signup_source': "ALTER TABLE users ADD COLUMN signup_source VARCHAR(64) NOT NULL DEFAULT 'self_serve'",
        'verification_status': (
            "ALTER TABLE users ADD COLUMN verification_status VARCHAR(32) NOT NULL DEFAULT 'unreviewed'"
        ),
        'verification_notes': 'ALTER TABLE users ADD COLUMN verification_notes VARCHAR(512)',
        'verified_by_user_id': 'ALTER TABLE users ADD COLUMN verified_by_user_id VARCHAR(36)',
        'verified_at': 'ALTER TABLE users ADD COLUMN verified_at TIMESTAMP',
        'last_seen_at': 'ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP',
    }

    with engine.begin() as connection:
        for column_name, ddl in column_ddls.items():
            if column_name not in existing_columns:
                connection.execute(text(ddl))


def _ensure_barcode_job_columns() -> None:
    inspector = inspect(engine)
    if 'barcode_jobs' not in inspector.get_table_names():
        return

    existing_columns = {column['name'] for column in inspector.get_columns('barcode_jobs')}
    column_ddls = {
        'template_kind': "ALTER TABLE barcode_jobs ADD COLUMN template_kind VARCHAR(16) NOT NULL DEFAULT 'styli'",
        'template_id': 'ALTER TABLE barcode_jobs ADD COLUMN template_id VARCHAR(36)',
        'total_pages': 'ALTER TABLE barcode_jobs ADD COLUMN total_pages INTEGER NOT NULL DEFAULT 0',
    }

    with engine.begin() as connection:
        for column_name, ddl in column_ddls.items():
            if column_name not in existing_columns:
                connection.execute(text(ddl))
