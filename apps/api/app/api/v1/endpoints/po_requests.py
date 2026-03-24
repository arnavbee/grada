import csv
import io
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.config.styli_attributes import PO_EXPORT_GROUP_ROW, PO_EXPORT_HEADERS
from app.models import PORequest, PORequestColorway, PORequestItem, Product, User
from app.schemas.po_request import (
    PORequestBatchUpdateItems,
    PORequestCreate,
    PORequestExportFormat,
    PORequestListResponse,
    PORequestResponse,
    PORequestStatus,
)
from app.services.po_builder import (
    apply_item_updates,
    build_po_export_xlsx,
    build_po_export_row_values,
    ensure_item_colorways,
    normalize_ai_attributes,
    normalize_size_ratio,
    rebuild_po_request_rows,
    serialize_po_request,
)

router = APIRouter()


def _get_po_request_or_404(db: Session, company_id: str, po_request_id: str) -> PORequest:
    po_request = db.scalar(
        select(PORequest).where(
            PORequest.id == po_request_id,
            PORequest.company_id == company_id,
        )
    )
    if not po_request:
        raise HTTPException(status_code=404, detail='PO Request not found')
    return po_request


@router.post('/', response_model=PORequestResponse, status_code=status.HTTP_201_CREATED)
def create_po_request(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request_in: PORequestCreate,
) -> Any:
    products = db.scalars(
        select(Product).where(Product.company_id == current_user.company_id, Product.id.in_(request_in.product_ids))
    ).all()
    if len(products) != len(request_in.product_ids):
        raise HTTPException(status_code=400, detail='One or more products not found or access denied')

    products_by_id = {product.id: product for product in products}
    po_request = PORequest(
        company_id=current_user.company_id,
        created_by_user_id=current_user.id,
        status='draft',
    )
    db.add(po_request)
    db.flush()

    for product_id in request_in.product_ids:
        product = products_by_id[product_id]
        item = PORequestItem(
            po_request_id=po_request.id,
            product_id=product_id,
            size_ratio=normalize_size_ratio(None),
            extracted_attributes=normalize_ai_attributes(None),
        )
        po_request.items.append(item)
        item.colorways.append(
            PORequestColorway(
                letter='A',
                color_name=(product.color or 'Default').strip() or 'Default',
            )
        )

    rebuild_po_request_rows(db, po_request)
    db.commit()
    db.refresh(po_request)
    return serialize_po_request(db, po_request)


@router.get('', response_model=PORequestListResponse)
def list_po_requests(
    status_filter: PORequestStatus | None = Query(default=None, alias='status'),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = db.query(PORequest).filter(PORequest.company_id == current_user.company_id)
    if status_filter:
        query = query.filter(PORequest.status == status_filter)

    total = query.count()
    rows = query.order_by(PORequest.created_at.desc()).offset(offset).limit(limit).all()
    return PORequestListResponse(items=[serialize_po_request(db, row) for row in rows], total=total)


@router.get('/{po_request_id}', response_model=PORequestResponse)
def get_po_request(
    po_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = _get_po_request_or_404(db, current_user.company_id, po_request_id)
    if not po_request.rows:
        rebuild_po_request_rows(db, po_request)
        db.commit()
        db.refresh(po_request)
    return serialize_po_request(db, po_request)


@router.put('/{po_request_id}/items', response_model=PORequestResponse)
def update_po_request_items(
    po_request_id: str,
    items_update: PORequestBatchUpdateItems,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = _get_po_request_or_404(db, current_user.company_id, po_request_id)
    products_by_id = {
        product.id: product
        for product in db.scalars(
            select(Product).where(Product.id.in_([item.product_id for item in po_request.items]))
        ).all()
    }
    update_dict = {item.id: item for item in items_update.items}

    for item in po_request.items:
        payload = update_dict.get(item.id)
        if payload is None:
            continue
        product = products_by_id.get(item.product_id)
        default_color = product.color if product else None
        apply_item_updates(item, payload, default_color=default_color)
        ensure_item_colorways(item, default_color)

    rebuild_po_request_rows(db, po_request)
    db.commit()
    db.refresh(po_request)
    return serialize_po_request(db, po_request)


@router.post('/{po_request_id}/extract-attributes')
def extract_ai_attributes(
    po_request_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = _get_po_request_or_404(db, current_user.company_id, po_request_id)
    po_request.status = 'analyzing'
    db.commit()

    from app.services.ai import process_po_ai_extraction_job

    background_tasks.add_task(process_po_ai_extraction_job, po_request.id)
    return {'status': 'accepted', 'message': 'AI extraction started'}


def _build_csv_export(po_request: PORequest) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(PO_EXPORT_GROUP_ROW)
    writer.writerow(PO_EXPORT_HEADERS)
    for row in sorted(po_request.rows, key=lambda record: (record.row_index, record.created_at)):
        writer.writerow(build_po_export_row_values(row))
    output.seek(0)
    return StreamingResponse(
        iter(['\ufeff', output.getvalue()]),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename=po_request_{po_request.id}.csv'},
    )


@router.get('/{po_request_id}/export')
def export_po_request(
    po_request_id: str,
    format: PORequestExportFormat = Query(default='xlsx'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    po_request = _get_po_request_or_404(db, current_user.company_id, po_request_id)
    rebuild_po_request_rows(db, po_request)
    db.commit()
    db.refresh(po_request)

    if format == 'csv':
        return _build_csv_export(po_request)

    workbook_bytes = build_po_export_xlsx(po_request)
    return Response(
        content=workbook_bytes,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename=po_request_{po_request.id}.xlsx'},
    )


@router.delete('/{po_request_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_po_request(
    po_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    po_request = _get_po_request_or_404(db, current_user.company_id, po_request_id)
    db.delete(po_request)
    db.commit()
