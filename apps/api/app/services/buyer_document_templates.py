import json
import re
import zlib
from pathlib import Path
from uuid import uuid4

from app.models.buyer_document_template import BuyerDocumentTemplate
from app.schemas.invoice import InvoiceDetails
from app.services.object_storage import get_object_storage_service


BUYER_DOCUMENT_TYPE_INVOICE = 'invoice'
DEFAULT_INVOICE_LAYOUT_KEY = 'default_v1'
LANDMARK_INVOICE_LAYOUT_KEY = 'landmark_v1'
SUPPORTED_INVOICE_LAYOUT_KEYS = {
    DEFAULT_INVOICE_LAYOUT_KEY,
    LANDMARK_INVOICE_LAYOUT_KEY,
}
_NORMALIZE_PATTERN = re.compile(r'[^a-z0-9]+')
SAMPLE_UPLOAD_DIR = Path('static/uploads/buyer-document-templates')
SAMPLE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
object_storage = get_object_storage_service()


def json_loads(raw: str | None) -> dict[str, object]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def json_dumps(payload: dict[str, object]) -> str:
    return json.dumps(payload, separators=(',', ':'))


def normalize_buyer_key(value: str | None) -> str:
    normalized = _NORMALIZE_PATTERN.sub('', str(value or '').strip().lower())
    return normalized


def template_defaults(template: BuyerDocumentTemplate | None) -> InvoiceDetails:
    if template is None:
        return InvoiceDetails()
    try:
        return InvoiceDetails(**json_loads(template.defaults_json))
    except Exception:
        return InvoiceDetails()


def choose_matching_template(
    templates: list[BuyerDocumentTemplate], distributor: str | None
) -> BuyerDocumentTemplate | None:
    normalized_distributor = normalize_buyer_key(distributor)
    if not normalized_distributor:
        return next((template for template in templates if template.is_default), None)

    exact_match = next(
        (template for template in templates if normalize_buyer_key(template.buyer_key) == normalized_distributor),
        None,
    )
    if exact_match is not None:
        return exact_match

    contains_match = next(
        (
            template
            for template in templates
            if normalize_buyer_key(template.buyer_key)
            and normalize_buyer_key(template.buyer_key) in normalized_distributor
        ),
        None,
    )
    if contains_match is not None:
        return contains_match

    return next((template for template in templates if template.is_default), None)


def merge_invoice_details(
    company_defaults: InvoiceDetails,
    *,
    template: BuyerDocumentTemplate | None = None,
    distributor: str | None = None,
    override: InvoiceDetails | None = None,
) -> InvoiceDetails:
    merged = company_defaults.model_dump()
    template_payload = template_defaults(template).model_dump()
    for key, value in template_payload.items():
        if isinstance(value, str) and value.strip():
            merged[key] = value.strip()
    if not str(merged.get('marketplace_name') or '').strip():
        merged['marketplace_name'] = str(distributor or '').strip()
    if override is not None:
        merged.update(override.model_dump())
    return InvoiceDetails(**merged)


def resolve_layout_key(template: BuyerDocumentTemplate | None) -> str:
    candidate = str(template.layout_key if template else DEFAULT_INVOICE_LAYOUT_KEY).strip() or DEFAULT_INVOICE_LAYOUT_KEY
    if candidate not in SUPPORTED_INVOICE_LAYOUT_KEYS:
        return DEFAULT_INVOICE_LAYOUT_KEY
    return candidate


def build_template_snapshot(
    template: BuyerDocumentTemplate | None,
    *,
    distributor: str | None,
    merged_details: InvoiceDetails,
) -> dict[str, object]:
    if template is None:
        return {
            'template_id': None,
            'template_name': None,
            'buyer_key': None,
            'layout_key': DEFAULT_INVOICE_LAYOUT_KEY,
            'document_type': BUYER_DOCUMENT_TYPE_INVOICE,
            'matched_from_distributor': str(distributor or '').strip(),
            'defaults': {},
            'resolved_details': merged_details.model_dump(),
        }
    return {
        'template_id': template.id,
        'template_name': template.name,
        'buyer_key': template.buyer_key,
        'layout_key': resolve_layout_key(template),
        'document_type': template.document_type,
        'matched_from_distributor': str(distributor or '').strip(),
        'defaults': template_defaults(template).model_dump(),
        'resolved_details': merged_details.model_dump(),
    }


def save_sample_file(*, company_id: str, filename: str, content: bytes, content_type: str) -> str:
    extension = Path(filename or '').suffix.lower()
    if extension != '.pdf':
        extension = '.pdf'
    unique_name = f'{uuid4().hex}{extension}'
    key = f'uploads/{company_id}/buyer-document-templates/{unique_name}'
    if object_storage.enabled:
        object_url = object_storage.upload_bytes(key=key, content=content, content_type=content_type)
        if object_url:
            return object_url
    company_dir = SAMPLE_UPLOAD_DIR / company_id
    company_dir.mkdir(parents=True, exist_ok=True)
    output_path = company_dir / unique_name
    output_path.write_bytes(content)
    return f'/static/uploads/buyer-document-templates/{company_id}/{unique_name}'


def parse_buyer_template_sample(*, content: bytes, filename: str) -> dict[str, object]:
    extension = Path(filename or '').suffix.lower()
    if extension != '.pdf':
        raise ValueError('Invoice learning currently supports PDF samples only.')

    text_candidates = _extract_pdf_text_candidates(content)
    layout_key = _detect_layout_key(text_candidates)
    defaults = _extract_invoice_defaults(text_candidates)
    detected_headers = [
        candidate
        for candidate in (
            _find_title_candidate(text_candidates),
            _find_candidate_value(text_candidates, _BILL_TO_GST_PATTERNS),
            _find_candidate_value(text_candidates, _SHIP_TO_GST_PATTERNS),
        )
        if candidate
    ]
    return {
        'file_format': 'pdf',
        'layout_key': layout_key,
        'detected_headers': detected_headers,
        'defaults': defaults.model_dump(),
    }


_STOP_SECTION_PATTERNS = (
    re.compile(r'\b(invoice|po|gross weight|export shipment mode|total|subtotal|amount in words)\b', re.IGNORECASE),
)
_BILL_TO_PATTERNS = (
    re.compile(r'\bbill\s*to\b', re.IGNORECASE),
    re.compile(r'\blandmark\s+bill\s*to\b', re.IGNORECASE),
)
_SHIP_TO_PATTERNS = (
    re.compile(r'\bship\s*to\b', re.IGNORECASE),
    re.compile(r'\blandmark\s+ship\s*to\b', re.IGNORECASE),
)
_BILL_TO_GST_PATTERNS = (
    re.compile(r'\bbill\s*to\s*gst\b', re.IGNORECASE),
    re.compile(r'\bbilled\s*to\s*gst\b', re.IGNORECASE),
    re.compile(r'\blandmark\s+bill\s*to\s*gst\b', re.IGNORECASE),
)
_SHIP_TO_GST_PATTERNS = (
    re.compile(r'\bship\s*to\s*gst\b', re.IGNORECASE),
    re.compile(r'\blandmark\s+ship\s*to\s*gst\b', re.IGNORECASE),
)


def _detect_layout_key(text_candidates: list[str]) -> str:
    for candidate in text_candidates:
        lowered = candidate.lower()
        if 'landmark commercial invoice' in lowered or 'landmark bill to' in lowered:
            return LANDMARK_INVOICE_LAYOUT_KEY
    return DEFAULT_INVOICE_LAYOUT_KEY


def _extract_invoice_defaults(text_candidates: list[str]) -> InvoiceDetails:
    marketplace_name = _extract_marketplace_name(text_candidates)
    bill_to_name, bill_to_address = _extract_block_details(
        text_candidates,
        label_patterns=_BILL_TO_PATTERNS,
        stop_patterns=(*_BILL_TO_GST_PATTERNS, *_SHIP_TO_PATTERNS, *_STOP_SECTION_PATTERNS),
    )
    ship_to_name, ship_to_address = _extract_block_details(
        text_candidates,
        label_patterns=_SHIP_TO_PATTERNS,
        stop_patterns=(*_SHIP_TO_GST_PATTERNS, *_STOP_SECTION_PATTERNS),
    )
    return InvoiceDetails(
        marketplace_name=marketplace_name,
        bill_to_name=bill_to_name,
        bill_to_address=bill_to_address,
        bill_to_gst=_find_value_after_colon(text_candidates, _BILL_TO_GST_PATTERNS),
        ship_to_name=ship_to_name,
        ship_to_address=ship_to_address,
        ship_to_gst=_find_value_after_colon(text_candidates, _SHIP_TO_GST_PATTERNS),
    )


def _extract_marketplace_name(text_candidates: list[str]) -> str:
    for index, candidate in enumerate(text_candidates):
        match = re.search(r'export shipment mode by\s+(.+)$', candidate, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
        if 'export shipment mode' in candidate.lower():
            next_candidate = text_candidates[index + 1] if index + 1 < len(text_candidates) else ''
            next_match = re.search(r'^by\s+(.+)$', next_candidate, flags=re.IGNORECASE)
            if next_match:
                return next_match.group(1).strip()
    for candidate in text_candidates:
        match = re.search(r'^by\s+(.+)$', candidate, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
    for candidate in text_candidates:
        if 'commercial invoice' in candidate.lower():
            cleaned = re.sub(r'\bcommercial invoice\b', '', candidate, flags=re.IGNORECASE).strip(' :-')
            if cleaned:
                return cleaned.title()
    return ''


def _extract_block_details(
    text_candidates: list[str],
    *,
    label_patterns: tuple[re.Pattern[str], ...],
    stop_patterns: tuple[re.Pattern[str], ...],
) -> tuple[str, str]:
    for index, candidate in enumerate(text_candidates):
        if not any(pattern.search(candidate) for pattern in label_patterns):
            continue

        inline_value = _extract_suffix_after_colon(candidate)
        collected: list[str] = []
        if inline_value:
            collected.append(inline_value)

        for follow_candidate in text_candidates[index + 1 : index + 6]:
            if any(pattern.search(follow_candidate) for pattern in stop_patterns):
                break
            cleaned = follow_candidate.strip()
            if cleaned:
                collected.append(cleaned)

        if not collected:
            return '', ''

        name = collected[0]
        address = ', '.join(collected[1:]).strip(', ')
        return name, address

    return '', ''


def _find_value_after_colon(
    text_candidates: list[str], patterns: tuple[re.Pattern[str], ...]
) -> str:
    value = _find_candidate_value(text_candidates, patterns)
    if not value:
        return ''
    extracted = _extract_suffix_after_colon(value)
    return extracted if extracted not in {'-', ''} else ''


def _find_candidate_value(
    text_candidates: list[str], patterns: tuple[re.Pattern[str], ...]
) -> str:
    for candidate in text_candidates:
        if any(pattern.search(candidate) for pattern in patterns):
            return candidate
    return ''


def _extract_suffix_after_colon(value: str) -> str:
    if ':' not in value:
        return value.strip()
    return value.split(':', 1)[1].strip()


def _find_title_candidate(text_candidates: list[str]) -> str:
    for candidate in text_candidates:
        if 'invoice' in candidate.lower():
            return candidate
    return 'COMMERCIAL INVOICE'


def _extract_pdf_text_candidates(content: bytes) -> list[str]:
    chunks = [content, *_extract_pdf_stream_chunks(content)]
    candidates: list[str] = []
    seen: set[str] = set()
    for chunk in chunks:
        for match in re.finditer(rb'\(([^()]*)\)', chunk):
            cleaned = _clean_pdf_text(match.group(1))
            if cleaned and cleaned.lower() not in seen:
                seen.add(cleaned.lower())
                candidates.append(cleaned)
    return candidates


def _extract_pdf_stream_chunks(content: bytes) -> list[bytes]:
    chunks: list[bytes] = []
    for match in re.finditer(rb'stream\r?\n(.*?)\r?\nendstream', content, flags=re.DOTALL):
        stream_bytes = match.group(1)
        if not stream_bytes:
            continue
        chunks.append(stream_bytes)
        try:
            chunks.append(zlib.decompress(stream_bytes))
        except Exception:
            continue
    return chunks


def _clean_pdf_text(raw: bytes) -> str:
    text = raw.decode('latin-1', errors='ignore')
    text = text.replace(r'\(', '(').replace(r'\)', ')').replace(r'\\', '\\')
    text = re.sub(r'\\[0-7]{1,3}', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) < 2 or not re.search(r'[A-Za-z]', text):
        return ''
    return text
