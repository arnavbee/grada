from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.invoice import Invoice
from app.models.received_po import ReceivedPO
from app.models.user import User
from app.schemas.invoice import InvoiceListItemResponse, InvoiceListResponse

router = APIRouter(prefix='/invoices', tags=['invoices'])


@router.get('', response_model=InvoiceListResponse)
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> InvoiceListResponse:
    query = (
        db.query(Invoice, ReceivedPO.po_number)
        .join(ReceivedPO, ReceivedPO.id == Invoice.received_po_id)
        .filter(Invoice.company_id == current_user.company_id)
    )
    total = query.count()
    rows = (
        query.order_by(Invoice.invoice_date.desc(), Invoice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = [
        InvoiceListItemResponse(
            id=invoice.id,
            received_po_id=invoice.received_po_id,
            invoice_number=invoice.invoice_number,
            invoice_date=invoice.invoice_date,
            po_number=po_number,
            number_of_cartons=int(invoice.number_of_cartons),
            total_amount=float(invoice.total_amount),
            status=invoice.status,
            file_url=invoice.file_url,
            created_at=invoice.created_at,
        )
        for invoice, po_number in rows
    ]
    return InvoiceListResponse(items=items, total=total)
