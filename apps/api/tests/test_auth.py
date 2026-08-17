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


def test_me_accepts_access_token_cookie() -> None:
    email = f'test-cookie-{uuid4().hex[:8]}@example.com'
    password = 'Password1'

    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Cookie Co',
            'full_name': 'Cookie Admin',
            'email': email,
            'password': password,
        },
    )
    assert register_response.status_code == 201

    access_token = register_response.json()['access_token']
    me_response = client.get('/api/v1/auth/me', cookies={'kira_access_token': access_token})

    assert me_response.status_code == 200
    assert me_response.json()['email'] == email


def test_demo_session_creates_an_isolated_seeded_workspace() -> None:
    response = client.post('/api/v1/auth/demo', headers={'Origin': 'http://127.0.0.1:3000'})

    assert response.status_code == 201
    body = response.json()
    assert body['is_demo'] is True
    assert body['demo_company_name'] == 'Apex Retail Solutions — Demo'
    assert body['access_token']

    headers = {'Authorization': f"Bearer {body['access_token']}"}
    catalog = client.get('/api/v1/catalog/products?limit=20', headers=headers)
    received_pos = client.get('/api/v1/received-pos?limit=20', headers=headers)

    assert catalog.status_code == 200
    assert catalog.json()['total'] == 14
    assert catalog.json()['items'][0]['primary_image_url'].startswith('http://127.0.0.1:3000/images/apparel/')
    assert received_pos.status_code == 200
    assert received_pos.json()['total'] == 2
    assert {item['status'] for item in received_pos.json()['items']} == {'parsed', 'confirmed'}
