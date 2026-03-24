from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import init_db
from app.main import app

init_db()
client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    email = f'settings-{uuid4().hex[:8]}@example.com'
    response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Settings Co',
            'full_name': 'Settings Admin',
            'email': email,
            'password': 'Password1',
        },
    )
    assert response.status_code == 201
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def test_brand_profile_po_builder_defaults_and_carton_rule_crud() -> None:
    headers = _auth_headers()

    brand_get = client.get('/api/v1/settings/brand', headers=headers)
    assert brand_get.status_code == 200
    assert brand_get.json()['invoice_prefix'] == 'INV'

    po_builder_get = client.get('/api/v1/settings/po-builder', headers=headers)
    assert po_builder_get.status_code == 200
    assert po_builder_get.json()['default_po_price'] == 600
    assert po_builder_get.json()['default_size_ratio']['M'] == 7

    brand_patch = client.patch(
        '/api/v1/settings/brand',
        headers=headers,
        json={
            'supplier_name': 'House of Grada LLP',
            'address': 'Jaipur, Rajasthan, India',
            'gst_number': '08ABCDE1234F1Z5',
            'pan_number': 'ABCDE1234F',
            'bill_to_address': 'Styli Billing Address',
            'ship_to_address': 'Styli Warehouse Address',
            'invoice_prefix': 'HG',
            'default_igst_rate': 12,
        },
    )
    assert brand_patch.status_code == 200
    assert brand_patch.json()['supplier_name'] == 'House of Grada LLP'
    assert brand_patch.json()['invoice_prefix'] == 'HG'
    assert brand_patch.json()['default_igst_rate'] == 12

    po_builder_patch = client.patch(
        '/api/v1/settings/po-builder',
        headers=headers,
        json={
            'default_po_price': 650,
            'default_osp_in_sar': 102,
            'default_fabric_composition': '95% Polyester, 5% Spandex',
            'default_size_ratio': {'S': 4, 'M': 8, 'L': 8, 'XL': 4, 'XXL': 2},
        },
    )
    assert po_builder_patch.status_code == 200
    assert po_builder_patch.json()['default_po_price'] == 650
    assert po_builder_patch.json()['default_osp_in_sar'] == 102
    assert po_builder_patch.json()['default_fabric_composition'] == '95% Polyester, 5% Spandex'
    assert po_builder_patch.json()['default_size_ratio']['M'] == 8

    create_rule = client.post(
        '/api/v1/settings/carton-rules',
        headers=headers,
        json={'category': 'Dresses', 'pieces_per_carton': 20, 'is_default': True},
    )
    assert create_rule.status_code == 201
    rule_id = create_rule.json()['id']
    assert create_rule.json()['category'] == 'Dresses'

    list_rules = client.get('/api/v1/settings/carton-rules', headers=headers)
    assert list_rules.status_code == 200
    assert list_rules.json()['total'] >= 1

    update_rule = client.patch(
        f'/api/v1/settings/carton-rules/{rule_id}',
        headers=headers,
        json={'pieces_per_carton': 24, 'is_default': False},
    )
    assert update_rule.status_code == 200
    assert update_rule.json()['pieces_per_carton'] == 24
    assert update_rule.json()['is_default'] is False

    delete_rule = client.delete(f'/api/v1/settings/carton-rules/{rule_id}', headers=headers)
    assert delete_rule.status_code == 204
