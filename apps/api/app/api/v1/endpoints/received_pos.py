import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.db.session import get_db
from app.models.barcode_job import BarcodeJob
from app.models.company_settings import CompanySettings
from app.models.invoice import Invoice
from app.models.packing_list import PackingList, PackingListCarton
from app.models.received_po import ReceivedPO, ReceivedPOLineItem
from app.models.user import User
from app.schemas.invoice import InvoiceGeneratePdfResponse, InvoiceResponse, InvoiceUpdateRequest
from app.schemas.packing_list import (
    PackingListCartonResponse,
    PackingListCartonUpdateRequest,
    PackingListCreateResponse,
    PackingListGeneratePdfResponse,
    PackingListResponse,
)
from app.schemas.received_po import (
    BarcodeJobCreateResponse,
    BarcodeJobResponse,
    ReceivedPOConfirmResponse,
    ReceivedPOHeaderUpdate,
    ReceivedPOListItemResponse,
    ReceivedPOListResponse,
    ReceivedPOLineItemBatchUpdate,
    ReceivedPOResponse,
    ReceivedPOStatus,
    ReceivedPOUploadResponse,
)
from app.services.object_storage import get_object_storage_service
from app.services.job_queue import (
    JOB_TYPE_RECEIVED_PO_BARCODE_PDF,
    JOB_TYPE_RECEIVED_PO_INVOICE_PDF,
    JOB_TYPE_RECEIVED_PO_PACKING_LIST_PDF,
    JOB_TYPE_RECEIVED_PO_PARSE,
    enqueue_processing_job,
)
from app.services.packing_list_service import assign_cartons_for_received_po

router = APIRouter(prefix='/received-pos', tags=['received_pos'])
object_storage = get_object_storage_service()

UPLOAD_DIR = Path('static/uploads/received-pos')
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_UPLOAD_CONTENT_TYPES = {
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
ALLOWED_UPLOAD_SUFFIXES = {'.pdf', '.xls', '.xlsx'}


def _json_loads(raw: str | None) -> dict[str, object]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _to_invoice_response(record: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=record.id,
        received_po_id=record.received_po_id,
        company_id=record.company_id,
        invoice_number=record.invoice_number,
        invoice_date=record.invoice_date,
        gross_weight=float(record.gross_weight) if record.gross_weight is not None else None,
        subtotal=float(record.subtotal),
        igst_rate=float(record.igst_rate),
        igst_amount=float(record.igst_amount),
        total_amount=float(record.total_amount),
        status=record.status,
        file_url=record.file_url,
        created_at=record.created_at,
    )


def _to_packing_list_response(record: PackingList) -> PackingListResponse:
    return PackingListResponse(
        id=record.id,
        received_po_id=record.received_po_id,
        company_id=record.company_id,
        status=record.status,
        file_url=record.file_url,
        created_at=record.created_at,
        cartons=record.cartons,
    )


def _get_company_settings(db: Session, company_id: str) -> CompanySettings:
    company_settings = db.query(CompanySettings).filter(CompanySettings.company_id == company_id).first()
    if company_settings is None:
        company_settings = CompanySettings(id=str(uuid4()), company_id=company_id)
        db.add(company_settings)
        db.flush()
    return company_settings


def _get_default_igst_rate(company_settings: CompanySettings) -> float:
    settings_payload = _json_loads(company_settings.settings_json)
    brand_profile = settings_payload.get('brand_profile')
    if isinstance(brand_profile, dict):
        value = brand_profile.get('default_igst_rate')
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return 5.0
    return 5.0


def _format_invoice_number(prefix: str, next_number: int) -> str:
    year = datetime.now(timezone.utc).year
    return f'{prefix}-{year}-{next_number:03d}'


def _get_invoice_or_404(db: Session, company_id: str, received_po_id: str) -> Invoice:
    record = db.query(Invoice).filter(
        Invoice.company_id == company_id,
        Invoice.received_po_id == received_po_id,
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found.')
    return record


def _get_packing_list_or_404(db: Session, company_id: str, received_po_id: str) -> PackingList:
    record = db.query(PackingList).filter(
        PackingList.company_id == company_id,
        PackingList.received_po_id == received_po_id,
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Packing list not found.')
    return record


def _get_received_po_or_404(db: Session, company_id: str, received_po_id: str) -> ReceivedPO:
    record = db.query(ReceivedPO).filter(
        ReceivedPO.id == received_po_id,
        ReceivedPO.company_id == company_id,
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Received PO not found.')
    return record


def _to_received_po_response(record: ReceivedPO) -> ReceivedPOResponse:
    return ReceivedPOResponse(
        id=record.id,
        company_id=record.company_id,
        file_url=record.file_url,
        po_number=record.po_number,
        po_date=record.po_date,
        distributor=record.distributor,
        status=record.status,
        raw_extracted_json=_json_loads(record.raw_extracted_json),
        created_at=record.created_at,
        updated_at=record.updated_at,
        items=record.items,
    )


@router.post('/upload', response_model=ReceivedPOUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_received_po(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> ReceivedPOUploadResponse:
    content_type = file.content_type or 'application/octet-stream'
    suffix = Path(file.filename or '').suffix.lower()
    if content_type not in ALLOWED_UPLOAD_CONTENT_TYPES and suffix not in ALLOWED_UPLOAD_SUFFIXES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only PDF, XLS, and XLSX files are allowed.')

    unique_name = f'{datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")}-{uuid4().hex}{suffix or ".pdf"}'
    key = f'received-pos/{current_user.company_id}/{unique_name}'
    content = await file.read()

    if object_storage.enabled:
        stored_url = object_storage.upload_bytes(key=key, content=content, content_type=content_type)
        if not stored_url:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to store uploaded PO file.')
    else:
        file_path = UPLOAD_DIR / unique_name
        file_path.write_bytes(content)
        stored_url = f'/static/uploads/received-pos/{unique_name}'

    record = ReceivedPO(
        id=str(uuid4()),
        company_id=current_user.company_id,
        file_url=stored_url,
        status='uploaded',
        raw_extracted_json=json.dumps({}, separators=(',', ':')),
    )
    db.add(record)
    db.flush()
    log_audit(
        db,
        action='received_po.upload',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id},
    )
    db.commit()
    enqueue_processing_job(
        db,
        company_id=current_user.company_id,
        job_type=JOB_TYPE_RECEIVED_PO_PARSE,
        payload={'received_po_id': record.id},
        created_by_user_id=current_user.id,
        input_ref=record.file_url,
    )
    db.commit()
    return ReceivedPOUploadResponse(received_po_id=record.id, status=record.status)


@router.get('', response_model=ReceivedPOListResponse)
def list_received_pos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: ReceivedPOStatus | None = Query(default=None, alias='status'),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ReceivedPOListResponse:
    query = db.query(ReceivedPO).filter(ReceivedPO.company_id == current_user.company_id)
    if status_filter:
        query = query.filter(ReceivedPO.status == status_filter)
    total = query.count()
    rows = query.order_by(ReceivedPO.created_at.desc()).offset(offset).limit(limit).all()

    line_item_counts = {
        received_po_id: count
        for received_po_id, count in (
            db.query(ReceivedPOLineItem.received_po_id, func.count(ReceivedPOLineItem.id))
            .filter(ReceivedPOLineItem.received_po_id.in_([row.id for row in rows] or ['']))
            .group_by(ReceivedPOLineItem.received_po_id)
            .all()
        )
    }

    return ReceivedPOListResponse(
        items=[
            ReceivedPOListItemResponse(
                id=row.id,
                po_number=row.po_number,
                po_date=row.po_date,
                distributor=row.distributor,
                status=row.status,
                line_item_count=int(line_item_counts.get(row.id, 0) or 0),
                created_at=row.created_at,
            )
            for row in rows
        ],
        total=total,
    )


@router.get('/{received_po_id}', response_model=ReceivedPOResponse)
def get_received_po(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReceivedPOResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    return _to_received_po_response(record)


@router.patch('/{received_po_id}', response_model=ReceivedPOResponse)
def update_received_po_header(
    received_po_id: str,
    payload: ReceivedPOHeaderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> ReceivedPOResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if record.status == 'confirmed':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Confirmed received POs cannot be edited.')

    updates = payload.model_dump(exclude_unset=True)
    if 'po_number' in updates:
        record.po_number = updates['po_number'].strip() if updates['po_number'] else None
    if 'po_date' in updates:
        record.po_date = updates['po_date']
    if 'distributor' in updates and updates['distributor'] is not None:
        cleaned = updates['distributor'].strip()
        record.distributor = cleaned or record.distributor

    log_audit(
        db,
        action='received_po.update_header',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id},
    )
    db.commit()
    db.refresh(record)
    return _to_received_po_response(record)


@router.put('/{received_po_id}/items', response_model=ReceivedPOResponse)
def update_received_po_items(
    received_po_id: str,
    payload: ReceivedPOLineItemBatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> ReceivedPOResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if record.status == 'confirmed':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Confirmed received POs cannot be edited.')

    item_updates = {item.id: item for item in payload.items}
    rows = db.query(ReceivedPOLineItem).filter(ReceivedPOLineItem.received_po_id == record.id).all()
    for row in rows:
        update = item_updates.get(row.id)
        if update is None:
            continue
        row.brand_style_code = update.brand_style_code.strip()
        row.styli_style_id = update.styli_style_id.strip() if update.styli_style_id else None
        row.model_number = update.model_number.strip() if update.model_number else None
        row.option_id = update.option_id.strip() if update.option_id else None
        row.sku_id = update.sku_id.strip()
        row.color = update.color.strip() if update.color else None
        row.size = update.size.strip() if update.size else None
        row.quantity = update.quantity
        row.po_price = update.po_price

    log_audit(
        db,
        action='received_po.update_items',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id, 'item_count': str(len(payload.items))},
    )
    db.commit()
    db.refresh(record)
    return _to_received_po_response(record)


@router.post('/{received_po_id}/confirm', response_model=ReceivedPOConfirmResponse)
def confirm_received_po(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> ReceivedPOConfirmResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if len(record.items) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot confirm a received PO without line items.')
    record.status = 'confirmed'
    log_audit(
        db,
        action='received_po.confirm',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id},
    )
    db.commit()
    return ReceivedPOConfirmResponse(id=record.id, status=record.status)


@router.post('/{received_po_id}/barcode', response_model=BarcodeJobCreateResponse, status_code=status.HTTP_201_CREATED)
def create_barcode_job(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> BarcodeJobCreateResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if record.status != 'confirmed':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Confirm the received PO before generating documents.')

    job = BarcodeJob(
        id=str(uuid4()),
        received_po_id=record.id,
        status='pending',
        total_stickers=len(record.items),
    )
    db.add(job)
    log_audit(
        db,
        action='received_po.barcode_job.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id, 'barcode_job_id': job.id},
    )
    enqueue_processing_job(
        db,
        company_id=current_user.company_id,
        job_type=JOB_TYPE_RECEIVED_PO_BARCODE_PDF,
        payload={'barcode_job_id': job.id, 'received_po_id': record.id},
        created_by_user_id=current_user.id,
        input_ref=record.file_url,
    )
    db.commit()
    return BarcodeJobCreateResponse(job_id=job.id, status=job.status)


@router.get('/{received_po_id}/barcode/status', response_model=BarcodeJobResponse)
def get_barcode_job_status(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BarcodeJobResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    job = db.query(BarcodeJob).filter(BarcodeJob.received_po_id == received_po_id).order_by(BarcodeJob.created_at.desc()).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Barcode job not found.')
    return BarcodeJobResponse.model_validate(job)


@router.post('/{received_po_id}/invoice', response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice_draft(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> InvoiceResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if record.status != 'confirmed':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Confirm the received PO before creating an invoice.')

    existing = db.query(Invoice).filter(
        Invoice.company_id == current_user.company_id,
        Invoice.received_po_id == record.id,
    ).first()
    if existing is not None:
        return _to_invoice_response(existing)

    company_settings = _get_company_settings(db, current_user.company_id)
    subtotal = sum(float(item.po_price or 0) * int(item.quantity or 0) for item in record.items)
    igst_rate = _get_default_igst_rate(company_settings)
    igst_amount = round(subtotal * igst_rate / 100, 2)
    total_amount = round(subtotal + igst_amount, 2)

    invoice_number = _format_invoice_number(company_settings.invoice_prefix or 'INV', company_settings.invoice_next_number)
    invoice = Invoice(
        id=str(uuid4()),
        received_po_id=record.id,
        company_id=current_user.company_id,
        invoice_number=invoice_number,
        invoice_date=datetime.now(timezone.utc),
        subtotal=subtotal,
        igst_rate=igst_rate,
        igst_amount=igst_amount,
        total_amount=total_amount,
        status='draft',
    )
    company_settings.invoice_next_number += 1
    db.add(invoice)
    log_audit(
        db,
        action='received_po.invoice.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id, 'invoice_number': invoice.invoice_number},
    )
    db.commit()
    db.refresh(invoice)
    return _to_invoice_response(invoice)


@router.get('/{received_po_id}/invoice', response_model=InvoiceResponse)
def get_invoice(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvoiceResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    invoice = _get_invoice_or_404(db, current_user.company_id, received_po_id)
    return _to_invoice_response(invoice)


@router.patch('/{received_po_id}/invoice', response_model=InvoiceResponse)
def update_invoice(
    received_po_id: str,
    payload: InvoiceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> InvoiceResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    invoice = _get_invoice_or_404(db, current_user.company_id, received_po_id)
    invoice.gross_weight = payload.gross_weight
    log_audit(
        db,
        action='received_po.invoice.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': received_po_id, 'invoice_id': invoice.id},
    )
    db.commit()
    db.refresh(invoice)
    return _to_invoice_response(invoice)


@router.post('/{received_po_id}/invoice/generate-pdf', response_model=InvoiceGeneratePdfResponse)
def generate_invoice_pdf_endpoint(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> InvoiceGeneratePdfResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    invoice = _get_invoice_or_404(db, current_user.company_id, received_po_id)
    enqueue_processing_job(
        db,
        company_id=current_user.company_id,
        job_type=JOB_TYPE_RECEIVED_PO_INVOICE_PDF,
        payload={'invoice_id': invoice.id, 'received_po_id': received_po_id},
        created_by_user_id=current_user.id,
    )
    db.commit()
    return InvoiceGeneratePdfResponse(invoice_id=invoice.id, status=invoice.status, file_url=invoice.file_url)


@router.post('/{received_po_id}/packing-list', response_model=PackingListCreateResponse, status_code=status.HTTP_201_CREATED)
def create_packing_list(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> PackingListCreateResponse:
    record = _get_received_po_or_404(db, current_user.company_id, received_po_id)
    if record.status != 'confirmed':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Confirm the received PO before creating a packing list.')

    packing_list, total_cartons, total_pieces = assign_cartons_for_received_po(
        db,
        received_po=record,
        company_id=current_user.company_id,
    )
    log_audit(
        db,
        action='received_po.packing_list.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': record.id, 'packing_list_id': packing_list.id},
    )
    db.commit()
    return PackingListCreateResponse(
        packing_list_id=packing_list.id,
        total_cartons=total_cartons,
        total_pieces=total_pieces,
    )


@router.get('/{received_po_id}/packing-list', response_model=PackingListResponse)
def get_packing_list(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PackingListResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    packing_list = _get_packing_list_or_404(db, current_user.company_id, received_po_id)
    return _to_packing_list_response(packing_list)


@router.patch('/{received_po_id}/packing-list/cartons/{carton_id}', response_model=PackingListCartonResponse)
def update_packing_list_carton(
    received_po_id: str,
    carton_id: str,
    payload: PackingListCartonUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> PackingListCartonResponse:
    packing_list = _get_packing_list_or_404(db, current_user.company_id, received_po_id)
    carton = db.query(PackingListCarton).filter(
        PackingListCarton.id == carton_id,
        PackingListCarton.packing_list_id == packing_list.id,
    ).first()
    if carton is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Packing list carton not found.')

    updates = payload.model_dump(exclude_unset=True)
    if 'gross_weight' in updates:
        carton.gross_weight = updates['gross_weight']
    if 'net_weight' in updates:
        carton.net_weight = updates['net_weight']
    if 'dimensions' in updates:
        carton.dimensions = updates['dimensions']

    log_audit(
        db,
        action='received_po.packing_list.carton.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'received_po_id': received_po_id, 'carton_id': carton.id},
    )
    db.commit()
    db.refresh(carton)
    return PackingListCartonResponse.model_validate(carton)


@router.post('/{received_po_id}/packing-list/generate-pdf', response_model=PackingListGeneratePdfResponse)
def generate_packing_list_pdf_endpoint(
    received_po_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> PackingListGeneratePdfResponse:
    _get_received_po_or_404(db, current_user.company_id, received_po_id)
    packing_list = _get_packing_list_or_404(db, current_user.company_id, received_po_id)
    enqueue_processing_job(
        db,
        company_id=current_user.company_id,
        job_type=JOB_TYPE_RECEIVED_PO_PACKING_LIST_PDF,
        payload={'packing_list_id': packing_list.id, 'received_po_id': received_po_id},
        created_by_user_id=current_user.id,
    )
    db.commit()
    return PackingListGeneratePdfResponse(
        packing_list_id=packing_list.id,
        status=packing_list.status,
        file_url=packing_list.file_url,
    )
