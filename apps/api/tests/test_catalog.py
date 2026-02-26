import time
import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

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
    assert product_body['sku'].startswith('KIRA-SHIRTS-NAVY-M')
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
    assert 'main-image-url' in csv_contents
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
    assert 'Style-No,Name,Category,Color,Fabric,Composition,Woven/Knits,Units,PO Price,OSP,Status,Image Preview,Primary Image URL' in csv_contents
    assert 'GENERIC-SHAPE-1,Catalog Item' in csv_contents


def test_analyze_image_returns_hash_and_source_context(monkeypatch) -> None:
    headers = _auth_headers()

    def _fake_analyze_image(_: str) -> dict[str, object]:
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
