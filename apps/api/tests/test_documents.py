import atexit
import time
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import SessionLocal, init_db
from app.main import app
from app.models.carton_capacity_rule import CartonCapacityRule
from app.models.company_settings import CompanySettings
from app.models.received_po import ReceivedPO, ReceivedPOLineItem
from app.services.received_po_documents import _resolve_model_display_value

init_db()
client_manager = TestClient(app)
client = client_manager.__enter__()
atexit.register(client_manager.__exit__, None, None, None)


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
                    knitted_woven='Knitted',
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
                    knitted_woven='Knitted',
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
    assert body['invoice_number'].startswith('INV/')
    assert body['number_of_cartons'] == 0
    assert body['export_mode'] == 'Air'
    assert body['total_quantity'] == 22
    assert body['subtotal'] == 11000.0
    assert body['igst_rate'] == 5.0
    assert body['igst_amount'] == 550.0
    assert body['total_amount'] == 11550.0
    assert len(body['line_items']) == 2
    assert body['line_items'][0]['knitted_woven'] == 'Knitted'
    assert body['status'] == 'draft'
    assert body['details']['marketplace_name'] == 'Styli'
    assert body['details']['supplier_name'] == 'Documents Co'
    assert body['details']['bill_to_gst'] == ''

    invoice_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={
            'gross_weight': 18.5,
            'number_of_cartons': 9,
            'export_mode': 'Air',
            'details': {
                **body['details'],
                'vendor_company_name': 'Modern Sanskriti',
                'origin_state': 'Uttar Pradesh',
            },
        },
    )
    assert invoice_update.status_code == 200
    assert invoice_update.json()['gross_weight'] == 18.5
    assert invoice_update.json()['number_of_cartons'] == 9
    assert invoice_update.json()['details']['vendor_company_name'] == 'Modern Sanskriti'
    assert invoice_update.json()['line_items'][0]['state_of_origin'] == 'Uttar Pradesh'

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

    invoice_list = client.get('/api/v1/invoices', headers=headers)
    assert invoice_list.status_code == 200
    invoice_items = invoice_list.json()['items']
    assert len(invoice_items) == 1
    assert invoice_items[0]['received_po_id'] == received_po_id
    assert invoice_items[0]['po_number'] == 'STY-2026-00999'


def test_packing_list_requires_invoice_before_creation() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    # Attempt to create packing list WITHOUT an invoice first — must return 409
    response = client.post(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)
    assert response.status_code == 409
    assert 'invoice' in response.json()['detail'].lower()


def test_packing_list_creation_assignment_and_carton_update() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    # Create invoice first (now required)
    invoice_response = client.post(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
    assert invoice_response.status_code == 201
    invoice_body = invoice_response.json()
    invoice_number = invoice_body['invoice_number']

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
    # Invoice link must be populated
    assert detail_body['invoice_id'] == invoice_body['id']
    assert detail_body['invoice_number'] == invoice_number

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
    pdf_bytes = packing_list_path.read_bytes()
    assert pdf_bytes.startswith(b'%PDF-')
    # Structured PDF must contain the key strings
    assert b'PACKING LIST' in pdf_bytes
    assert invoice_number.encode('latin-1', errors='replace') in pdf_bytes or b'INV/' in pdf_bytes
    assert b'STY-2026-00999' in pdf_bytes


def test_packing_list_list_endpoint() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    # Requires invoice first
    invoice_response = client.post(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
    assert invoice_response.status_code == 201
    invoice_body = invoice_response.json()

    client.post(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)

    pl_list = client.get('/api/v1/packing-lists', headers=headers)
    assert pl_list.status_code == 200
    items = pl_list.json()['items']
    assert len(items) == 1
    item = items[0]
    assert item['received_po_id'] == received_po_id
    assert item['po_number'] == 'STY-2026-00999'
    assert item['invoice_number'] == invoice_body['invoice_number']
    assert item['carton_count'] == 2
    assert item['total_pieces'] == 22
    assert item['status'] == 'draft'


def test_barcode_job_generation_updates_status_and_writes_pdf() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    barcode_job = client.post(f'/api/v1/received-pos/{received_po_id}/barcode', headers=headers)
    assert barcode_job.status_code == 201

    payload = _wait_for_barcode_job(headers, received_po_id)
    assert payload['status'] == 'done'
    assert payload['total_stickers'] == 2
    assert payload['template_kind'] == 'styli'
    assert payload['total_pages'] >= 1
    assert payload['file_url'].startswith('/static/generated/barcodes/')

    barcode_path = Path('static') / Path(payload['file_url'].removeprefix('/static/'))
    assert barcode_path.exists()
    barcode_bytes = barcode_path.read_bytes()
    assert barcode_bytes.startswith(b'%PDF-')
    assert b'Made in India' in barcode_bytes
    assert b'PO No : STY-2026-00999' in barcode_bytes
    assert b'Model No. : MOD-1' in barcode_bytes
    assert b'Qty: 10' in barcode_bytes

    barcode_list = client.get('/api/v1/barcodes', headers=headers)
    assert barcode_list.status_code == 200
    barcode_items = barcode_list.json()['items']
    assert len(barcode_items) == 1
    assert barcode_items[0]['received_po_id'] == received_po_id
    assert barcode_items[0]['po_number'] == 'STY-2026-00999'
    assert barcode_items[0]['template_kind'] == 'styli'


def test_custom_sticker_template_preview_and_sheet_generation() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    create_template = client.post(
        '/api/v1/sticker-templates',
        headers=headers,
        json={
            'name': 'Marketplace Label',
            'width_mm': 45.03,
            'height_mm': 60,
            'border_color': '#000000',
            'border_radius_mm': 2,
            'background_color': '#FFFFFF',
            'is_default': False,
            'elements': [
                {
                    'element_type': 'text_dynamic',
                    'x_mm': 4,
                    'y_mm': 4,
                    'width_mm': 36,
                    'height_mm': 6,
                    'z_index': 0,
                    'properties': {
                        'field': 'po_number',
                        'label': 'PO No : ',
                        'label_weight': 'normal',
                        'value_weight': 'bold',
                        'font_size': 10,
                        'alignment': 'center',
                        'color': '#000000',
                    },
                },
                {
                    'element_type': 'barcode',
                    'x_mm': 5,
                    'y_mm': 18,
                    'width_mm': 34,
                    'height_mm': 14,
                    'z_index': 1,
                    'properties': {
                        'field': 'styli_sku',
                        'custom_formula': 'styli_sku',
                        'barcode_type': 'code128',
                        'show_number': True,
                        'number_font_size': 7,
                    },
                },
            ],
        },
    )
    assert create_template.status_code == 201
    template_id = create_template.json()['id']

    preview = client.post(f'/api/v1/sticker-templates/{template_id}/preview', headers=headers)
    assert preview.status_code == 200
    assert preview.headers['content-type'] == 'application/pdf'
    assert preview.content.startswith(b'%PDF-')

    custom_sheet = client.post(
        '/api/v1/barcode/generate-custom-sheet',
        headers=headers,
        json={
            'template_id': template_id,
            'received_po_id': received_po_id,
            'line_items': [
                {
                    'po_number': '70150792',
                    'model_number': 'IN000090128',
                    'option_id': '7015079228',
                    'size': 'M',
                    'quantity': 7,
                    'sku_id': 'HRDS25001-A-BLACK-M',
                    'color': 'Black',
                    'brand_name': 'House Of Raeli',
                }
            ],
        },
    )
    assert custom_sheet.status_code == 200
    body = custom_sheet.json()
    assert body['total_stickers'] == 1
    assert body['total_pages'] == 1
    assert body['file_url'].startswith('/static/generated/barcodes/')

    custom_sheet_path = Path('static') / Path(body['file_url'].removeprefix('/static/'))
    assert custom_sheet_path.exists()
    assert custom_sheet_path.read_bytes().startswith(b'%PDF-')


def test_custom_sticker_sheet_generation_tolerates_unreachable_image_assets(monkeypatch) -> None:
    from urllib.error import URLError

    from app.services import received_po_documents

    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    monkeypatch.setattr(
        received_po_documents,
        'urlopen',
        lambda *args, **kwargs: (_ for _ in ()).throw(URLError('unreachable asset')),
    )

    create_template = client.post(
        '/api/v1/sticker-templates',
        headers=headers,
        json={
            'name': 'Label With Remote Logo',
            'width_mm': 45.03,
            'height_mm': 60,
            'border_color': '#000000',
            'border_radius_mm': 2,
            'background_color': '#FFFFFF',
            'is_default': False,
            'elements': [
                {
                    'element_type': 'image',
                    'x_mm': 4,
                    'y_mm': 4,
                    'width_mm': 12,
                    'height_mm': 8,
                    'z_index': 0,
                    'properties': {
                        'asset_type': 'custom',
                        'asset_url': 'https://cdn.example.com/logo.png',
                        'fit': 'contain',
                    },
                },
                {
                    'element_type': 'barcode',
                    'x_mm': 5,
                    'y_mm': 18,
                    'width_mm': 34,
                    'height_mm': 14,
                    'z_index': 1,
                    'properties': {
                        'field': 'styli_sku',
                        'custom_formula': 'styli_sku',
                        'barcode_type': 'code128',
                        'show_number': True,
                        'number_font_size': 7,
                    },
                },
            ],
        },
    )
    assert create_template.status_code == 201
    template_id = create_template.json()['id']

    custom_sheet = client.post(
        '/api/v1/barcode/generate-custom-sheet',
        headers=headers,
        json={
            'template_id': template_id,
            'received_po_id': received_po_id,
            'line_items': [
                {
                    'po_number': '70150792',
                    'model_number': 'IN000090128',
                    'option_id': '7015079228',
                    'size': 'M',
                    'quantity': 7,
                    'sku_id': 'HRDS25001-A-BLACK-M',
                    'color': 'Black',
                    'brand_name': 'House Of Raeli',
                }
            ],
        },
    )
    assert custom_sheet.status_code == 200
    body = custom_sheet.json()
    assert body['total_stickers'] == 1
    assert body['total_pages'] == 1
    assert body['file_url'].startswith('/static/generated/barcodes/')


def test_custom_template_preview_renders_builtin_styli_logo_for_logo_assets() -> None:
    headers = _auth_headers()

    create_template = client.post(
        '/api/v1/sticker-templates',
        headers=headers,
        json={
            'name': 'Label With Builtin Logo',
            'width_mm': 45.03,
            'height_mm': 60,
            'border_color': '#000000',
            'border_radius_mm': 2,
            'background_color': '#FFFFFF',
            'is_default': False,
            'elements': [
                {
                    'element_type': 'image',
                    'x_mm': 4,
                    'y_mm': 4,
                    'width_mm': 18,
                    'height_mm': 8,
                    'z_index': 0,
                    'properties': {
                        'asset_type': 'logo',
                        'asset_url': '',
                        'fit': 'contain',
                    },
                }
            ],
        },
    )
    assert create_template.status_code == 201
    template_id = create_template.json()['id']

    preview = client.post(f'/api/v1/sticker-templates/{template_id}/preview', headers=headers)
    assert preview.status_code == 200
    assert preview.content.startswith(b'%PDF-')
    assert b'STYLI' in preview.content


def test_document_flow_happy_path() -> None:
    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    invoice_create = client.post(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={'number_of_cartons': 2, 'export_mode': 'Air'},
    )
    assert invoice_create.status_code == 201
    invoice_body = invoice_create.json()
    assert invoice_body['status'] == 'draft'
    assert invoice_body['invoice_number'].startswith('INV/')
    assert invoice_body['total_quantity'] == 22

    invoice_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={
            'gross_weight': 18.5,
            'details': {
                **invoice_body['details'],
                'vendor_company_name': 'Modern Sanskriti',
                'delivery_from_name': 'Modern Sanskriti',
                'origin_state': 'Uttar Pradesh',
                'origin_district': 'Jhansi',
                'marketplace_name': 'Styli',
            },
        },
    )
    assert invoice_update.status_code == 200
    assert invoice_update.json()['gross_weight'] == 18.5

    packing_list_create = client.post(
        f'/api/v1/received-pos/{received_po_id}/packing-list',
        headers=headers,
    )
    assert packing_list_create.status_code == 201
    packing_list_summary = packing_list_create.json()
    assert packing_list_summary['total_cartons'] == 2
    assert packing_list_summary['total_pieces'] == 22

    packing_list_detail = client.get(
        f'/api/v1/received-pos/{received_po_id}/packing-list',
        headers=headers,
    )
    assert packing_list_detail.status_code == 200
    packing_list_detail_body = packing_list_detail.json()
    assert packing_list_detail_body['invoice_number'] == invoice_body['invoice_number']
    cartons = packing_list_detail_body['cartons']
    assert len(cartons) == 2

    first_carton_id = cartons[0]['id']
    carton_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}/packing-list/cartons/{first_carton_id}',
        headers=headers,
        json={
            'gross_weight': 12.4,
            'net_weight': 10.8,
            'dimensions': '60x40x40 cm',
        },
    )
    assert carton_update.status_code == 200

    invoice_pdf = client.post(
        f'/api/v1/received-pos/{received_po_id}/invoice/generate-pdf',
        headers=headers,
    )
    assert invoice_pdf.status_code == 200
    invoice_final = _wait_for_invoice(headers, received_po_id)
    assert invoice_final['status'] == 'final'
    assert invoice_final['file_url'].startswith('/static/generated/invoices/')

    packing_list_pdf = client.post(
        f'/api/v1/received-pos/{received_po_id}/packing-list/generate-pdf',
        headers=headers,
    )
    assert packing_list_pdf.status_code == 200
    packing_list_final = _wait_for_packing_list(headers, received_po_id)
    assert packing_list_final['status'] == 'final'
    assert packing_list_final['file_url'].startswith('/static/generated/packing-lists/')

    barcode_job = client.post(
        f'/api/v1/received-pos/{received_po_id}/barcode',
        headers=headers,
    )
    assert barcode_job.status_code == 201
    barcode_final = _wait_for_barcode_job(headers, received_po_id)
    assert barcode_final['status'] == 'done'
    assert barcode_final['file_url'].startswith('/static/generated/barcodes/')
    assert barcode_final['template_kind'] == 'styli'

    invoice_path = Path('static') / Path(invoice_final['file_url'].removeprefix('/static/'))
    packing_list_path = Path('static') / Path(packing_list_final['file_url'].removeprefix('/static/'))
    barcode_path = Path('static') / Path(barcode_final['file_url'].removeprefix('/static/'))

    assert invoice_path.exists()
    assert packing_list_path.exists()
    assert barcode_path.exists()
    assert invoice_path.read_bytes().startswith(b'%PDF-')
    assert packing_list_path.read_bytes().startswith(b'%PDF-')
    assert barcode_path.read_bytes().startswith(b'%PDF-')

    invoices_list = client.get('/api/v1/invoices', headers=headers)
    packing_lists_list = client.get('/api/v1/packing-lists', headers=headers)
    barcodes_list = client.get('/api/v1/barcodes', headers=headers)

    assert invoices_list.status_code == 200
    assert packing_lists_list.status_code == 200
    assert barcodes_list.status_code == 200

    assert invoices_list.json()['items'][0]['received_po_id'] == received_po_id
    assert packing_lists_list.json()['items'][0]['received_po_id'] == received_po_id
    assert barcodes_list.json()['items'][0]['received_po_id'] == received_po_id


def test_model_display_uses_brand_style_code_when_model_number_missing() -> None:
    assert _resolve_model_display_value(None, 'IN000090128') == 'IN000090128'
    assert _resolve_model_display_value('', 'IN000090128') == 'IN000090128'
    assert _resolve_model_display_value('MODEL-7', 'IN000090128') == 'MODEL-7'


def test_invoice_generation_failure_marks_invoice_failed(monkeypatch) -> None:
    from app.services import received_po_documents

    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    invoice_create = client.post(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={'number_of_cartons': 2, 'export_mode': 'Air'},
    )
    assert invoice_create.status_code == 201

    monkeypatch.setattr(
        received_po_documents,
        '_write_generated_pdf',
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError('storage write failed')),
    )

    generate_response = client.post(
        f'/api/v1/received-pos/{received_po_id}/invoice/generate-pdf',
        headers=headers,
    )
    assert generate_response.status_code == 200
    assert generate_response.json()['status'] == 'draft'
    assert generate_response.json()['file_url'] is None

    for _ in range(20):
        invoice_get = client.get(f'/api/v1/received-pos/{received_po_id}/invoice', headers=headers)
        assert invoice_get.status_code == 200
        payload = invoice_get.json()
        if payload['status'] == 'failed':
            assert payload['file_url'] is None
            return
        time.sleep(0.1)

    raise AssertionError('Invoice did not transition to failed status')


def test_packing_list_generation_failure_marks_packing_list_failed(monkeypatch) -> None:
    from app.services import received_po_documents

    headers = _auth_headers()
    _, received_po_id = _seed_confirmed_received_po(headers)

    invoice_create = client.post(
        f'/api/v1/received-pos/{received_po_id}/invoice',
        headers=headers,
        json={'number_of_cartons': 2, 'export_mode': 'Air'},
    )
    assert invoice_create.status_code == 201

    packing_create = client.post(
        f'/api/v1/received-pos/{received_po_id}/packing-list',
        headers=headers,
    )
    assert packing_create.status_code == 201

    monkeypatch.setattr(
        received_po_documents,
        '_write_generated_pdf',
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError('storage write failed')),
    )

    generate_response = client.post(
        f'/api/v1/received-pos/{received_po_id}/packing-list/generate-pdf',
        headers=headers,
    )
    assert generate_response.status_code == 200
    assert generate_response.json()['status'] == 'draft'
    assert generate_response.json()['file_url'] is None

    for _ in range(20):
        packing_get = client.get(f'/api/v1/received-pos/{received_po_id}/packing-list', headers=headers)
        assert packing_get.status_code == 200
        payload = packing_get.json()
        if payload['status'] == 'failed':
            assert payload['file_url'] is None
            return
        time.sleep(0.1)

    raise AssertionError('Packing list did not transition to failed status')
