from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.barcode_job import BarcodeJob
from app.models.received_po import ReceivedPO
from app.models.user import User
from app.schemas.received_po import BarcodeJobListItemResponse, BarcodeJobListResponse

router = APIRouter(prefix='/barcodes', tags=['barcodes'])


@router.get('', response_model=BarcodeJobListResponse)
def list_barcodes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> BarcodeJobListResponse:
    query = (
        db.query(BarcodeJob, ReceivedPO.po_number)
        .join(ReceivedPO, ReceivedPO.id == BarcodeJob.received_po_id)
        .filter(ReceivedPO.company_id == current_user.company_id)
    )
    total = query.count()
    rows = (
        query.order_by(BarcodeJob.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = [
        BarcodeJobListItemResponse(
            id=job.id,
            received_po_id=job.received_po_id,
            po_number=po_number,
            template_kind=job.template_kind,
            template_id=job.template_id,
            status=job.status,
            total_stickers=int(job.total_stickers),
            total_pages=int(job.total_pages),
            file_url=job.file_url,
            created_at=job.created_at,
        )
        for job, po_number in rows
    ]
    return BarcodeJobListResponse(items=items, total=total)
