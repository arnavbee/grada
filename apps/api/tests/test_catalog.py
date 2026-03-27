import hashlib
import time
import zipfile
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from openpyxl import load_workbook
from PIL import Image

from app.db.session import init_db
from app.main import app

init_db()
client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    email = f'catalog-{uuid4().hex[:8]}@example.com'
    password = 'Password1'
    register_response = client.post(
        '/api/v1/auth/register',
        json={
            'company_name': 'Catalog Co',
            'full_name': 'Catalog Admin',
            'email': email,
            'password': password,
        },
    )
    assert register_response.status_code == 201
    access_token = register_response.json()['access_token']
    return {'Authorization': f'Bearer {access_token}'}


def test_catalog_product_export_and_job_flow() -> None:
    headers = _auth_headers()

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'title': 'Linen Shirt',
            'brand': 'Kira',
            'category': 'Shirts',
            'color': 'Navy',
            'size': 'M',
            'status': 'ready',
            'ai_attributes': {'fabric': 'linen', 'fit': 'regular', 'mrp': 1499},
        },
    )
    assert create_product.status_code == 201
    product_body = create_product.json()
    assert product_body['sku']
    product_id = product_body['id']

    update_product = client.patch(
        f'/api/v1/catalog/products/{product_id}',
        headers=headers,
        json={'status': 'needs_review', 'confidence_score': 87.5},
    )
    assert update_product.status_code == 200
    assert update_product.json()['status'] == 'needs_review'

    add_image = client.post(
        f'/api/v1/catalog/products/{product_id}/images',
        headers=headers,
        json={
            'file_name': 'linen-shirt-front.jpg',
            'file_url': 'https://cdn.example.com/linen-shirt-front.jpg',
            'mime_type': 'image/jpeg',
            'file_size_bytes': 245100,
            'width_px': 1800,
            'height_px': 2400,
            'analysis': {'dominant_color': 'navy'},
        },
    )
    assert add_image.status_code == 201
    assert add_image.json()['processing_status'] == 'uploaded'

    add_measurement = client.post(
        f'/api/v1/catalog/products/{product_id}/measurements',
        headers=headers,
        json={'measurement_key': 'chest', 'measurement_value': 102.4, 'unit': 'cm'},
    )
    assert add_measurement.status_code == 201
    assert add_measurement.json()['measurement_key'] == 'chest'

    list_products = client.get('/api/v1/catalog/products?search=linen&status=needs_review', headers=headers)
    assert list_products.status_code == 200
    assert list_products.json()['total'] >= 1

    create_export = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Amazon IN', 'export_format': 'csv', 'filters': {'status': 'needs_review'}},
    )
    assert create_export.status_code == 201
    export_body = create_export.json()
    assert export_body['status'] == 'completed'
    assert export_body['row_count'] >= 1
    assert export_body['file_url']
    assert export_body['file_url'].endswith('.csv')
    assert export_body['completed_at'] is not None

    csv_path = Path('static') / export_body['file_url'].removeprefix('/static/')
    assert csv_path.exists()
    csv_contents = csv_path.read_text(encoding='utf-8')
    assert 'image-preview' in csv_contents
    assert 'https://cdn.example.com/linen-shirt-front.jpg' in csv_contents

    create_xlsx_export = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Myntra', 'export_format': 'xlsx', 'filters': {'status': 'needs_review'}},
    )
    assert create_xlsx_export.status_code == 201
    xlsx_body = create_xlsx_export.json()
    assert xlsx_body['status'] == 'completed'
    assert xlsx_body['file_url']
    assert xlsx_body['file_url'].endswith('.xlsx')

    xlsx_path = Path('static') / xlsx_body['file_url'].removeprefix('/static/')
    assert xlsx_path.exists()

    failed_export = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Flipkart', 'export_format': 'csv', 'filters': {'status': 'archived'}},
    )
    assert failed_export.status_code == 201
    failed_export_body = failed_export.json()
    assert failed_export_body['status'] == 'failed'
    assert failed_export_body['error_message'] is not None

    list_exports = client.get('/api/v1/catalog/exports', headers=headers)
    assert list_exports.status_code == 200
    assert list_exports.json()['total'] >= 3

    create_job = client.post(
        '/api/v1/catalog/jobs',
        headers=headers,
        json={'job_type': 'image_analysis', 'product_id': product_id, 'payload': {'source': 'upload'}},
    )
    assert create_job.status_code == 201
    assert create_job.json()['status'] == 'queued'

    list_jobs = client.get('/api/v1/catalog/jobs', headers=headers)
    assert list_jobs.status_code == 200
    assert list_jobs.json()['total'] >= 1
    job_ids = [item['id'] for item in list_jobs.json()['items']]
    assert create_job.json()['id'] in job_ids

    create_techpack_job = client.post(
        '/api/v1/catalog/jobs',
        headers=headers,
        json={
            'job_type': 'techpack_ocr',
            'product_id': product_id,
            'payload': {'techpack_text': 'Chest 102 cm Waist 84 cm Length 126 cm Sleeve 58 cm'},
        },
    )
    assert create_techpack_job.status_code == 201
    techpack_job_id = create_techpack_job.json()['id']

    final_job = None
    for _ in range(20):
        check_job = client.get(f'/api/v1/catalog/jobs/{techpack_job_id}', headers=headers)
        assert check_job.status_code == 200
        final_job = check_job.json()
        if final_job['status'] in {'completed', 'failed'}:
            break
        time.sleep(0.05)

    assert final_job is not None
    assert final_job['status'] == 'completed'
    assert final_job['result']['extracted_count'] >= 3
    assert len(final_job['result']['measurements']) >= 3


def test_catalog_xlsx_export_embeds_images() -> None:
    headers = _auth_headers()

    image_dir = Path('static/uploads/test-catalog-export')
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / f'{uuid4().hex}.png'
    Image.new('RGB', (24, 24), color=(12, 34, 56)).save(image_path)

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'title': 'Embedded Image Export',
            'sku': f'TEST-{uuid4().hex[:8].upper()}',
            'category': 'DRESSES',
            'status': 'ready',
            'ai_attributes': {},
        },
    )
    assert create_product.status_code == 201
    product_id = create_product.json()['id']

    add_image = client.post(
        f'/api/v1/catalog/products/{product_id}/images',
        headers=headers,
        json={
            'file_name': image_path.name,
            'file_url': f'/static/uploads/test-catalog-export/{image_path.name}',
            'processing_status': 'uploaded',
            'analysis': {},
        },
    )
    assert add_image.status_code == 201

    export_response = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Myntra', 'export_format': 'xlsx', 'filters': {'product_ids': [product_id]}},
    )
    assert export_response.status_code == 201
    payload = export_response.json()
    assert payload['status'] == 'completed'
    assert payload['file_url']

    xlsx_path = Path('static') / payload['file_url'].removeprefix('/static/')
    assert xlsx_path.exists()
    workbook = load_workbook(xlsx_path)
    sheet = workbook.active
    assert sheet['C2'].value in (None, '')
    with zipfile.ZipFile(xlsx_path, 'r') as archive:
        media_files = [name for name in archive.namelist() if name.startswith('xl/media/')]
    assert media_files


def test_marketplace_export_uses_defaults_for_missing_optional_fields() -> None:
    headers = _auth_headers()

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'sku': 'MISSING-OPTIONALS-1',
            'title': 'Sample Dress',
            'category': "Women's Dress",
            'color': 'Brown',
            'status': 'processing',
        },
    )
    assert create_product.status_code == 201

    create_export = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Myntra', 'export_format': 'csv', 'filters': {'status': 'processing'}},
    )
    assert create_export.status_code == 201
    export_body = create_export.json()
    assert export_body['status'] == 'completed'
    assert export_body['row_count'] >= 1
    assert export_body['file_url']

    csv_path = Path('static') / export_body['file_url'].removeprefix('/static/')
    assert csv_path.exists()


def test_generic_export_has_catalog_shape() -> None:
    headers = _auth_headers()

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'sku': 'GENERIC-SHAPE-1',
            'title': 'Catalog Item',
            'category': "Women's Dress",
            'color': 'Navy',
            'status': 'ready',
            'ai_attributes': {'fabric': 'Cotton Poplin', 'composition': '100% Cotton', 'units': '26'},
        },
    )
    assert create_product.status_code == 201

    create_export = client.post(
        '/api/v1/catalog/exports',
        headers=headers,
        json={'marketplace': 'Generic', 'export_format': 'csv', 'filters': {'status': 'ready'}},
    )
    assert create_export.status_code == 201
    export_body = create_export.json()
    assert export_body['status'] == 'completed'
    assert export_body['file_url']

    csv_path = Path('static') / export_body['file_url'].removeprefix('/static/')
    assert csv_path.exists()
    csv_contents = csv_path.read_text(encoding='utf-8')
    assert 'S. No,Style-No,Image Preview,Name,Category,Color,Fabric,Composition,Woven/Knits,Units,PO Price,OSP,Status' in csv_contents
    assert '1,GENERIC-SHAPE-1,' in csv_contents


def test_analyze_image_returns_hash_and_source_context(monkeypatch) -> None:
    headers = _auth_headers()

    def _fake_analyze_image(_image_url: str, **_kwargs: object) -> dict[str, object]:
        return {
            'category': {'value': 'DRESSES', 'confidence': 97},
            'style_name': {'value': 'Maxi Dress', 'confidence': 88, 'source': 'vision_model'},
            'color': {'value': 'Blue', 'confidence': 92, 'based_on': 'color histogram'},
            'fabric': {'value': 'Poly Georgette'},
            'composition': '100% Polyester',
            'woven_knits': {'value': 'Woven', 'confidence': 85, 'learned_from': 'catalog corrections'},
        }

    monkeypatch.setattr('app.services.ai.ai_service.analyze_image', _fake_analyze_image)

    image_data_url = 'data:image/png;base64,aGVsbG8='
    analyze_response = client.post(
        '/api/v1/catalog/analyze-image',
        headers=headers,
        json={'image_url': image_data_url},
    )
    assert analyze_response.status_code == 200

    body = analyze_response.json()
    assert body['image_hash'] == hashlib.sha256(b'hello').hexdigest()
    assert body['category']['source'] == 'vision_model'
    assert body['style_name']['source'] == 'vision_model'
    assert body['color']['based_on'] == 'color histogram'
    assert body['fabric']['learned_from'] == 'Catalog priors and historical apparel patterns'
    assert body['composition']['value'] == '100% Polyester'


def test_ai_correction_logging_and_learning_stats() -> None:
    headers = _auth_headers()

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'title': 'Feedback Dress',
            'sku': 'FDBK-001',
            'category': 'DRESSES',
            'color': 'Blue',
            'status': 'draft',
        },
    )
    assert create_product.status_code == 201
    product_id = create_product.json()['id']

    log_correction = client.post(
        '/api/v1/catalog/log-correction',
        headers=headers,
        json={
            'product_id': product_id,
            'image_hash': hashlib.sha256(b'feedback').hexdigest(),
            'field_name': 'color',
            'feedback_type': 'reject',
            'suggested_value': 'Blue',
            'corrected_value': 'Navy',
            'reason_code': 'lighting_issue',
            'notes': 'Image had cool white balance.',
            'source': 'vision_model',
            'based_on': 'dominant palette extraction',
            'learned_from': 'user override',
            'confidence_score': 54,
        },
    )
    assert log_correction.status_code == 201
    correction_body = log_correction.json()
    assert correction_body['field_name'] == 'color'
    assert correction_body['feedback_type'] == 'reject'
    assert correction_body['retraining_status'] in {'queued', 'processing', 'completed'}

    learning_stats = client.get('/api/v1/catalog/learning-stats', headers=headers)
    assert learning_stats.status_code == 200
    stats_body = learning_stats.json()
    assert stats_body['corrections_received'] >= 1
    assert stats_body['time_saved_minutes'] >= 0
    assert any(item['field_name'] == 'color' for item in stats_body['field_accuracy'])


def test_image_label_create_update_and_list() -> None:
    headers = _auth_headers()

    created = client.post(
        '/api/v1/catalog/image-labels',
        headers=headers,
        json={
            'image_url': 'https://cdn.example.com/image-1.jpg',
            'ai_category': 'DRESSES',
            'ai_style': 'Maxi Dress',
        },
    )
    assert created.status_code == 201
    created_body = created.json()
    assert created_body['image_url'] == 'https://cdn.example.com/image-1.jpg'
    assert created_body['ai_category'] == 'DRESSES'
    assert created_body['ai_style'] == 'Maxi Dress'
    assert created_body['human_category'] == 'DRESSES'
    assert created_body['human_style'] == 'Maxi Dress'
    assert created_body['corrected'] is False
    label_id = created_body['id']

    updated = client.patch(
        f'/api/v1/catalog/image-labels/{label_id}',
        headers=headers,
        json={
            'human_category': 'CORD SETS',
            'human_style': 'Knot Cord Set',
        },
    )
    assert updated.status_code == 200
    updated_body = updated.json()
    assert updated_body['human_category'] == 'CORD SETS'
    assert updated_body['human_style'] == 'Knot Cord Set'
    assert updated_body['corrected'] is True

    listed = client.get('/api/v1/catalog/image-labels?corrected=true', headers=headers)
    assert listed.status_code == 200
    list_body = listed.json()
    assert list_body['total'] >= 1
    assert any(item['id'] == label_id for item in list_body['items'])


def test_catalog_template_crud_and_style_pattern() -> None:
    headers = _auth_headers()

    create_template = client.post(
        '/api/v1/catalog/templates',
        headers=headers,
        json={
            'name': 'Winter 2026 Dresses',
            'description': 'Default values for winter dress drops',
            'defaults': {
                'category': 'DRESSES',
                'styleName': 'Midi Dress',
                'composition': '100% Polyester',
                'wovenKnits': 'Woven',
                'poPrice': '600',
                'ospSar': '95',
            },
            'allowed_categories': ['DRESSES'],
            'allowed_style_names': ['Midi Dress', 'Maxi Dress'],
            'allowed_colors': ['Black', 'Bottle Green'],
            'allowed_fabrics': ['Poly Georgette', 'Polymoss'],
            'allowed_compositions': ['100% Polyester'],
            'allowed_woven_knits': ['Woven'],
            'style_code_pattern': 'HRD-{CATEGORY}-{YY}-{BRAND}',
            'is_active': True,
        },
    )
    assert create_template.status_code == 201
    template_body = create_template.json()
    template_id = template_body['id']
    assert template_body['name'] == 'Winter 2026 Dresses'
    assert template_body['style_code_pattern'] == 'HRD-{CATEGORY}-{YY}-{BRAND}'
    assert 'Black' in template_body['allowed_colors']
    assert template_body['allowed_categories'] == ['DRESSES']
    assert 'Midi Dress' in template_body['allowed_style_names']

    list_templates = client.get('/api/v1/catalog/templates', headers=headers)
    assert list_templates.status_code == 200
    list_body = list_templates.json()
    assert list_body['total'] >= 1
    assert any(item['id'] == template_id for item in list_body['items'])

    update_template = client.patch(
        f'/api/v1/catalog/templates/{template_id}',
        headers=headers,
        json={
            'name': 'Winter 2026 Dresses Updated',
            'allowed_categories': ['DRESSES', 'CORD SETS'],
            'allowed_style_names': ['Knee Length'],
            'allowed_colors': ['Black', 'Navy'],
            'allowed_compositions': ['100% Cotton'],
            'is_active': False,
        },
    )
    assert update_template.status_code == 200
    updated_body = update_template.json()
    assert updated_body['name'] == 'Winter 2026 Dresses Updated'
    assert updated_body['allowed_categories'] == ['DRESSES', 'CORD SETS']
    assert updated_body['allowed_style_names'] == ['Knee Length']
    assert updated_body['allowed_colors'] == ['Black', 'Navy']
    assert updated_body['allowed_compositions'] == ['100% Cotton']
    assert updated_body['is_active'] is False

    style_code_res = client.post(
        '/api/v1/catalog/generate-style-code',
        headers=headers,
        json={'brand': 'GEN', 'category': 'DRESSES', 'pattern': 'HRD-{CATEGORY}-{YY}-{BRAND}'},
    )
    assert style_code_res.status_code == 200
    style_code = style_code_res.json()['style_code']
    assert style_code.startswith('HRD-DRESSES-')
    assert style_code.endswith('-GEN')

    delete_template = client.delete(f'/api/v1/catalog/templates/{template_id}', headers=headers)
    assert delete_template.status_code == 204


def test_product_detail_and_list_include_primary_image_url() -> None:
    headers = _auth_headers()

    create_product = client.post(
        '/api/v1/catalog/products',
        headers=headers,
        json={
            'title': 'Primary Image Test',
            'sku': f'TEST-{uuid4().hex[:8].upper()}',
            'category': 'DRESSES',
            'status': 'draft',
            'ai_attributes': {},
        },
    )
    assert create_product.status_code == 201
    product_id = create_product.json()['id']

    add_image = client.post(
        f'/api/v1/catalog/products/{product_id}/images',
        headers=headers,
        json={
            'file_name': 'primary-image.png',
            'file_url': 'https://cdn.example.com/primary-image.png',
            'processing_status': 'uploaded',
            'analysis': {},
        },
    )
    assert add_image.status_code == 201

    product_detail = client.get(f'/api/v1/catalog/products/{product_id}', headers=headers)
    assert product_detail.status_code == 200
    assert product_detail.json()['primary_image_url'] == 'https://cdn.example.com/primary-image.png'

    products = client.get('/api/v1/catalog/products', headers=headers)
    assert products.status_code == 200
    matching = next(item for item in products.json()['items'] if item['id'] == product_id)
    assert matching['primary_image_url'] == 'https://cdn.example.com/primary-image.png'
