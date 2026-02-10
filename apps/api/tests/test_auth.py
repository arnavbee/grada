from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import init_db
from app.main import app

init_db()
client = TestClient(app)


def test_register_login_refresh_and_reset_flow() -> None:
    email = f'test-{uuid4().hex[:8]}@example.com'
    password = 'Password1'

    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Acme Fashion',
            'full_name': 'Ops Admin',
            'email': email,
            'password': password,
        },
    )
    assert register_response.status_code == 201
    register_body = register_response.json()
    assert register_body['access_token']
    assert register_body['refresh_token']

    login_response = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    assert login_response.status_code == 200
    login_body = login_response.json()

    me_response = client.get(
        '/api/v1/auth/me', headers={'Authorization': f"Bearer {login_body['access_token']}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()['email'] == email

    refresh_response = client.post(
        '/api/v1/auth/refresh-token', json={'refresh_token': login_body['refresh_token']}
    )
    assert refresh_response.status_code == 200

    forgot_response = client.post('/api/v1/auth/forgot-password', json={'email': email})
    assert forgot_response.status_code == 200
    reset_token = forgot_response.json().get('reset_token')
    assert reset_token

    reset_response = client.post(
        '/api/v1/auth/reset-password',
        json={'token': reset_token, 'new_password': 'NewPassword1'},
    )
    assert reset_response.status_code == 200

    login_new_response = client.post(
        '/api/v1/auth/login', json={'email': email, 'password': 'NewPassword1'}
    )
    assert login_new_response.status_code == 200
