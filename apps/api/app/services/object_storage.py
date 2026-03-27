from functools import lru_cache
from urllib.parse import quote

from app.core.config import get_settings


def _clean_secret(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.replace('\r', '').replace('\n', '').strip()
    return cleaned or None


class ObjectStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        self._r2_endpoint = _clean_secret(self.settings.R2_ENDPOINT)
        self._r2_access_key_id = _clean_secret(self.settings.R2_ACCESS_KEY_ID)
        self._r2_secret_access_key = _clean_secret(self.settings.R2_SECRET_ACCESS_KEY)
        self._r2_bucket = _clean_secret(self.settings.R2_BUCKET)
        self._r2_public_base_url = _clean_secret(self.settings.R2_PUBLIC_BASE_URL)
        self._r2_region = _clean_secret(self.settings.R2_REGION) or 'auto'
        self._enabled = all(
            (
                self._r2_endpoint,
                self._r2_access_key_id,
                self._r2_secret_access_key,
                self._r2_bucket,
            )
        )

    @property
    def enabled(self) -> bool:
        return bool(self._enabled)

    @property
    def backend(self) -> str:
        return 'r2' if self.enabled else 'local'

    @property
    def public_base_configured(self) -> bool:
        return bool(self._r2_public_base_url)

    def status_summary(self) -> dict[str, object]:
        return {
            'enabled': self.enabled,
            'backend': self.backend,
            'public_base_configured': self.public_base_configured,
        }

    def _client_or_none(self):
        if not self.enabled:
            return None
        if self._client is not None:
            return self._client
        try:
            import boto3
        except ImportError:
            return None
        self._client = boto3.client(
            's3',
            endpoint_url=self._r2_endpoint,
            aws_access_key_id=self._r2_access_key_id,
            aws_secret_access_key=self._r2_secret_access_key,
            region_name=self._r2_region,
        )
        return self._client

    def upload_bytes(self, *, key: str, content: bytes, content_type: str) -> str | None:
        client = self._client_or_none()
        if client is None:
            return None

        client.put_object(
            Bucket=self._r2_bucket,
            Key=key,
            Body=content,
            ContentType=content_type,
            CacheControl='public, max-age=31536000, immutable',
        )
        return self.build_public_url(key)

    def build_public_url(self, key: str) -> str:
        encoded_key = quote(key)

        if self._r2_public_base_url:
            base = self._r2_public_base_url.rstrip('/')
            return f'{base}/{encoded_key}'

        endpoint = (self._r2_endpoint or '').rstrip('/')
        bucket = self._r2_bucket or ''
        return f'{endpoint}/{bucket}/{encoded_key}'


@lru_cache
def get_object_storage_service() -> ObjectStorageService:
    return ObjectStorageService()
