from app.services.received_po_parser import _extract_line_items_from_rows


def test_extract_line_items_maps_model_code_to_model_number() -> None:
    rows = [
        ['Brand Style Code', 'Model Code', 'Option ID', 'SKU ID', 'Size', 'Quantity'],
        ['HRDS25001', 'IN000090128', '7015079228', 'HRDS25001-A-BLACK-M', 'M', '7'],
    ]

    items = _extract_line_items_from_rows(rows)

    assert len(items) == 1
    assert items[0]['model_number'] == 'IN000090128'


def test_extract_line_items_maps_knitted_woven_from_po_column() -> None:
    rows = [
        ['Brand Style Code', 'SKU ID', 'Knitted / Wovan', 'Size', 'Quantity'],
        ['HRDS25001', 'HRDS25001-A-BLACK-M', 'Knitted', 'M', '7'],
    ]

    items = _extract_line_items_from_rows(rows)

    assert len(items) == 1
    assert items[0]['knitted_woven'] == 'Knitted'
