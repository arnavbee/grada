from functools import lru_cache
from urllib.parse import quote

from app.core.config import get_settings


class ObjectStorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None
        self._enabled = all(
            (
                self.settings.R2_ENDPOINT,
                self.settings.R2_ACCESS_KEY_ID,
                self.settings.R2_SECRET_ACCESS_KEY,
                self.settings.R2_BUCKET,
            )
        )

    @property
    def enabled(self) -> bool:
        return bool(self._enabled)

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
            endpoint_url=self.settings.R2_ENDPOINT,
            aws_access_key_id=self.settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=self.settings.R2_SECRET_ACCESS_KEY,
            region_name=self.settings.R2_REGION,
        )
        return self._client

    def upload_bytes(self, *, key: str, content: bytes, content_type: str) -> str | None:
        client = self._client_or_none()
        if client is None:
            return None

        client.put_object(
            Bucket=self.settings.R2_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type,
            CacheControl='public, max-age=31536000, immutable',
        )
        return self.build_public_url(key)

    def build_public_url(self, key: str) -> str:
        encoded_key = quote(key)

        if self.settings.R2_PUBLIC_BASE_URL:
            base = self.settings.R2_PUBLIC_BASE_URL.rstrip('/')
            return f'{base}/{encoded_key}'

        endpoint = (self.settings.R2_ENDPOINT or '').rstrip('/')
        bucket = self.settings.R2_BUCKET or ''
        return f'{endpoint}/{bucket}/{encoded_key}'


@lru_cache
def get_object_storage_service() -> ObjectStorageService:
    return ObjectStorageService()

