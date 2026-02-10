import time
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
            'status': 'draft',
            'ai_attributes': {'fabric': 'linen', 'fit': 'regular'},
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
        json={'marketplace': 'Amazon', 'export_format': 'csv', 'filters': {'status': 'ready'}},
    )
    assert create_export.status_code == 201
    assert create_export.json()['status'] == 'queued'

    list_exports = client.get('/api/v1/catalog/exports', headers=headers)
    assert list_exports.status_code == 200
    assert list_exports.json()['total'] >= 1

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
