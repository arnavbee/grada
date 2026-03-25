import re
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.carton_capacity_rule import CartonCapacityRule
from app.models.invoice import Invoice
from app.models.packing_list import PackingList, PackingListCarton, PackingListCartonItem
from app.models.received_po import ReceivedPO, ReceivedPOLineItem

SIZE_ORDER = {'XS': 0, 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5, 'XXXL': 6}
DEFAULT_CARTON_CAPACITY = 20


def _infer_category_from_line_items(line_items: list[ReceivedPOLineItem]) -> str:
    searchable_text = ' '.join(
        filter(
            None,
            [
                *(item.brand_style_code or '' for item in line_items),
                *(item.sku_id or '' for item in line_items),
                *(item.model_number or '' for item in line_items),
            ],
        )
    ).lower()
    if 'dress' in searchable_text or re.search(r'\bhrds\b', searchable_text):
        return 'Dresses'
    if 'top' in searchable_text:
        return 'Tops'
    if 'coord' in searchable_text or 'co-ord' in searchable_text or 'cord' in searchable_text or 'set' in searchable_text:
        return 'Co-ord Sets'
    return 'Default'


def resolve_carton_capacity(db: Session, company_id: str, line_items: list[ReceivedPOLineItem]) -> tuple[int, str]:
    inferred_category = _infer_category_from_line_items(line_items)
    rules = db.query(CartonCapacityRule).filter(CartonCapacityRule.company_id == company_id).all()

    for rule in rules:
        if rule.category.strip().lower() == inferred_category.lower():
            return rule.pieces_per_carton, rule.category

    default_rule = next((rule for rule in rules if rule.is_default), None)
    if default_rule is not None:
        return default_rule.pieces_per_carton, default_rule.category

    return DEFAULT_CARTON_CAPACITY, inferred_category


def assign_cartons_for_received_po(
    db: Session,
    *,
    received_po: ReceivedPO,
    company_id: str,
    invoice: Invoice | None = None,
) -> tuple[PackingList, int, int]:
    line_items = sorted(
        list(received_po.items),
        key=lambda item: (
            str(item.option_id or ''),
            SIZE_ORDER.get(str(item.size or '').upper(), 999),
            str(item.sku_id or ''),
        ),
    )
    if len(line_items) == 0:
        raise ValueError('Cannot create a packing list without received PO line items.')

    existing = db.query(PackingList).filter(PackingList.received_po_id == received_po.id).first()
    if existing is not None:
        db.query(PackingListCarton).filter(PackingListCarton.packing_list_id == existing.id).delete()
        db.delete(existing)
        db.flush()

    capacity, _ = resolve_carton_capacity(db, company_id, line_items)
    packing_list = PackingList(
        id=str(uuid4()),
        received_po_id=received_po.id,
        company_id=company_id,
        status='draft',
        invoice_id=invoice.id if invoice else None,
        invoice_number=invoice.invoice_number if invoice else None,
        invoice_date=invoice.invoice_date if invoice else None,
    )
    db.add(packing_list)
    db.flush()

    current_carton_number = 1
    pieces_in_current_carton = 0
    total_pieces = 0
    carton_records: dict[int, PackingListCarton] = {}

    for item in line_items:
        remaining_in_item = max(0, int(item.quantity or 0))
        while remaining_in_item > 0:
            if current_carton_number not in carton_records:
                carton = PackingListCarton(
                    id=str(uuid4()),
                    packing_list_id=packing_list.id,
                    carton_number=current_carton_number,
                    total_pieces=0,
                )
                db.add(carton)
                db.flush()
                carton_records[current_carton_number] = carton

            current_carton = carton_records[current_carton_number]
            space_in_carton = capacity - pieces_in_current_carton
            pieces_to_add = min(remaining_in_item, space_in_carton)

            db.add(
                PackingListCartonItem(
                    id=str(uuid4()),
                    carton_id=current_carton.id,
                    line_item_id=item.id,
                    pieces_in_carton=pieces_to_add,
                )
            )
            current_carton.total_pieces += pieces_to_add
            total_pieces += pieces_to_add
            pieces_in_current_carton += pieces_to_add
            remaining_in_item -= pieces_to_add

            if pieces_in_current_carton >= capacity:
                current_carton_number += 1
                pieces_in_current_carton = 0

    db.flush()
    return packing_list, len(carton_records), total_pieces
