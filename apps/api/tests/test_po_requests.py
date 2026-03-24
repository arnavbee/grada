import csv
from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from openpyxl import load_workbook

from app.db.session import init_db
from app.main import app
from app.services import ai as ai_module

init_db()
client = TestClient(app)


def _auth_headers(company_name: str = 'PO Builder Co') -> dict[str, str]:
    email = f'po-builder-{uuid4().hex[:8]}@example.com'
    response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': company_name,
            'full_name': 'PO Builder Admin',
            'email': email,
            'password': 'Password1',
        },
    )
    assert response.status_code == 201
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def _create_product(headers: dict[str, str], *, title: str, color: str, sku: str | None = None) -> dict:
    response = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            **({'sku': sku} if sku else {}),
            'title': title,
            'brand': 'House Of Raeli',
            'category': 'Dresses',
            'color': color,
            'status': 'ready',
        },
    )
    assert response.status_code == 201
    return response.json()


def test_po_builder_creates_colorway_rows_and_exports_xlsx() -> None:
    headers = _auth_headers()
    product = _create_product(headers, title='Polymoss Maxi Dress', color='Black', sku='HRDS25001')

    create_response = client.post(
        '/api/v1/po-requests/',
        headers=headers,
        json={'product_ids': [product['id']]},
    )
    assert create_response.status_code == 201
    created_payload = create_response.json()
    assert created_payload['status'] == 'draft'
    assert len(created_payload['items']) == 1
    assert created_payload['items'][0]['colorways'][0]['letter'] == 'A'
    assert created_payload['items'][0]['colorways'][0]['color_name'] == 'Black'
    assert len(created_payload['rows']) == 5

    updated_response = client.put(
        f"/api/v1/po-requests/{created_payload['id']}/items",
        headers=headers,
        json={
            'items': [
                {
                    'id': created_payload['items'][0]['id'],
                    'po_price': 600,
                    'osp_inside_price': 95,
                    'fabric_composition': '100% Polyester',
                    'size_ratio': {'S': 4, 'M': 7, 'L': 7, 'XL': 4, 'XXL': 4},
                    'colorways': [
                        {'letter': 'A', 'color_name': 'Black'},
                        {'letter': 'B', 'color_name': 'Lilac'},
                    ],
                    'extracted_attributes': {
                        'fields': {
                            'dress_print': {'value': 'Plain', 'confidence': 92},
                            'dress_length': {'value': 'Maxi', 'confidence': 95},
                            'dress_shape': {'value': 'A-Line', 'confidence': 88},
                            'sleeve_length': {'value': 'Long Sleeves', 'confidence': 90},
                            'neck_women': {'value': 'High Neck', 'confidence': 72},
                            'sleeve_styling': {'value': 'Flute Sleeve', 'confidence': 85},
                            'woven_knits': {'value': 'Woven', 'confidence': 96},
                        }
                    },
                }
            ]
        },
    )
    assert updated_response.status_code == 200
    updated_payload = updated_response.json()
    assert updated_payload['items'][0]['extracted_attributes']['review_required'] is True
    assert len(updated_payload['rows']) == 10
    assert updated_payload['rows'][0]['sku_id'] == 'HRDS25001-A-BLACK-S'
    assert updated_payload['rows'][5]['sku_id'] == 'HRDS25001-B-LILAC-S'
    assert updated_payload['rows'][0]['po_qty'] == 4
    assert updated_payload['rows'][1]['po_qty'] == 7
    assert updated_payload['rows'][0]['product_name'] == "Women's Black Polyester Maxi Dress DRESSES"

    export_response = client.get(
        f"/api/v1/po-requests/{created_payload['id']}/export?format=xlsx",
        headers=headers,
    )
    assert export_response.status_code == 200
    assert (
        export_response.headers['content-type']
        == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    workbook = load_workbook(BytesIO(export_response.content))
    sheet = workbook['Women_SST_PO']
    merged_ranges = {str(cell_range) for cell_range in sheet.merged_cells.ranges}

    assert sheet['A2'].value == 'Style Code'
    assert sheet['W2'].value == 'Dress Print'
    assert sheet['AC1'].value == 'Coord Set / Jumpsuits'
    assert sheet['A3'].value == 'HRDS25001-A-BLACK-S'
    assert sheet['N3'].value == "Women's Black Polyester Maxi Dress DRESSES"
    assert sheet['W3'].value == 'Plain'
    assert sheet.freeze_panes == 'A3'
    assert 'A1:N1' in merged_ranges
    assert 'W1:AB1' in merged_ranges
    assert 'AC1:AH1' in merged_ranges

    csv_response = client.get(
        f"/api/v1/po-requests/{created_payload['id']}/export?format=csv",
        headers=headers,
    )
    assert csv_response.status_code == 200
    csv_text = csv_response.content.decode('utf-8-sig')
    csv_rows = list(csv.reader(csv_text.splitlines()))

    assert csv_rows[0][20] == 'Trousers'
    assert csv_rows[0][22] == 'Dress'
    assert csv_rows[0][28] == 'Coord Set / Jumpsuits'
    assert csv_rows[1][0] == 'Style Code'
    assert csv_rows[1][22] == 'Dress Print'
    assert csv_rows[2][0] == 'HRDS25001-A-BLACK-S'
    assert csv_rows[2][13] == "Women's Black Polyester Maxi Dress DRESSES"
    assert csv_rows[2][22] == 'Plain'

    list_response = client.get('/api/v1/po-requests?status=draft&limit=1', headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()['total'] >= 1

    delete_response = client.delete(f"/api/v1/po-requests/{created_payload['id']}", headers=headers)
    assert delete_response.status_code == 204

    deleted_detail = client.get(f"/api/v1/po-requests/{created_payload['id']}", headers=headers)
    assert deleted_detail.status_code == 404


def test_po_builder_ai_extraction_normalizes_enum_fields(monkeypatch) -> None:
    headers = _auth_headers('PO Builder AI Co')
    product = _create_product(headers, title='Tiered Maxi Dress', color='Wine', sku='HRDS25007')

    image_response = client.post(
        f"/api/v1/catalog/products/{product['id']}/images",
        headers=headers,
        json={
            'file_name': 'tiered-maxi.jpg',
            'file_url': 'https://cdn.example.com/tiered-maxi.jpg',
            'mime_type': 'image/jpeg',
        },
    )
    assert image_response.status_code == 201

    create_response = client.post(
        '/api/v1/po-requests/',
        headers=headers,
        json={'product_ids': [product['id']]},
    )
    assert create_response.status_code == 201
    po_request_id = create_response.json()['id']

    def _fake_extract(_image_url: str, _category: str) -> dict:
        return {
            'fields': {
                'dress_print': {'value': 'plain', 'confidence': 98},
                'dress_length': {'value': 'Maxi', 'confidence': 96},
                'dress_shape': {'value': 'A-Line', 'confidence': 88},
                'sleeve_length': {'value': 'Long Sleeves', 'confidence': 91},
                'neck_women': {'value': 'high neck', 'confidence': 74},
                'sleeve_styling': {'value': 'Flute Sleeve', 'confidence': 82},
                'woven_knits': {'value': 'Woven', 'confidence': 97},
            }
        }

    monkeypatch.setattr('app.services.ai.ai_service.extract_po_attributes', _fake_extract)

    extract_response = client.post(f'/api/v1/po-requests/{po_request_id}/extract-attributes', headers=headers)
    assert extract_response.status_code == 200

    detail_response = client.get(f'/api/v1/po-requests/{po_request_id}', headers=headers)
    assert detail_response.status_code == 200
    detail_payload = detail_response.json()
    assert detail_payload['status'] == 'ready'
    assert detail_payload['items'][0]['extracted_attributes']['fields']['dress_print']['value'] == 'Plain'
    assert detail_payload['items'][0]['extracted_attributes']['fields']['neck_women']['value'] == 'High Neck'
    assert detail_payload['items'][0]['extracted_attributes']['review_required'] is True


def test_po_ai_retries_with_compact_prompt_when_provider_rejects_prompt_size(monkeypatch) -> None:
    captured_calls: list[dict] = []

    class FakeAPIStatusError(Exception):
        def __init__(self, status_code: int, message: str) -> None:
            super().__init__(message)
            self.status_code = status_code

    def _fake_create(**kwargs):
        captured_calls.append(kwargs)
        if len(captured_calls) == 1:
            raise FakeAPIStatusError(402, 'Prompt tokens limit exceeded: 2032 > 1928')
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=(
                            '{"fields":{"dress_print":{"value":"Plain","confidence":91},'
                            '"woven_knits":{"value":"Woven","confidence":97}}}'
                        )
                    )
                )
            ]
        )

    monkeypatch.setattr(ai_module, 'APIStatusError', FakeAPIStatusError)
    monkeypatch.setattr(ai_module.ai_service.client.chat.completions, 'create', _fake_create)

    result = ai_module.ai_service.extract_po_attributes('https://cdn.example.com/dress.jpg', 'Dress')

    assert len(captured_calls) == 2
    first_message = captured_calls[0]['messages'][0]['content']
    second_message = captured_calls[1]['messages'][0]['content']
    assert first_message[1]['image_url']['detail'] == 'high'
    assert second_message[1]['image_url']['detail'] == 'low'
    assert len(second_message[0]['text']) < len(first_message[0]['text'])
    assert result['fields']['dress_print']['value'] == 'Plain'
    assert result['fields']['woven_knits']['value'] == 'Woven'
