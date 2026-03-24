from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.sticker_template import StickerElement, StickerTemplate
from app.models.user import User
from app.schemas.sticker_template import (
    StickerElementCreate,
    StickerElementResponse,
    StickerElementUpdate,
    StickerTemplateCreate,
    StickerTemplateDetailResponse,
    StickerTemplateListResponse,
    StickerTemplateReorderRequest,
    StickerTemplateSummaryResponse,
    StickerTemplateUpdate,
)
from app.services.received_po_documents import build_custom_preview_pdf, sample_preview_record

router = APIRouter(prefix='/sticker-templates', tags=['sticker_templates'])


def _to_element_response(element: StickerElement) -> StickerElementResponse:
    return StickerElementResponse(
        id=element.id,
        template_id=element.template_id,
        element_type=element.element_type,
        x_mm=float(element.x_mm),
        y_mm=float(element.y_mm),
        width_mm=float(element.width_mm),
        height_mm=float(element.height_mm),
        z_index=int(element.z_index),
        properties=element.properties if isinstance(element.properties, dict) else {},
        created_at=element.created_at,
        updated_at=element.updated_at,
    )


def _to_template_summary_response(template: StickerTemplate) -> StickerTemplateSummaryResponse:
    return StickerTemplateSummaryResponse(
        id=template.id,
        company_id=template.company_id,
        name=template.name,
        width_mm=float(template.width_mm),
        height_mm=float(template.height_mm),
        border_color=template.border_color,
        border_radius_mm=float(template.border_radius_mm),
        background_color=template.background_color,
        is_default=bool(template.is_default),
        created_at=template.created_at,
        updated_at=template.updated_at,
    )


def _to_template_detail_response(template: StickerTemplate) -> StickerTemplateDetailResponse:
    return StickerTemplateDetailResponse(
        **_to_template_summary_response(template).model_dump(),
        elements=[_to_element_response(element) for element in sorted(template.elements, key=lambda item: (item.z_index, item.created_at))],
    )


def _get_template_or_404(db: Session, company_id: str, template_id: str) -> StickerTemplate:
    template = (
        db.query(StickerTemplate)
        .filter(StickerTemplate.id == template_id, StickerTemplate.company_id == company_id)
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Sticker template not found.')
    return template


def _get_element_or_404(db: Session, template_id: str, element_id: str) -> StickerElement:
    element = (
        db.query(StickerElement)
        .filter(StickerElement.id == element_id, StickerElement.template_id == template_id)
        .first()
    )
    if element is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Sticker element not found.')
    return element


def _apply_default_flag(db: Session, template: StickerTemplate, is_default: bool) -> None:
    if not is_default:
        return
    (
        db.query(StickerTemplate)
        .filter(
            StickerTemplate.company_id == template.company_id,
            StickerTemplate.id != template.id,
            StickerTemplate.is_default.is_(True),
        )
        .update({'is_default': False}, synchronize_session=False)
    )


def _replace_elements(db: Session, template: StickerTemplate, elements: list[StickerElementCreate]) -> None:
    db.query(StickerElement).filter(StickerElement.template_id == template.id).delete(synchronize_session=False)
    db.flush()
    for index, element in enumerate(elements):
        db.add(
            StickerElement(
                id=str(uuid4()),
                template_id=template.id,
                element_type=element.element_type,
                x_mm=element.x_mm,
                y_mm=element.y_mm,
                width_mm=element.width_mm,
                height_mm=element.height_mm,
                z_index=element.z_index if element.z_index is not None else index,
                properties=element.properties,
            )
        )


@router.get('', response_model=StickerTemplateListResponse)
def list_sticker_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerTemplateListResponse:
    templates = (
        db.query(StickerTemplate)
        .filter(StickerTemplate.company_id == current_user.company_id)
        .order_by(StickerTemplate.is_default.desc(), StickerTemplate.updated_at.desc())
        .all()
    )
    return StickerTemplateListResponse(items=[_to_template_summary_response(template) for template in templates])


@router.post('', response_model=StickerTemplateDetailResponse, status_code=status.HTTP_201_CREATED)
def create_sticker_template(
    payload: StickerTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerTemplateDetailResponse:
    template = StickerTemplate(
        id=str(uuid4()),
        company_id=current_user.company_id,
        name=payload.name.strip(),
        width_mm=payload.width_mm,
        height_mm=payload.height_mm,
        border_color=payload.border_color,
        border_radius_mm=payload.border_radius_mm,
        background_color=payload.background_color,
        is_default=payload.is_default,
    )
    db.add(template)
    db.flush()
    _apply_default_flag(db, template, payload.is_default)
    _replace_elements(db, template, payload.elements)
    db.commit()
    db.refresh(template)
    return _to_template_detail_response(template)


@router.get('/{template_id}', response_model=StickerTemplateDetailResponse)
def get_sticker_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerTemplateDetailResponse:
    template = _get_template_or_404(db, current_user.company_id, template_id)
    return _to_template_detail_response(template)


@router.put('/{template_id}', response_model=StickerTemplateDetailResponse)
def update_sticker_template(
    template_id: str,
    payload: StickerTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerTemplateDetailResponse:
    template = _get_template_or_404(db, current_user.company_id, template_id)
    updates = payload.model_dump(exclude_unset=True)

    for field in ('name', 'width_mm', 'height_mm', 'border_color', 'border_radius_mm', 'background_color', 'is_default'):
        if field in updates:
            value = updates[field]
            setattr(template, field, value.strip() if field == 'name' and isinstance(value, str) else value)

    if 'is_default' in updates:
        _apply_default_flag(db, template, bool(updates['is_default']))
    if payload.elements is not None:
        _replace_elements(db, template, payload.elements)

    db.commit()
    db.refresh(template)
    return _to_template_detail_response(template)


@router.delete('/{template_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_sticker_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    template = _get_template_or_404(db, current_user.company_id, template_id)
    db.delete(template)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post('/{template_id}/elements', response_model=StickerElementResponse, status_code=status.HTTP_201_CREATED)
def add_sticker_element(
    template_id: str,
    payload: StickerElementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerElementResponse:
    _get_template_or_404(db, current_user.company_id, template_id)
    element = StickerElement(
        id=str(uuid4()),
        template_id=template_id,
        element_type=payload.element_type,
        x_mm=payload.x_mm,
        y_mm=payload.y_mm,
        width_mm=payload.width_mm,
        height_mm=payload.height_mm,
        z_index=payload.z_index,
        properties=payload.properties,
    )
    db.add(element)
    db.commit()
    db.refresh(element)
    return _to_element_response(element)


@router.put('/{template_id}/elements/{element_id}', response_model=StickerElementResponse)
def update_sticker_element(
    template_id: str,
    element_id: str,
    payload: StickerElementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerElementResponse:
    _get_template_or_404(db, current_user.company_id, template_id)
    element = _get_element_or_404(db, template_id, element_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(element, field, value)
    db.commit()
    db.refresh(element)
    return _to_element_response(element)


@router.delete('/{template_id}/elements/{element_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_sticker_element(
    template_id: str,
    element_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _get_template_or_404(db, current_user.company_id, template_id)
    element = _get_element_or_404(db, template_id, element_id)
    db.delete(element)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post('/{template_id}/reorder', response_model=StickerTemplateDetailResponse)
def reorder_sticker_elements(
    template_id: str,
    payload: StickerTemplateReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StickerTemplateDetailResponse:
    template = _get_template_or_404(db, current_user.company_id, template_id)
    elements = {element.id: element for element in template.elements}
    for index, element_id in enumerate(payload.element_ids):
        element = elements.get(element_id)
        if element is not None:
            element.z_index = index
    db.commit()
    db.refresh(template)
    return _to_template_detail_response(template)


@router.post('/{template_id}/preview', response_class=Response)
def preview_sticker_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    template = _get_template_or_404(db, current_user.company_id, template_id)
    pdf_content = build_custom_preview_pdf(
        template,
        sorted(template.elements, key=lambda item: (item.z_index, item.created_at)),
        sample_preview_record(),
    )
    return Response(
        content=pdf_content,
        media_type='application/pdf',
        headers={'Content-Disposition': f'inline; filename="{template.name}-preview.pdf"'},
    )
