from pathlib import Path

from alembic import command
from alembic.config import Config
from collections.abc import Generator

from sqlalchemy import create_engine
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
    run_migrations()


def run_migrations() -> None:
    alembic_ini_path = Path(__file__).resolve().parents[2] / 'alembic.ini'
    config = Config(str(alembic_ini_path))
    config.set_main_option('sqlalchemy.url', settings.database_url)
    command.upgrade(config, 'head')
