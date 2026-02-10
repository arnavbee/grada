from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_env: str = 'development'
    database_url: str = 'sqlite:///./kira.db'
    OPENAI_API_KEY: str

    jwt_secret_key: str = 'change-me'
    jwt_refresh_secret_key: str = 'change-me-too'
    jwt_access_token_expires_minutes: int = 30
    jwt_refresh_token_expires_minutes: int = 10080

    password_reset_token_expires_minutes: int = 30
    session_timeout_hours: int = 24

    frontend_origins: str = 'http://localhost:3000,http://127.0.0.1:3000'


@lru_cache
def get_settings() -> Settings:
    return Settings()
