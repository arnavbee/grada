from sqlalchemy import func
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.packing_list import PackingList, PackingListCarton
from app.models.received_po import ReceivedPO
from app.models.user import User
from app.schemas.packing_list import PackingListListItem, PackingListListResponse

router = APIRouter(prefix='/packing-lists', tags=['packing_lists'])


@router.get('', response_model=PackingListListResponse)
def list_packing_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> PackingListListResponse:
    query = db.query(PackingList).filter(PackingList.company_id == current_user.company_id)
    total = query.count()
    records = query.order_by(PackingList.created_at.desc()).offset(offset).limit(limit).all()

    # carton counts per packing list
    packing_list_ids = [r.id for r in records] or ['']
    carton_counts: dict[str, int] = {
        pl_id: count
        for pl_id, count in (
            db.query(PackingListCarton.packing_list_id, func.count(PackingListCarton.id))
            .filter(PackingListCarton.packing_list_id.in_(packing_list_ids))
            .group_by(PackingListCarton.packing_list_id)
            .all()
        )
    }
    total_pieces_map: dict[str, int] = {
        pl_id: total_pcs
        for pl_id, total_pcs in (
            db.query(PackingListCarton.packing_list_id, func.sum(PackingListCarton.total_pieces))
            .filter(PackingListCarton.packing_list_id.in_(packing_list_ids))
            .group_by(PackingListCarton.packing_list_id)
            .all()
        )
    }

    # po_number lookup
    received_po_ids = [r.received_po_id for r in records] or ['']
    po_number_map: dict[str, str | None] = {
        po_id: po_number
        for po_id, po_number in (
            db.query(ReceivedPO.id, ReceivedPO.po_number)
            .filter(ReceivedPO.id.in_(received_po_ids))
            .all()
        )
    }

    items = [
        PackingListListItem(
            id=r.id,
            received_po_id=r.received_po_id,
            po_number=po_number_map.get(r.received_po_id),
            invoice_number=r.invoice_number,
            invoice_date=r.invoice_date,
            carton_count=int(carton_counts.get(r.id, 0) or 0),
            total_pieces=int(total_pieces_map.get(r.id, 0) or 0),
            status=r.status,
            file_url=r.file_url,
            created_at=r.created_at,
        )
        for r in records
    ]
    return PackingListListResponse(items=items, total=total)
