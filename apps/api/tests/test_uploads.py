from pathlib import Path

from fastapi.testclient import TestClient

from app.api.v1.endpoints import uploads as uploads_endpoint
from app.main import app

client = TestClient(app)


def test_image_upload_falls_back_to_local_storage() -> None:
    response = client.post(
        '/api/v1/uploads/',
        files={'file': ('sample.png', b'\x89PNG\r\n\x1a\nfake', 'image/png')},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload['url'].startswith('/static/uploads/')
    assert payload['filename'].endswith('.png')

    saved_path = Path('apps/api/static/uploads') / payload['filename']
    if not saved_path.exists():
        # Tests run from apps/api; keep relative fallback explicit.
        saved_path = Path('static/uploads') / payload['filename']
    assert saved_path.exists()


def test_image_upload_uses_object_storage_when_enabled(monkeypatch) -> None:
    monkeypatch.setattr(uploads_endpoint.object_storage, '_enabled', True)
    monkeypatch.setattr(
        uploads_endpoint.object_storage,
        'upload_bytes',
        lambda **kwargs: f'https://cdn.example.com/{kwargs["key"]}',
    )

    response = client.post(
        '/api/v1/uploads/',
        files={'file': ('sample.jpg', b'\xff\xd8\xff\xe0fake', 'image/jpeg')},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload['url'].startswith('https://cdn.example.com/uploads/')
    assert payload['filename'].endswith('.jpg')

