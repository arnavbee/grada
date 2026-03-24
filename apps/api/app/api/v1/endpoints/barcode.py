from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.sticker_template import (
    BarcodeGenerateCustomSheetRequest,
    BarcodeGenerateResponse,
    BarcodeGenerateStyliSheetRequest,
)
from app.services.received_po_documents import (
    barcode_line_items_to_records,
    generate_custom_sheet_for_records,
    generate_styli_sheet_for_records,
)

router = APIRouter(prefix='/barcode', tags=['barcode'])


@router.post('/generate-styli-sheet', response_model=BarcodeGenerateResponse)
def generate_styli_sheet(
    payload: BarcodeGenerateStyliSheetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BarcodeGenerateResponse:
    del db
    records = barcode_line_items_to_records([item.model_dump() for item in payload.line_items])
    result = generate_styli_sheet_for_records(
        company_id=current_user.company_id,
        received_po_id=payload.received_po_id,
        records=records,
    )
    return BarcodeGenerateResponse(
        file_url=result.file_url,
        total_stickers=result.total_stickers,
        total_pages=result.total_pages,
    )


@router.post('/generate-custom-sheet', response_model=BarcodeGenerateResponse)
def generate_custom_sheet(
    payload: BarcodeGenerateCustomSheetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BarcodeGenerateResponse:
    records = barcode_line_items_to_records([item.model_dump() for item in payload.line_items])
    result = generate_custom_sheet_for_records(
        db=db,
        company_id=current_user.company_id,
        received_po_id=payload.received_po_id or payload.template_id,
        template_id=payload.template_id,
        records=records,
    )
    return BarcodeGenerateResponse(
        file_url=result.file_url,
        total_stickers=result.total_stickers,
        total_pages=result.total_pages,
    )
