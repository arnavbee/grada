from pathlib import Path

from alembic import command
from alembic.config import Config
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()

def _normalize_database_url(raw_url: str) -> str:
    normalized = (raw_url or '').strip()
    if normalized.startswith('postgres://'):
        return normalized.replace('postgres://', 'postgresql+psycopg://', 1)
    if normalized.startswith('postgresql://') and '+psycopg' not in normalized:
        return normalized.replace('postgresql://', 'postgresql+psycopg://', 1)
    return normalized


database_url = _normalize_database_url(settings.database_url)
connect_args = {'check_same_thread': False} if database_url.startswith('sqlite') else {}
engine = create_engine(database_url, connect_args=connect_args, future=True)
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
    run_migrations()


def run_migrations() -> None:
    alembic_ini_path = Path(__file__).resolve().parents[2] / 'alembic.ini'
    config = Config(str(alembic_ini_path))
    config.set_main_option('sqlalchemy.url', database_url)
    command.upgrade(config, 'head')
