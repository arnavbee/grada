from app.services.object_storage import ObjectStorageService


def test_extract_key_from_public_base_url() -> None:
    service = ObjectStorageService()
    service._r2_public_base_url = 'https://cdn.example.com'
    service._r2_bucket = 'grada-files'

    key = service.extract_key_from_url('https://cdn.example.com/received-pos/company/file.xlsx')

    assert key == 'received-pos/company/file.xlsx'


def test_extract_key_from_endpoint_bucket_url() -> None:
    service = ObjectStorageService()
    service._r2_bucket = 'grada-files'

    key = service.extract_key_from_url(
        'https://account-id.r2.cloudflarestorage.com/grada-files/received-pos/company/file.xlsx'
    )

    assert key == 'received-pos/company/file.xlsx'
