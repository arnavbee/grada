import time
import zipfile
from io import BytesIO
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import SessionLocal, init_db
from app.main import app
from app.models.received_po import ReceivedPO, ReceivedPOLineItem

init_db()
client = TestClient(app)


def _auth_headers(company_name: str = 'Received PO Co') -> dict[str, str]:
    email = f'received-po-{uuid4().hex[:8]}@example.com'
    response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': company_name,
            'full_name': 'Ops Admin',
            'email': email,
            'password': 'Password1',
        },
    )
    assert response.status_code == 201
    return {'Authorization': f"Bearer {response.json()['access_token']}"}


def _build_test_xlsx(rows: list[list[str]]) -> bytes:
    sheet_rows: list[str] = []
    for row_index, row in enumerate(rows, start=1):
        cells: list[str] = []
        for column_index, value in enumerate(row, start=1):
            column_name = ''
            index = column_index
            while index > 0:
                index, remainder = divmod(index - 1, 26)
                column_name = chr(65 + remainder) + column_name
            cell_ref = f'{column_name}{row_index}'
            escaped = (
                str(value)
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;')
            )
            cells.append(
                f'<c r="{cell_ref}" t="inlineStr"><is><t xml:space="preserve">{escaped}</t></is></c>'
            )
        sheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        '</worksheet>'
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="PO" sheetId="1" r:id="rId1"/></sheets>'
        '</workbook>'
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" '
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '</Types>'
    )
    root_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    workbook_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        'Target="worksheets/sheet1.xml"/>'
        '</Relationships>'
    )

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml', content_types_xml)
        archive.writestr('_rels/.rels', root_rels_xml)
        archive.writestr('xl/workbook.xml', workbook_xml)
        archive.writestr('xl/_rels/workbook.xml.rels', workbook_rels_xml)
        archive.writestr('xl/worksheets/sheet1.xml', sheet_xml)
    return buffer.getvalue()


def test_received_po_upload_list_get_edit_confirm_and_barcode_job() -> None:
    headers = _auth_headers()

    upload = client.post(
        '/api/v1/received-pos/upload',
        headers=headers,
        files={'file': ('styli-po.pdf', b'%PDF-1.4 fake po', 'application/pdf')},
    )
    assert upload.status_code == 201
    received_po_id = upload.json()['received_po_id']

    list_response = client.get('/api/v1/received-pos', headers=headers)
    assert list_response.status_code == 200
    assert list_response.json()['total'] >= 1

    filtered_list_response = client.get('/api/v1/received-pos?status=uploaded&limit=1', headers=headers)
    assert filtered_list_response.status_code == 200
    if filtered_list_response.json()['total'] >= 1:
        assert filtered_list_response.json()['total'] >= 1
    else:
        found_in_transitional_state = False
        for po_status in ('parsing', 'parsed', 'failed'):
            alternate_list_response = client.get(f'/api/v1/received-pos?status={po_status}&limit=1', headers=headers)
            assert alternate_list_response.status_code == 200
            if alternate_list_response.json()['total'] >= 1:
                found_in_transitional_state = True
                break
        assert found_in_transitional_state is True

    header_update = client.patch(
        f'/api/v1/received-pos/{received_po_id}',
        headers=headers,
        json={
            'po_number': 'STY-2026-00847',
            'distributor': 'Styli',
        },
    )
    assert header_update.status_code == 200
    assert header_update.json()['po_number'] == 'STY-2026-00847'

    db = SessionLocal()
    try:
        record = db.query(ReceivedPO).filter(ReceivedPO.id == received_po_id).first()
        assert record is not None
        line_item = ReceivedPOLineItem(
            received_po_id=record.id,
            brand_style_code='HRDS25001',
            styli_style_id='STYLI-101',
            model_number='MOD-1',
            option_id='OPT-BLK',
            sku_id='HRDS25001-A-BLACK-S',
            color='Black',
            size='S',
            quantity=10,
            po_price=499.0,
        )
        db.add(line_item)
        db.commit()
        line_item_id = line_item.id
    finally:
        db.close()

    items_update = client.put(
        f'/api/v1/received-pos/{received_po_id}/items',
        headers=headers,
        json={
            'items': [
                {
                    'id': line_item_id,
                    'brand_style_code': 'HRDS25001',
                    'styli_style_id': 'STYLI-101',
                    'model_number': 'MOD-2',
                    'option_id': 'OPT-BLK',
                    'sku_id': 'HRDS25001-A-BLACK-S',
                    'color': 'Black',
                    'size': 'S',
                    'quantity': 12,
                    'po_price': 525.0,
                }
            ]
        },
    )
    assert items_update.status_code == 200
    assert items_update.json()['items'][0]['model_number'] == 'MOD-2'
    assert items_update.json()['items'][0]['quantity'] == 12

    detail = client.get(f'/api/v1/received-pos/{received_po_id}', headers=headers)
    assert detail.status_code == 200
    assert len(detail.json()['items']) == 1

    confirm = client.post(f'/api/v1/received-pos/{received_po_id}/confirm', headers=headers)
    assert confirm.status_code == 200
    assert confirm.json()['status'] == 'confirmed'

    edit_after_confirm = client.patch(
        f'/api/v1/received-pos/{received_po_id}',
        headers=headers,
        json={'po_number': 'CHANGED'},
    )
    assert edit_after_confirm.status_code == 409

    barcode_job = client.post(f'/api/v1/received-pos/{received_po_id}/barcode', headers=headers)
    assert barcode_job.status_code == 201
    job_id = barcode_job.json()['job_id']

    barcode_status = client.get(f'/api/v1/received-pos/{received_po_id}/barcode/status', headers=headers)
    assert barcode_status.status_code == 200
    assert barcode_status.json()['id'] == job_id
    assert barcode_status.json()['total_stickers'] == 1


def test_received_po_upload_parses_excel_into_line_items() -> None:
    headers = _auth_headers()

    xlsx_bytes = _build_test_xlsx(
        [
            ['PO Number', 'PO Date', 'Distributor'],
            ['STY-2026-00847', '2026-03-24', 'Styli'],
            [],
            [
                'Brand Style Code',
                'Styli Style ID',
                'Model Number',
                'Option ID',
                'SKU ID',
                'Color',
                'Size',
                'Quantity',
                'PO Price',
            ],
            ['HRDS25001', 'STYLI-101', 'MOD-1', 'OPT-BLK', 'HRDS25001-A-BLACK-S', 'Black', 'S', 10, 499],
            ['HRDS25001', 'STYLI-101', 'MOD-1', 'OPT-BLK', 'HRDS25001-A-BLACK-M', 'Black', 'M', 12, 499],
        ]
    )

    upload = client.post(
        '/api/v1/received-pos/upload',
        headers=headers,
        files={
            'file': (
                'styli-po.xlsx',
                xlsx_bytes,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            )
        },
    )
    assert upload.status_code == 201
    received_po_id = upload.json()['received_po_id']

    final_payload = None
    for _ in range(20):
        detail = client.get(f'/api/v1/received-pos/{received_po_id}', headers=headers)
        assert detail.status_code == 200
        final_payload = detail.json()
        if final_payload['status'] in {'parsed', 'failed'}:
            break
        time.sleep(0.05)

    assert final_payload is not None
    assert final_payload['status'] == 'parsed'
    assert final_payload['po_number'] == 'STY-2026-00847'
    assert final_payload['distributor'] == 'Styli'
    assert len(final_payload['items']) == 2
    assert final_payload['items'][0]['brand_style_code'] == 'HRDS25001'
    assert final_payload['items'][0]['sku_id'] == 'HRDS25001-A-BLACK-S'


def test_received_po_is_company_scoped() -> None:
    headers_a = _auth_headers('Tenant A')
    headers_b = _auth_headers('Tenant B')

    upload = client.post(
        '/api/v1/received-pos/upload',
        headers=headers_a,
        files={'file': ('tenant-a.xlsx', b'PK\x03\x04fake', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')},
    )
    assert upload.status_code == 201
    received_po_id = upload.json()['received_po_id']

    detail_other_tenant = client.get(f'/api/v1/received-pos/{received_po_id}', headers=headers_b)
    assert detail_other_tenant.status_code == 404
