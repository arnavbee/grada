from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db.session import init_db
from app.main import app

init_db()
client = TestClient(app)


def test_admin_insights_requires_super_admin(monkeypatch) -> None:
    monkeypatch.delenv('SUPER_ADMIN_EMAILS', raising=False)
    get_settings.cache_clear()

    email = f'normal-{uuid4().hex[:8]}@grada.app'
    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Normal Co',
            'full_name': 'Normal User',
            'email': email,
            'password': 'Password1',
        },
    )
    assert register_response.status_code == 201
    access_token = register_response.json()['access_token']

    response = client.get('/api/v1/admin/insights', headers={'Authorization': f'Bearer {access_token}'})
    assert response.status_code == 403
    assert response.json()['detail'] == 'Super admin access required.'


def test_super_admin_insights_returns_global_view(monkeypatch) -> None:
    super_admin_email = f'owner-{uuid4().hex[:8]}@grada.app'
    monkeypatch.setenv('SUPER_ADMIN_EMAILS', super_admin_email)
    get_settings.cache_clear()

    super_admin_register = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Grada HQ',
            'full_name': 'Arnav',
            'email': super_admin_email,
            'password': 'Password1',
        },
    )
    assert super_admin_register.status_code == 201
    super_admin_token = super_admin_register.json()['access_token']

    member_email = f'tester-{uuid4().hex[:8]}@example.com'
    member_password = 'Password1'
    member_register = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Demo Tenant',
            'full_name': 'Tester',
            'email': member_email,
            'password': member_password,
        },
    )
    assert member_register.status_code == 201

    member_login = client.post(
        '/api/v1/auth/login',
        json={'email': member_email, 'password': member_password},
    )
    assert member_login.status_code == 200

    insights_response = client.get('/api/v1/admin/insights', headers={'Authorization': f'Bearer {super_admin_token}'})
    assert insights_response.status_code == 200

    body = insights_response.json()
    assert body['overview']['total_users'] >= 2
    assert body['overview']['total_companies'] >= 2
    assert body['overview']['recent_logins_24h'] >= 1
    assert len(body['trends']) == 14
    assert body['overview']['internal_users'] >= 1

    users_by_email = {user['email']: user for user in body['users']}
    assert users_by_email[super_admin_email]['is_super_admin'] is True
    assert users_by_email[super_admin_email]['verification_status'] == 'internal'
    assert users_by_email[super_admin_email]['signup_source'] == 'self_serve'
    assert users_by_email[member_email]['is_likely_test_user'] is True
    assert 'email domain is example.com' in users_by_email[member_email]['likely_test_signals']
    assert users_by_email[member_email]['last_seen_at'] is not None

    activity_actions = [event['action'] for event in body['recent_activity']]
    assert 'auth.login' in activity_actions
    assert 'auth.register' in activity_actions

    review_response = client.patch(
        f"/api/v1/admin/users/{users_by_email[member_email]['id']}/review",
        headers={'Authorization': f'Bearer {super_admin_token}'},
        json={'verification_status': 'verified_real', 'verification_notes': 'Confirmed paid pilot customer'},
    )
    assert review_response.status_code == 200
    review_body = review_response.json()
    assert review_body['verification_status'] == 'verified_real'
    assert review_body['verification_notes'] == 'Confirmed paid pilot customer'
    assert review_body['verified_by_email'] == super_admin_email

    refreshed_insights = client.get('/api/v1/admin/insights', headers={'Authorization': f'Bearer {super_admin_token}'})
    assert refreshed_insights.status_code == 200
    refreshed_body = refreshed_insights.json()
    refreshed_users_by_email = {user['email']: user for user in refreshed_body['users']}
    assert refreshed_users_by_email[member_email]['verification_status'] == 'verified_real'
    assert refreshed_body['overview']['verified_real_users'] >= 1

    get_settings.cache_clear()
