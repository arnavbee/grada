from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.marketplace_document_template import MarketplaceDocumentTemplate
from app.models.user import User
from app.schemas.marketplace_document_template import (
    MarketplaceDocumentTemplateCreateRequest,
    MarketplaceDocumentTemplateListResponse,
    MarketplaceDocumentTemplateParseResponse,
    MarketplaceDocumentTemplateResponse,
    MarketplaceDocumentTemplateUpdateRequest,
)
from app.services.marketplace_document_templates import (
    dumps_json,
    loads_json,
    normalize_marketplace_key,
    normalize_template_columns,
    parse_marketplace_sample,
    save_sample_file,
    template_kind_for_document_type,
)

router = APIRouter(prefix='/marketplace-templates', tags=['marketplace_templates'])

DbSession = Annotated[Session, Depends(get_db)]
ReadUser = Annotated[User, Depends(get_current_user)]
WriteUser = Annotated[User, Depends(require_roles('admin', 'manager', 'operator'))]


def _to_response(record: MarketplaceDocumentTemplate) -> MarketplaceDocumentTemplateResponse:
    schema_payload = loads_json(record.schema_json)
    layout_payload = loads_json(record.layout_json)
    return MarketplaceDocumentTemplateResponse(
        id=record.id,
        company_id=record.company_id,
        name=record.name,
        marketplace_key=record.marketplace_key,
        document_type=record.document_type,
        template_kind=record.template_kind,
        file_format=record.file_format,
        sample_file_url=record.sample_file_url,
        sheet_name=record.sheet_name,
        header_row_index=record.header_row_index,
        columns=normalize_template_columns(schema_payload.get('columns') if isinstance(schema_payload, dict) else []),
        layout=layout_payload,
        is_default=record.is_default,
        is_active=record.is_active,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def _get_template_or_404(db: Session, company_id: str, template_id: str) -> MarketplaceDocumentTemplate:
    record = (
        db.query(MarketplaceDocumentTemplate)
        .filter(
            MarketplaceDocumentTemplate.id == template_id,
            MarketplaceDocumentTemplate.company_id == company_id,
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Marketplace template not found.')
    return record


def _apply_default_uniqueness(
    db: Session,
    *,
    company_id: str,
    document_type: str,
    marketplace_key: str,
    keep_template_id: str | None,
) -> None:
    (
        db.query(MarketplaceDocumentTemplate)
        .filter(
            MarketplaceDocumentTemplate.company_id == company_id,
            MarketplaceDocumentTemplate.document_type == document_type,
            MarketplaceDocumentTemplate.marketplace_key == marketplace_key,
            MarketplaceDocumentTemplate.id != (keep_template_id or ''),
        )
        .update({'is_default': False}, synchronize_session=False)
    )


@router.get('', response_model=MarketplaceDocumentTemplateListResponse)
def list_marketplace_templates(
    db: DbSession,
    current_user: ReadUser,
    document_type: str | None = Query(default=None, max_length=32),
    marketplace_key: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> MarketplaceDocumentTemplateListResponse:
    query = db.query(MarketplaceDocumentTemplate).filter(
        MarketplaceDocumentTemplate.company_id == current_user.company_id
    )
    if document_type:
        query = query.filter(MarketplaceDocumentTemplate.document_type == document_type.strip().lower())
    if marketplace_key:
        try:
            normalized_key = normalize_marketplace_key(marketplace_key)
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
        query = query.filter(MarketplaceDocumentTemplate.marketplace_key == normalized_key)

    total = query.count()
    records = (
        query.order_by(
            MarketplaceDocumentTemplate.is_default.desc(),
            MarketplaceDocumentTemplate.updated_at.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )
    return MarketplaceDocumentTemplateListResponse(items=[_to_response(record) for record in records], total=total)


@router.post('', response_model=MarketplaceDocumentTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_marketplace_template(
    payload: MarketplaceDocumentTemplateCreateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> MarketplaceDocumentTemplateResponse:
    try:
        marketplace_key = normalize_marketplace_key(payload.marketplace_key)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err

    existing = (
        db.query(MarketplaceDocumentTemplate)
        .filter(
            MarketplaceDocumentTemplate.company_id == current_user.company_id,
            func.lower(MarketplaceDocumentTemplate.name) == payload.name.strip().lower(),
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Template name already exists.')

    if payload.is_default:
        _apply_default_uniqueness(
            db,
            company_id=current_user.company_id,
            document_type=payload.document_type,
            marketplace_key=marketplace_key,
            keep_template_id=None,
        )

    record = MarketplaceDocumentTemplate(
        company_id=current_user.company_id,
        name=payload.name.strip(),
        marketplace_key=marketplace_key,
        document_type=payload.document_type,
        template_kind=payload.template_kind,
        file_format=payload.file_format,
        sample_file_url=payload.sample_file_url,
        sheet_name=payload.sheet_name.strip() if payload.sheet_name else None,
        header_row_index=payload.header_row_index,
        schema_json=dumps_json({'columns': normalize_template_columns([column.model_dump() for column in payload.columns])}),
        layout_json=dumps_json(payload.layout),
        is_default=payload.is_default,
        is_active=payload.is_active,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_response(record)


@router.patch('/{template_id}', response_model=MarketplaceDocumentTemplateResponse)
def update_marketplace_template(
    template_id: str,
    payload: MarketplaceDocumentTemplateUpdateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> MarketplaceDocumentTemplateResponse:
    record = _get_template_or_404(db, current_user.company_id, template_id)
    updates = payload.model_dump(exclude_unset=True)

    if 'name' in updates and updates['name'] is not None:
        cleaned_name = updates['name'].strip()
        existing = (
            db.query(MarketplaceDocumentTemplate)
            .filter(
                MarketplaceDocumentTemplate.company_id == current_user.company_id,
                MarketplaceDocumentTemplate.id != record.id,
                func.lower(MarketplaceDocumentTemplate.name) == cleaned_name.lower(),
            )
            .first()
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Template name already exists.')
        record.name = cleaned_name

    if 'marketplace_key' in updates and updates['marketplace_key'] is not None:
        try:
            record.marketplace_key = normalize_marketplace_key(str(updates['marketplace_key']))
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
    if 'document_type' in updates and updates['document_type'] is not None:
        record.document_type = str(updates['document_type'])
    if 'template_kind' in updates and updates['template_kind'] is not None:
        record.template_kind = str(updates['template_kind'])
    if 'file_format' in updates and updates['file_format'] is not None:
        record.file_format = str(updates['file_format'])
    if 'sample_file_url' in updates:
        record.sample_file_url = updates['sample_file_url']
    if 'sheet_name' in updates:
        record.sheet_name = updates['sheet_name'].strip() if updates['sheet_name'] else None
    if 'header_row_index' in updates and updates['header_row_index'] is not None:
        record.header_row_index = int(updates['header_row_index'])
    if 'columns' in updates and updates['columns'] is not None:
        columns = [column.model_dump() for column in updates['columns']]
        record.schema_json = dumps_json({'columns': normalize_template_columns(columns)})
    if 'layout' in updates and updates['layout'] is not None:
        record.layout_json = dumps_json(updates['layout'])
    if 'is_active' in updates and updates['is_active'] is not None:
        record.is_active = bool(updates['is_active'])
    if 'is_default' in updates and updates['is_default'] is not None:
        record.is_default = bool(updates['is_default'])
        if record.is_default:
            _apply_default_uniqueness(
                db,
                company_id=current_user.company_id,
                document_type=record.document_type,
                marketplace_key=record.marketplace_key,
                keep_template_id=record.id,
            )

    db.commit()
    db.refresh(record)
    return _to_response(record)


@router.delete('/{template_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_marketplace_template(
    template_id: str,
    db: DbSession,
    current_user: WriteUser,
) -> None:
    record = _get_template_or_404(db, current_user.company_id, template_id)
    db.delete(record)
    db.commit()


@router.post('/parse-sample', response_model=MarketplaceDocumentTemplateParseResponse)
async def parse_marketplace_template_sample(
    file: UploadFile = File(...),
    document_type: str = Form(default='catalog'),
    current_user: User = Depends(require_roles('admin', 'manager', 'operator')),
) -> MarketplaceDocumentTemplateParseResponse:
    filename = file.filename or 'sample.csv'
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Uploaded file is empty.')

    lowered_name = filename.lower()
    if document_type in {'catalog', 'po_builder'}:
        allowed_suffixes = ('.csv', '.xlsx')
        error_message = 'Only CSV and XLSX files are supported.'
    elif document_type == 'packing_list':
        allowed_suffixes = ('.pdf',)
        error_message = 'Packing list learning currently supports PDF samples only.'
    elif document_type == 'barcode':
        allowed_suffixes = ('.pdf', '.png', '.jpg', '.jpeg', '.webp')
        error_message = 'Barcode learning currently supports PDF and image samples only.'
    else:
        allowed_suffixes = ('.csv', '.xlsx', '.pdf', '.png', '.jpg', '.jpeg', '.webp')
        error_message = 'Unsupported sample format.'
    if not lowered_name.endswith(allowed_suffixes):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_message)

    try:
        parsed = parse_marketplace_sample(content=content, filename=filename, document_type=document_type)
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Failed to parse sample: {err!s}') from err

    file_url = save_sample_file(
        company_id=current_user.company_id,
        filename=filename,
        content=content,
        content_type=file.content_type or 'application/octet-stream',
    )
    return MarketplaceDocumentTemplateParseResponse(
        document_type=document_type,
        template_kind=template_kind_for_document_type(document_type),
        file_format=str(parsed['file_format']),
        sample_file_url=file_url,
        sheet_name=parsed.get('sheet_name') if isinstance(parsed.get('sheet_name'), str) else None,
        header_row_index=int(parsed['header_row_index']),
        detected_headers=list(parsed.get('detected_headers') or []),
        columns=normalize_template_columns(list(parsed.get('columns') or [])),
        layout=parsed.get('layout') if isinstance(parsed.get('layout'), dict) else {},
    )
