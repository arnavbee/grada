from urllib.error import URLError

from app.services import received_po_parser


def test_read_received_po_bytes_uses_object_storage_before_public_url(monkeypatch) -> None:
    expected = b'xlsx-bytes'

    monkeypatch.setattr(
        received_po_parser.object_storage,
        'download_bytes_for_url',
        lambda url: expected,
    )
    monkeypatch.setattr(
        received_po_parser,
        'urlopen',
        lambda *args, **kwargs: (_ for _ in ()).throw(URLError('public url should not be used')),
    )

    content = received_po_parser._read_received_po_bytes(
        'https://cdn.example.com/received-pos/company/file.xlsx'
    )

    assert content == expected
