import time
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import SessionLocal, init_db
from app.main import app
from app.models.carton_capacity_rule import CartonCapacityRule
from app.models.company_settings import CompanySettings
from app.models.received_po import ReceivedPO, ReceivedPOLineItem

init_db()
client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    email = f'documents-{uuid4().hex[:8]}@example.com'
    response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Documents Co',
            'full_name': 'Ops Admin',
            'email': email,
            'password': 'Password1',
        },
    )
    assert response.status_code == 201
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def _seed_confirmed_received_po(headers: dict[str, str]) -> tuple[str, str]:
    me = client.get('/api/v1/auth/me', headers=headers)
    assert me.status_code == 200
    company_id = me.json()['company_id']

    db = SessionLocal()
    try:
        settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
        assert settings is not None
        settings.invoice_prefix = 'INV'
        settings.invoice_next_number = 1
        settings.settings_json = (
            '{"brand_profile":{"supplier_name":"Documents Co","default_igst_rate":5}}'
        )

        received_po = ReceivedPO(
            company_id=company_id,
            file_url='/static/uploads/received-pos/test.xlsx',
            po_number='STY-2026-00999',
            distributor='Styli',
            status='confirmed',
            raw_extracted_json='{}',
        )
        db.add(received_po)
        db.flush()

        db.add_all(
            [
                ReceivedPOLineItem(
                    received_po_id=received_po.id,
                    brand_style_code='HRDS25001',
                    styli_style_id='STY-1',
                    model_number='MOD-1',
                    option_id='OPT-BLK',
                    sku_id='HRDS25001-A-BLACK-S',
                    color='Black',
                    size='S',
                    quantity=10,
                    po_price=500,
                ),
                ReceivedPOLineItem(
                    received_po_id=received_po.id,
                    brand_style_code='HRDS25001',
                    styli_style_id='STY-1',
                    model_number='MOD-1',
                    option_id='OPT-BLK',
                    sku_id='HRDS25001-A-BLACK-M',
                    color='Black',
                    size='M',
                    quantity=12,
                    po_price=500,
                ),
            ]
        )
        db.add(
            CartonCapacityRule(
                company_id=company_id,
                category='Dresses',
                pieces_per_carton=20,
                is_default=True,
            )
        )
        db.commit()
        return company_id, received_po.id
    finally:
        db.close()


def _wait_for_invoice(headers: dict[str, str], received_po_id: str) -> dict:
    payload = {}
    for _ in range(30):
        response = client.get(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
        assert response.status_code == 200
        payload = response.json()
        if payload['status'] == 'final' and payload['file_url']:
            return payload
        time.sleep(0.2)
    return payload


def _wait_for_packing_list(headers: dict[str, str], received_po_id: str) -> dict:
    payload = {}
    for _ in range(30):
        response = client.get(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)
        assert response.status_code == 200
        payload = response.json()
        if payload['status'] == 'final' and payload['file_url']:
            return payload
        time.sleep(0.2)
    return payload


def _wait_for_barcode_job(headers: dict[str, str], received_po_id: str) -> dict:
    payload = {}
    for _ in range(30):
        response = client.get(f'/api/v1/received-pos/{received_po_id}/barcode/status', headers=headers)
        assert response.status_code == 200
        payload = response.json()
        if payload['status'] in {'done', 'failed'}:
            return payload
        time.sleep(0.2)
    return payload


def test_invoice_creation_and_update() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    invoice = client.post(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
    assert invoice.status_code == 201
    body = invoice.json()
    assert body['invoice_number'].startswith('INV-')
    assert body['subtotal'] == 11000.0
    assert body['igst_rate'] == 5.0
    assert body['igst_amount'] == 550.0
    assert body['total_amount'] == 11550.0
    assert body['status'] == 'draft'

    invoice_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={'gross_weight': 18.5},
    )
    assert invoice_update.status_code == 200
    assert invoice_update.json()['gross_weight'] == 18.5

    invoice_get = client.get(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
    assert invoice_get.status_code == 200
    assert invoice_get.json()['total_amount'] == 11550.0

    invoice_pdf = client.post(f'/api/v1/received-pos/{received_po_id}/invoice/generate-pdf', headers=headers)
    assert invoice_pdf.status_code == 200

    invoice_after_pdf_body = _wait_for_invoice(headers, received_po_id)
    assert invoice_after_pdf_body['status'] == 'final'
    assert invoice_after_pdf_body['file_url'].startswith('/static/generated/invoices/')

    invoice_path = Path('static') / Path(invoice_after_pdf_body['file_url'].removeprefix('/static/'))
    assert invoice_path.exists()
    assert invoice_path.read_bytes().startswith(b'%PDF-')


def test_packing_list_creation_assignment_and_carton_update() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    packing_list = client.post(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)
    assert packing_list.status_code == 201
    summary = packing_list.json()
    assert summary['total_cartons'] == 2
    assert summary['total_pieces'] == 22

    detail = client.get(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)
    assert detail.status_code == 200
    detail_body = detail.json()
    assert len(detail_body['cartons']) == 2
    assert detail_body['cartons'][0]['total_pieces'] == 20
    assert detail_body['cartons'][1]['total_pieces'] == 2

    carton_id = detail_body['cartons'][0]['id']
    carton_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}/packing-list/cartons/{carton_id}',
        headers=headers,
        json={'gross_weight': 12.4, 'net_weight': 10.8, 'dimensions': '60x40x40 cm'},
    )
    assert carton_update.status_code == 200
    assert carton_update.json()['gross_weight'] == 12.4
    assert carton_update.json()['dimensions'] == '60x40x40 cm'

    packing_list_pdf = client.post(
        f'/api/v1/received-pos/{received_po_id}/packing-list/generate-pdf',
        headers=headers,
    )
    assert packing_list_pdf.status_code == 200

    detail_after_pdf_body = _wait_for_packing_list(headers, received_po_id)
    assert detail_after_pdf_body['status'] == 'final'
    assert detail_after_pdf_body['file_url'].startswith('/static/generated/packing-lists/')

    packing_list_path = Path('static') / Path(detail_after_pdf_body['file_url'].removeprefix('/static/'))
    assert packing_list_path.exists()
    assert packing_list_path.read_bytes().startswith(b'%PDF-')


def test_barcode_job_generation_updates_status_and_writes_pdf() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    barcode_job = client.post(f'/api/v1/received-pos/{received_po_id}/barcode', headers=headers)
    assert barcode_job.status_code == 201

    payload = _wait_for_barcode_job(headers, received_po_id)
    assert payload['status'] == 'done'
    assert payload['total_stickers'] == 2
    assert payload['file_url'].startswith('/static/generated/barcodes/')

    barcode_path = Path('static') / Path(payload['file_url'].removeprefix('/static/'))
    assert barcode_path.exists()
    barcode_bytes = barcode_path.read_bytes()
    assert barcode_bytes.startswith(b'%PDF-')
    assert b'Made in India' in barcode_bytes
    assert b'HRDS25001-A-BLACK-S' in barcode_bytes
    assert b'Model: MOD-1' in barcode_bytes
