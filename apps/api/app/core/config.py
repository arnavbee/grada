from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Never override real environment variables: platform-injected config (Render,
# Docker, CI) must win over the on-disk .env used for local development.
# This runs at import time, before any Settings instance reads the env.
env_path = Path(__file__).resolve().parents[2] / '.env'
load_dotenv(dotenv_path=env_path, override=False)

_INSECURE_JWT_DEFAULTS = {'change-me', 'change-me-too', ''}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_env: str = 'development'
    database_url: str = 'sqlite:///./kira.db'
    OPENAI_API_KEY: str = ''
    ai_model: str = 'gpt-4o'
    ai_base_url: str | None = None

    jwt_secret_key: str = 'change-me'
    jwt_refresh_secret_key: str = 'change-me-too'
    jwt_access_token_expires_minutes: int = 30
    jwt_refresh_token_expires_minutes: int = 10080

    password_reset_token_expires_minutes: int = 30
    session_timeout_hours: int = 24

    frontend_origins: str = 'http://localhost:3000,http://127.0.0.1:3000'
    super_admin_emails: str = ''

    # Optional S3-compatible object storage (Cloudflare R2, S3, MinIO, etc.)
    R2_ENDPOINT: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET: str | None = None
    R2_PUBLIC_BASE_URL: str | None = None
    R2_REGION: str = 'auto'

    job_worker_enabled: bool = True
    job_worker_poll_interval_seconds: float = 0.5

    # Escape hatch for single-instance demo deploys that knowingly accept
    # ephemeral storage. Production refuses to boot without it unless R2 is set.
    allow_ephemeral_storage: bool = False

    rate_limit_enabled: bool = True

    @property
    def is_production(self) -> bool:
        return self.app_env == 'production'

    def validate_for_environment(self) -> None:
        """Fail fast on configuration that must never reach production."""
        if not self.is_production:
            return
        if (
            self.jwt_secret_key in _INSECURE_JWT_DEFAULTS
            or self.jwt_refresh_secret_key in _INSECURE_JWT_DEFAULTS
        ):
            raise RuntimeError(
                'Refusing to start: JWT_SECRET_KEY / JWT_REFRESH_SECRET_KEY are unset or '
                'still the insecure defaults. Generate strong values, e.g. '
                "`python -c \"import secrets; print(secrets.token_urlsafe(48))\"`."
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
