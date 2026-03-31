import json
import re

from app.models.buyer_document_template import BuyerDocumentTemplate
from app.schemas.invoice import InvoiceDetails


BUYER_DOCUMENT_TYPE_INVOICE = 'invoice'
DEFAULT_INVOICE_LAYOUT_KEY = 'default_v1'
LANDMARK_INVOICE_LAYOUT_KEY = 'landmark_v1'
SUPPORTED_INVOICE_LAYOUT_KEYS = {
    DEFAULT_INVOICE_LAYOUT_KEY,
    LANDMARK_INVOICE_LAYOUT_KEY,
}
_NORMALIZE_PATTERN = re.compile(r'[^a-z0-9]+')


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
