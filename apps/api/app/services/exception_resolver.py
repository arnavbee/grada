import json
from decimal import Decimal
import re
from typing import Any

from sqlalchemy.orm import Session

from app.models.received_po import ReceivedPO, ReceivedPOLineItem

RESOLUTION_STATUS_AUTO_RESOLVED = 'auto_resolved'
RESOLUTION_STATUS_NEEDS_REVIEW = 'needs_review'
RESOLUTION_STATUS_HUMAN_CORRECTED = 'human_corrected'

_SIZE_CANONICAL_MAP = {
    'xsmall': 'XS',
    'xs': 'XS',
    'small': 'S',
    's': 'S',
    'medium': 'M',
    'm': 'M',
    'large': 'L',
    'l': 'L',
    'xl': 'XL',
    'x l': 'XL',
    'xll': 'XL',
    'xxl': 'XXL',
    'xxxl': 'XXXL',
}


def _json_dumps(payload: dict[str, object]) -> str:
    return json.dumps(payload, separators=(',', ':'))


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _normalize_size(raw_size: str | None) -> tuple[str | None, bool]:
    cleaned = str(raw_size or '').strip()
    if not cleaned:
        return None, False
    normalized_key = re.sub(r'[^a-z0-9]+', '', cleaned.lower())
    canonical = _SIZE_CANONICAL_MAP.get(normalized_key)
    if canonical:
        return canonical, canonical != cleaned
    upper_cleaned = cleaned.upper()
    if upper_cleaned in {'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'}:
        return upper_cleaned, upper_cleaned != cleaned
    return cleaned, False


def _normalize_color(raw_color: str | None) -> tuple[str | None, bool]:
    cleaned = str(raw_color or '').strip()
    if not cleaned:
        return None, False
    normalized = re.sub(r'\s+', ' ', cleaned).title()
    return normalized, normalized != cleaned


def _normalize_knitted_woven(raw_value: str | None) -> tuple[str | None, bool]:
    cleaned = str(raw_value or '').strip()
    if not cleaned:
        return None, False
    normalized = re.sub(r'\s+', ' ', cleaned).strip().lower()
    if 'knit' in normalized:
        return 'Knitted', cleaned != 'Knitted'
    if 'wov' in normalized:
        return 'Woven', cleaned != 'Woven'
    titled = cleaned.title()
    return titled, titled != cleaned


def _apply_field_updates(item: ReceivedPOLineItem, updates: dict[str, Any]) -> None:
    for field_name, value in updates.items():
        if field_name == 'size':
            item.size = str(value).strip() or None if value is not None else None
        elif field_name == 'color':
            item.color = str(value).strip() or None if value is not None else None
        elif field_name == 'knitted_woven':
            item.knitted_woven = str(value).strip() or None if value is not None else None
        elif field_name == 'quantity' and value is not None:
            item.quantity = max(0, int(value))
        elif field_name == 'po_price':
            item.po_price = float(value) if value is not None else None


def evaluate_line_item_exceptions(item: ReceivedPOLineItem) -> dict[str, object]:
    suggestions: dict[str, object] = {}
    reasons: list[str] = []
    confidence_scores: list[float] = []
    auto_fix = True

    normalized_size, size_changed = _normalize_size(item.size)
    if size_changed and normalized_size:
        suggestions['size'] = normalized_size
        reasons.append('size_normalized')
        confidence_scores.append(0.97)

    normalized_color, color_changed = _normalize_color(item.color)
    if color_changed and normalized_color:
        suggestions['color'] = normalized_color
        reasons.append('color_normalized')
        confidence_scores.append(0.92)

    normalized_construction, construction_changed = _normalize_knitted_woven(item.knitted_woven)
    if construction_changed and normalized_construction:
        suggestions['knitted_woven'] = normalized_construction
        reasons.append('construction_normalized')
        confidence_scores.append(0.94)

    if item.quantity <= 0:
        reasons.append('quantity_missing_or_zero')
        confidence_scores.append(0.35)
        auto_fix = False

    po_price = _as_float(item.po_price)
    if po_price is None or po_price <= 0:
        reasons.append('po_price_missing_or_zero')
        confidence_scores.append(0.3)
        auto_fix = False

    if not str(item.sku_id or '').strip():
        reasons.append('sku_missing')
        confidence_scores.append(0.2)
        auto_fix = False

    if not reasons:
        return {
            'resolution_status': RESOLUTION_STATUS_AUTO_RESOLVED,
            'confidence_score': 1.0,
            'exception_reason': None,
            'suggested_fix': {},
            'apply_updates': {},
        }

    if auto_fix and suggestions:
        confidence = min(confidence_scores) if confidence_scores else 0.9
        return {
            'resolution_status': RESOLUTION_STATUS_AUTO_RESOLVED,
            'confidence_score': confidence,
            'exception_reason': ','.join(reasons),
            'suggested_fix': suggestions,
            'apply_updates': suggestions,
        }

    confidence = min(confidence_scores) if confidence_scores else 0.5
    return {
        'resolution_status': RESOLUTION_STATUS_NEEDS_REVIEW,
        'confidence_score': confidence,
        'exception_reason': ','.join(reasons),
        'suggested_fix': suggestions,
        'apply_updates': {},
    }


def run_exception_resolution_for_received_po(db: Session, record: ReceivedPO) -> dict[str, object]:
    auto_resolved = 0
    needs_review = 0
    human_corrected = 0
    total = len(record.items)

    for item in record.items:
        if item.resolution_status == RESOLUTION_STATUS_HUMAN_CORRECTED:
            human_corrected += 1
            continue

        evaluation = evaluate_line_item_exceptions(item)
        apply_updates = evaluation.get('apply_updates')
        if isinstance(apply_updates, dict) and apply_updates:
            _apply_field_updates(item, apply_updates)

        item.resolution_status = str(evaluation.get('resolution_status') or RESOLUTION_STATUS_NEEDS_REVIEW)
        item.confidence_score = float(evaluation.get('confidence_score') or 0)
        item.exception_reason = str(evaluation.get('exception_reason') or '').strip() or None
        suggested_fix = evaluation.get('suggested_fix')
        if isinstance(suggested_fix, dict):
            item.suggested_fix_json = _json_dumps(suggested_fix)
        else:
            item.suggested_fix_json = _json_dumps({})

        if item.resolution_status == RESOLUTION_STATUS_AUTO_RESOLVED:
            auto_resolved += 1
        elif item.resolution_status == RESOLUTION_STATUS_HUMAN_CORRECTED:
            human_corrected += 1
        else:
            needs_review += 1

    record.exception_count = needs_review
    record.review_required_count = needs_review
    record.auto_resolve_rate = round((auto_resolved / total) * 100, 2) if total > 0 else 0.0

    return {
        'total': total,
        'auto_resolved': auto_resolved,
        'needs_review': needs_review,
        'human_corrected': human_corrected,
        'auto_resolve_rate': float(record.auto_resolve_rate or 0),
    }
