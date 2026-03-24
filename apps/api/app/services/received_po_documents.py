import json
from collections import OrderedDict
from datetime import timezone
from io import BytesIO
from pathlib import Path

from reportlab.graphics.barcode import code128
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.barcode_job import BarcodeJob
from app.models.company_settings import CompanySettings
from app.models.invoice import Invoice
from app.models.packing_list import PackingList
from app.models.received_po import ReceivedPO, ReceivedPOLineItem
from app.services.object_storage import get_object_storage_service

object_storage = get_object_storage_service()
GENERATED_DIR = Path('static/generated')


def _json_loads(raw: str | None) -> dict[str, object]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _escape_pdf_text(value: str) -> str:
    return value.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _build_simple_pdf(pages: list[list[str]]) -> bytes:
    font_size = 10
    page_width = 595
    page_height = 842
    margin_left = 36
    top = 806
    line_height = 14

    objects: list[bytes] = []

    def add_object(payload: bytes) -> int:
        objects.append(payload)
        return len(objects)

    font_id = add_object(b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    content_ids: list[int] = []
    page_ids: list[int] = []

    for page_lines in pages:
        cleaned_lines = page_lines or ['']
        content_lines = ['BT', f'/F1 {font_size} Tf', f'{margin_left} {top} Td']
        for index, line in enumerate(cleaned_lines):
            if index == 0:
                content_lines.append(f'({_escape_pdf_text(line[:110])}) Tj')
            else:
                content_lines.append(f'0 -{line_height} Td')
                content_lines.append(f'({_escape_pdf_text(line[:110])}) Tj')
        content_lines.append('ET')
        stream = '\n'.join(content_lines).encode('latin-1', errors='replace')
        content_id = add_object(f'<< /Length {len(stream)} >>\nstream\n'.encode() + stream + b'\nendstream')
        content_ids.append(content_id)
        page_ids.append(-1)

    pages_id = add_object(b'')
    for index, content_id in enumerate(content_ids):
        page_payload = (
            f'<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {page_width} {page_height}] '
            f'/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>'
        ).encode()
        page_ids[index] = add_object(page_payload)

    kids = ' '.join(f'{page_id} 0 R' for page_id in page_ids)
    objects[pages_id - 1] = f'<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>'.encode()
    catalog_id = add_object(f'<< /Type /Catalog /Pages {pages_id} 0 R >>'.encode())

    pdf = bytearray(b'%PDF-1.4\n')
    offsets = [0]
    for index, payload in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f'{index} 0 obj\n'.encode())
        pdf.extend(payload)
        pdf.extend(b'\nendobj\n')

    xref_start = len(pdf)
    pdf.extend(f'xref\n0 {len(objects) + 1}\n'.encode())
    pdf.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        pdf.extend(f'{offset:010d} 00000 n \n'.encode())
    pdf.extend(
        (
            f'trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n'
            f'startxref\n{xref_start}\n%%EOF'
        ).encode()
    )
    return bytes(pdf)


def _write_generated_pdf(*, key: str, content: bytes) -> str:
    if object_storage.enabled:
        stored_url = object_storage.upload_bytes(key=key, content=content, content_type='application/pdf')
        if stored_url:
            return stored_url

    relative_path = Path(key)
    local_path = GENERATED_DIR / relative_path
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_bytes(content)
    return f'/static/generated/{relative_path.as_posix()}'


def _chunk_lines(lines: list[str], *, page_size: int = 48) -> list[list[str]]:
    if not lines:
        return [['']]
    return [lines[index : index + page_size] for index in range(0, len(lines), page_size)]


def _amount_to_words(value: float) -> str:
    units = [
        'zero',
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
        'eleven',
        'twelve',
        'thirteen',
        'fourteen',
        'fifteen',
        'sixteen',
        'seventeen',
        'eighteen',
        'nineteen',
    ]
    tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

    def _under_thousand(number: int) -> str:
        parts: list[str] = []
        if number >= 100:
            parts.append(f'{units[number // 100]} hundred')
            number %= 100
        if number >= 20:
            parts.append(tens[number // 10])
            if number % 10:
                parts.append(units[number % 10])
        elif number > 0 or not parts:
            parts.append(units[number])
        return ' '.join(part for part in parts if part)

    whole = int(value)
    paise = int(round((value - whole) * 100))
    if whole == 0:
        words = 'zero'
    else:
        groups = [
            (10000000, 'crore'),
            (100000, 'lakh'),
            (1000, 'thousand'),
        ]
        remaining = whole
        parts: list[str] = []
        for divisor, label in groups:
            if remaining >= divisor:
                count, remaining = divmod(remaining, divisor)
                parts.append(f'{_under_thousand(count)} {label}')
        if remaining:
            parts.append(_under_thousand(remaining))
        words = ' '.join(parts)
    if paise:
        return f'{words} rupees and {_under_thousand(paise)} paise only'
    return f'{words} rupees only'


def _brand_profile(company_settings: CompanySettings | None) -> dict[str, object]:
    settings_payload = _json_loads(company_settings.settings_json if company_settings else '{}')
    brand_profile = settings_payload.get('brand_profile')
    return brand_profile if isinstance(brand_profile, dict) else {}


def _barcode_sticker_records(line_items: list[ReceivedPOLineItem]) -> list[dict[str, object]]:
    records: OrderedDict[str, dict[str, object]] = OrderedDict()
    for item in line_items:
        sku_id = str(item.sku_id or '').strip()
        if not sku_id:
            continue
        existing = records.get(sku_id)
        if existing is None:
            records[sku_id] = {
                'sku_id': sku_id,
                'model_number': str(item.model_number or '-'),
                'option_id': str(item.option_id or '-'),
                'size': str(item.size or '-'),
                'quantity': int(item.quantity or 0),
            }
            continue
        existing['quantity'] = int(existing['quantity']) + int(item.quantity or 0)
    return list(records.values())


def _fit_code128(value: str, max_width: float):
    selected = None
    for bar_width in (0.34 * mm, 0.30 * mm, 0.26 * mm, 0.22 * mm, 0.18 * mm):
        selected = code128.Code128(value, barWidth=bar_width, barHeight=8.2 * mm, humanReadable=False)
        if selected.width <= max_width:
            return selected
    return selected


def _build_barcode_sticker_pdf(received_po: ReceivedPO, line_items: list[ReceivedPOLineItem]) -> bytes:
    stickers = _barcode_sticker_records(line_items)
    pdf_buffer = BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=A4, pageCompression=0)
    page_width, page_height = A4

    sticker_width = 50 * mm
    sticker_height = 30 * mm
    gap_x = 4 * mm
    gap_y = 4 * mm
    margin_x = 8 * mm
    margin_y = 10 * mm
    columns = 3
    rows_per_page = max(1, int((page_height - (2 * margin_y) + gap_y) // (sticker_height + gap_y)))
    stickers_per_page = columns * rows_per_page

    for index, sticker in enumerate(stickers):
        slot = index % stickers_per_page
        if index > 0 and slot == 0:
            pdf.showPage()

        row = slot // columns
        column = slot % columns
        x = margin_x + column * (sticker_width + gap_x)
        y = page_height - margin_y - sticker_height - row * (sticker_height + gap_y)

        pdf.setLineWidth(0.6)
        pdf.roundRect(x, y, sticker_width, sticker_height, 2 * mm)

        top_y = y + sticker_height - (3.3 * mm)
        pdf.setFont('Helvetica-Bold', 6.8)
        pdf.drawString(x + 2 * mm, top_y, 'GRADA')
        pdf.setFont('Helvetica', 5.2)
        pdf.drawRightString(x + sticker_width - 2 * mm, top_y, f"PO {received_po.po_number or '-'}")

        pdf.setFont('Helvetica-Bold', 6.1)
        pdf.drawString(x + 2 * mm, y + sticker_height - (7.4 * mm), f"Model: {sticker['model_number']}")
        pdf.setFont('Helvetica', 5.5)
        pdf.drawString(x + 2 * mm, y + sticker_height - (10.9 * mm), f"Option: {sticker['option_id']}")
        pdf.drawString(x + 2 * mm, y + sticker_height - (14.2 * mm), f"Size: {sticker['size']}")
        pdf.drawRightString(x + sticker_width - 2 * mm, y + sticker_height - (14.2 * mm), f"Qty: {int(sticker['quantity'])}")
        pdf.drawString(x + 2 * mm, y + sticker_height - (17.4 * mm), 'Made in India')

        barcode_value = str(sticker['sku_id'])
        barcode = _fit_code128(barcode_value, max_width=sticker_width - (5 * mm))
        if barcode is not None:
            barcode_x = x + (sticker_width - barcode.width) / 2
            barcode_y = y + 6.2 * mm
            barcode.drawOn(pdf, barcode_x, barcode_y)

        pdf.setFont('Helvetica', 4.6)
        pdf.drawCentredString(x + sticker_width / 2, y + 3.1 * mm, barcode_value)

    pdf.save()
    return pdf_buffer.getvalue()


def _invoice_pdf_lines(
    invoice: Invoice,
    received_po: ReceivedPO,
    line_items: list[ReceivedPOLineItem],
    company_settings: CompanySettings | None,
) -> list[str]:
    brand_profile = _brand_profile(company_settings)
    supplier_name = str(brand_profile.get('supplier_name') or 'Supplier')
    address = str(brand_profile.get('address') or '-')
    gst_number = str(brand_profile.get('gst_number') or '-')
    pan_number = str(brand_profile.get('pan_number') or '-')
    bill_to = str(brand_profile.get('bill_to_address') or 'Styli')
    ship_to = str(brand_profile.get('ship_to_address') or bill_to)

    lines = [
        'GRADA INVOICE',
        f'Supplier: {supplier_name}',
        f'Address: {address}',
        f'GST: {gst_number}',
        f'PAN: {pan_number}',
        f'Invoice Number: {invoice.invoice_number}',
        f'Invoice Date: {invoice.invoice_date.astimezone(timezone.utc).date().isoformat()}',
        f'PO Number: {received_po.po_number or "-"}',
        f'Bill To: {bill_to}',
        f'Ship To: {ship_to}',
        '',
        'Line Items',
    ]

    for item in line_items:
        taxable_amount = float(item.po_price or 0) * int(item.quantity or 0)
        lines.append(
            ' | '.join(
                [
                    str(item.brand_style_code or '-'),
                    str(item.option_id or '-'),
                    str(item.size or '-'),
                    f'Qty {int(item.quantity or 0)}',
                    f'Rate {float(item.po_price or 0):.2f}',
                    f'Taxable {taxable_amount:.2f}',
                ]
            )
        )

    lines.extend(
        [
            '',
            f'Subtotal: INR {float(invoice.subtotal):.2f}',
            f'IGST {float(invoice.igst_rate):.2f}%: INR {float(invoice.igst_amount):.2f}',
            f'Total: INR {float(invoice.total_amount):.2f}',
            f'Amount in words: {_amount_to_words(float(invoice.total_amount)).title()}',
            f'Gross weight: {float(invoice.gross_weight):.2f} kg' if invoice.gross_weight is not None else 'Gross weight: -',
        ]
    )
    return lines


def _packing_list_pdf_lines(
    packing_list: PackingList,
    received_po: ReceivedPO,
    line_items_by_id: dict[str, ReceivedPOLineItem],
) -> list[str]:
    lines = [
        'GRADA PACKING LIST',
        f'PO Number: {received_po.po_number or "-"}',
        f'Distributor: {received_po.distributor}',
        '',
    ]
    for carton in sorted(packing_list.cartons, key=lambda value: value.carton_number):
        lines.extend(
            [
                f'Carton {carton.carton_number}',
                f'  Total Pieces: {carton.total_pieces}',
                f'  Gross Weight: {float(carton.gross_weight):.2f} kg' if carton.gross_weight is not None else '  Gross Weight: -',
                f'  Net Weight: {float(carton.net_weight):.2f} kg' if carton.net_weight is not None else '  Net Weight: -',
                f'  Dimensions: {carton.dimensions or "-"}',
            ]
        )
        for carton_item in carton.items:
            line_item = line_items_by_id.get(carton_item.line_item_id)
            if line_item is None:
                continue
            lines.append(
                '  - '
                + ' | '.join(
                    [
                        f'Option {line_item.option_id or "-"}',
                        f'Style {line_item.brand_style_code}',
                        f'Model {line_item.model_number or "-"}',
                        f'Size {line_item.size or "-"}',
                        f'Pieces {carton_item.pieces_in_carton}',
                        'COO India',
                    ]
                )
            )
        lines.append('')
    return lines


def generate_barcode_job_pdf(barcode_job_id: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.query(BarcodeJob).filter(BarcodeJob.id == barcode_job_id).first()
        if job is None:
            return

        received_po = db.query(ReceivedPO).filter(ReceivedPO.id == job.received_po_id).first()
        if received_po is None:
            job.status = 'failed'
            db.commit()
            return

        job.status = 'generating'
        db.commit()

        line_items = (
            db.query(ReceivedPOLineItem)
            .filter(ReceivedPOLineItem.received_po_id == received_po.id)
            .order_by(ReceivedPOLineItem.brand_style_code.asc(), ReceivedPOLineItem.sku_id.asc())
            .all()
        )
        pdf_content = _build_barcode_sticker_pdf(received_po, line_items)
        key = f'barcodes/{received_po.company_id}/{received_po.id}.pdf'
        job.file_url = _write_generated_pdf(key=key, content=pdf_content)
        job.status = 'done'
        job.total_stickers = len(_barcode_sticker_records(line_items))
        db.commit()
    except Exception:
        if 'job' in locals() and job is not None:
            job.status = 'failed'
            db.commit()
        raise
    finally:
        db.close()


def generate_invoice_pdf(invoice_id: str) -> None:
    db: Session = SessionLocal()
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if invoice is None:
            return

        received_po = db.query(ReceivedPO).filter(ReceivedPO.id == invoice.received_po_id).first()
        if received_po is None:
            return

        company_settings = db.query(CompanySettings).filter(CompanySettings.company_id == invoice.company_id).first()
        line_items = (
            db.query(ReceivedPOLineItem)
            .filter(ReceivedPOLineItem.received_po_id == received_po.id)
            .order_by(ReceivedPOLineItem.brand_style_code.asc(), ReceivedPOLineItem.sku_id.asc())
            .all()
        )
        pdf_content = _build_simple_pdf(_chunk_lines(_invoice_pdf_lines(invoice, received_po, line_items, company_settings)))
        key = f'invoices/{invoice.company_id}/{invoice.id}.pdf'
        invoice.file_url = _write_generated_pdf(key=key, content=pdf_content)
        invoice.status = 'final'
        db.commit()
    finally:
        db.close()


def generate_packing_list_pdf(packing_list_id: str) -> None:
    db: Session = SessionLocal()
    try:
        packing_list = db.query(PackingList).filter(PackingList.id == packing_list_id).first()
        if packing_list is None:
            return

        received_po = db.query(ReceivedPO).filter(ReceivedPO.id == packing_list.received_po_id).first()
        if received_po is None:
            return

        cartons = sorted(packing_list.cartons, key=lambda item: item.carton_number)
        line_item_ids = [
            carton_item.line_item_id
            for carton in cartons
            for carton_item in carton.items
        ]
        line_items = (
            db.query(ReceivedPOLineItem)
            .filter(ReceivedPOLineItem.id.in_(line_item_ids or ['']))
            .all()
        )
        line_items_by_id = {item.id: item for item in line_items}

        pdf_content = _build_simple_pdf(
            _chunk_lines(_packing_list_pdf_lines(packing_list, received_po, line_items_by_id))
        )
        key = f'packing-lists/{packing_list.company_id}/{packing_list.id}.pdf'
        packing_list.file_url = _write_generated_pdf(key=key, content=pdf_content)
        packing_list.status = 'final'
        db.commit()
    finally:
        db.close()
