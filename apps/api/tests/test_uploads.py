from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.v1.endpoints import uploads as uploads_endpoint
from app.main import app

client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    email = f'uploads-{uuid4().hex[:8]}@example.com'
    response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Upload Tenant',
            'full_name': 'Upload Admin',
            'email': email,
            'password': 'Password1',
        },
    )
    assert response.status_code == 201
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def test_image_upload_requires_authentication() -> None:
    response = client.post(
        '/api/v1/uploads/',
        files={'file': ('sample.png', b'\x89PNG\r\n\x1a\nfake', 'image/png')},
    )
    assert response.status_code == 401


def test_image_upload_falls_back_to_local_storage() -> None:
    headers = _auth_headers()
    response = client.post(
        '/api/v1/uploads/',
        headers=headers,
        files={'file': ('sample.png', b'\x89PNG\r\n\x1a\nfake', 'image/png')},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload['url'].startswith('/static/uploads/')
    assert payload['filename'].endswith('.png')

    relative_static_path = payload['url'].removeprefix('/static/')
    saved_path = Path('apps/api/static') / relative_static_path
    if not saved_path.exists():
        # Tests run from apps/api; keep relative fallback explicit.
        saved_path = Path('static') / relative_static_path
    assert saved_path.exists()


def test_image_upload_uses_object_storage_when_enabled(monkeypatch) -> None:
    headers = _auth_headers()
    monkeypatch.setattr(uploads_endpoint.object_storage, '_enabled', True)
    monkeypatch.setattr(
        uploads_endpoint.object_storage,
        'upload_bytes',
        lambda **kwargs: f'https://cdn.example.com/{kwargs["key"]}',
    )

    response = client.post(
        '/api/v1/uploads/',
        headers=headers,
        files={'file': ('sample.jpg', b'\xff\xd8\xff\xe0fake', 'image/jpeg')},
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload['url'].startswith('https://cdn.example.com/uploads/')
    assert payload['filename'].endswith('.jpg')
