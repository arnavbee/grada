from app.services.received_po_parser import _extract_line_items_from_rows


def test_extract_line_items_accepts_total_as_quantity_header() -> None:
    rows = [
        ['Booked By', '', 'Shipment Terms', 'FOB', 'PO', '70058628'],
        ['Supplier', 'HOUSE OF RAELI', 'Payment Terms', 'TT', 'PO Date', '2026-01-29 06:33:20'],
        [
            'Vendor Style Number',
            'Style Id',
            'Styli Option ID',
            'Styli SKU',
            'Colour',
            'Size',
            'Total',
            'PO Price',
        ],
        ['MSDR106MXSOBK-A-Black', '70328991', '7032899101', '703289910102', 'Black', 'S', '1', '600'],
        ['MSDR106MXSOBK-A-Black', '70328991', '7032899101', '703289910103', 'Black', 'M', '2', '600'],
    ]

    items = _extract_line_items_from_rows(rows)

    assert len(items) == 2
    assert items[0]['brand_style_code'] == 'MSDR106MXSOBK-A-Black'
    assert items[0]['styli_style_id'] == '70328991'
    assert items[0]['option_id'] == '7032899101'
    assert items[0]['sku_id'] == '703289910102'
    assert items[0]['quantity'] == 1
    assert items[1]['quantity'] == 2
