import json
import re
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.audit import log_audit
from app.db.session import get_db
from app.models.company_settings import CompanySettings
from app.models.marketplace_export import MarketplaceExport
from app.models.processing_job import ProcessingJob
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_measurement import ProductMeasurement
from app.models.user import User
from app.schemas.catalog import (
    JobStatus,
    JobType,
    MarketplaceExportCreateRequest,
    MarketplaceExportListResponse,
    MarketplaceExportResponse,
    ProcessingJobCreateRequest,
    ProcessingJobListResponse,
    ProcessingJobResponse,
    ProductCreateRequest,
    ProductImageCreateRequest,
    ProductImageResponse,
    ProductListResponse,
    ProductMeasurementCreateRequest,
    ProductMeasurementResponse,
    ProductResponse,
    ProductStatus,
    ProductUpdateRequest,
)
from app.services.ai import process_image_analysis_job, process_techpack_ocr_job

router = APIRouter(prefix='/catalog', tags=['catalog'])

DbSession = Annotated[Session, Depends(get_db)]
ReadUser = Annotated[User, Depends(get_current_user)]
WriteUser = Annotated[User, Depends(require_roles('admin', 'manager', 'operator'))]


def _json_loads(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _json_dumps(payload: dict[str, Any] | None) -> str:
    return json.dumps(payload or {}, separators=(',', ':'))


def _sku_token(value: str | None, fallback: str) -> str:
    cleaned = re.sub(r'[^A-Za-z0-9]+', '-', (value or '').strip()).strip('-').upper()
    return cleaned or fallback


def _normalize_explicit_sku(value: str) -> str:
    cleaned = re.sub(r'[^A-Za-z0-9-]+', '-', value.strip()).strip('-').upper()
    if not cleaned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='SKU cannot be empty.')
    return cleaned


def _find_unique_sku(db: Session, company_id: str, base_sku: str, current_product_id: str | None = None) -> str:
    candidate = base_sku
    suffix = 1
    while True:
        query = db.query(Product).filter(Product.company_id == company_id, Product.sku == candidate)
        if current_product_id is not None:
            query = query.filter(Product.id != current_product_id)
        if query.first() is None:
            return candidate
        suffix += 1
        candidate = f'{base_sku}-{suffix:02d}'


def _generate_sku(db: Session, company_id: str, company_settings: CompanySettings | None, payload: ProductCreateRequest) -> str:
    template = (
        company_settings.sku_format
        if company_settings and company_settings.sku_format
        else '{BRAND}-{CATEGORY}-{COLOR}-{SIZE}'
    )
    base = template
    replacements = {
        '{BRAND}': _sku_token(payload.brand, 'GEN'),
        '{CATEGORY}': _sku_token(payload.category, 'CAT'),
        '{COLOR}': _sku_token(payload.color, 'CLR'),
        '{SIZE}': _sku_token(payload.size, 'STD'),
    }
    for key, value in replacements.items():
        base = base.replace(key, value)
    base = re.sub(r'-{2,}', '-', base).strip('-').upper() or 'SKU'
    return _find_unique_sku(db, company_id, base)


def _to_product_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        company_id=product.company_id,
        sku=product.sku,
        title=product.title,
        description=product.description,
        brand=product.brand,
        category=product.category,
        color=product.color,
        size=product.size,
        status=product.status,
        confidence_score=float(product.confidence_score) if product.confidence_score is not None else None,
        ai_attributes=_json_loads(product.ai_attributes_json),
        created_by_user_id=product.created_by_user_id,
        created_at=product.created_at,
        updated_at=product.updated_at,
        primary_image_url=getattr(product, 'primary_image_url', None),
    )


def _to_image_response(image: ProductImage) -> ProductImageResponse:
    return ProductImageResponse(
        id=image.id,
        product_id=image.product_id,
        file_name=image.file_name,
        file_url=image.file_url,
        mime_type=image.mime_type,
        file_size_bytes=image.file_size_bytes,
        width_px=image.width_px,
        height_px=image.height_px,
        processing_status=image.processing_status,
        analysis=_json_loads(image.analysis_json),
        created_at=image.created_at,
    )


def _to_measurement_response(measurement: ProductMeasurement) -> ProductMeasurementResponse:
    return ProductMeasurementResponse(
        id=measurement.id,
        product_id=measurement.product_id,
        measurement_key=measurement.measurement_key,
        measurement_value=float(measurement.measurement_value),
        unit=measurement.unit,
        source=measurement.source,
        confidence_score=float(measurement.confidence_score) if measurement.confidence_score is not None else None,
        needs_review=measurement.needs_review,
        notes=measurement.notes,
        created_at=measurement.created_at,
    )


def _to_export_response(record: MarketplaceExport) -> MarketplaceExportResponse:
    return MarketplaceExportResponse(
        id=record.id,
        company_id=record.company_id,
        requested_by_user_id=record.requested_by_user_id,
        marketplace=record.marketplace,
        export_format=record.export_format,
        status=record.status,
        filters=_json_loads(record.filters_json),
        file_url=record.file_url,
        error_message=record.error_message,
        row_count=record.row_count,
        created_at=record.created_at,
        completed_at=record.completed_at,
    )


def _to_job_response(record: ProcessingJob) -> ProcessingJobResponse:
    return ProcessingJobResponse(
        id=record.id,
        company_id=record.company_id,
        product_id=record.product_id,
        job_type=record.job_type,
        status=record.status,
        input_ref=record.input_ref,
        payload=_json_loads(record.payload_json),
        result=_json_loads(record.result_json),
        confidence_score=float(record.confidence_score) if record.confidence_score is not None else None,
        progress_percent=record.progress_percent,
        error_message=record.error_message,
        created_by_user_id=record.created_by_user_id,
        created_at=record.created_at,
        started_at=record.started_at,
        completed_at=record.completed_at,
    )


def _get_company_product_or_404(db: Session, company_id: str, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id, Product.company_id == company_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found.')
    return product


@router.get('/products', response_model=ProductListResponse)
def list_products(
    db: DbSession,
    current_user: ReadUser,
    search: str | None = Query(default=None, max_length=120),
    status_filter: ProductStatus | None = Query(default=None, alias='status'),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ProductListResponse:
    query = db.query(Product).filter(Product.company_id == current_user.company_id)
    if search:
        term = f'%{search.strip()}%'
        query = query.filter(
            or_(Product.sku.ilike(term), Product.title.ilike(term), Product.category.ilike(term))
        )
    if status_filter:
        query = query.filter(Product.status == status_filter)

    total = query.count()
    # Join with ProductImage to get the first image for each product
    # We use a subquery or a strategic join. For simplicity in MVP, we might just join and group by.
    # OR, we can use a separate query or an eager load if relation is defined.
    # Since Product model doesn't seem to have the relationship defined in what I viewed,
    # I will fetch images separately or use a subquery.
    
    # Efficient approach: Fetch products, then fetch primary images for these products.
    total = query.count()
    rows = query.order_by(Product.updated_at.desc()).offset(offset).limit(limit).all()
    
    if rows:
        product_ids = [str(r.id) for r in rows]
        # Fetch one image per product (limit 1 per product is hard in common SQL without window functions)
        # We'll just fetch all images for these products and pick one in python for now.
        images = db.query(ProductImage).filter(
            ProductImage.product_id.in_(product_ids),
            ProductImage.company_id == current_user.company_id
        ).order_by(ProductImage.created_at.asc()).all()
        image_map = {}
        for img in images:
            # Ensure both keys are strings for consistent comparison
            product_id_str = str(img.product_id)
            if product_id_str not in image_map:
                image_map[product_id_str] = img.file_url
        
        for row in rows:
            # Attach dynamic attribute - ensure row.id is string for lookup
            row_id_str = str(row.id)
            row.primary_image_url = image_map.get(row_id_str)

    return ProductListResponse(items=[_to_product_response(row) for row in rows], total=total)


@router.post('/products', response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreateRequest, db: DbSession, current_user: WriteUser) -> ProductResponse:
    company_settings = (
        db.query(CompanySettings).filter(CompanySettings.company_id == current_user.company_id).first()
    )

    if payload.sku:
        sku = _normalize_explicit_sku(payload.sku)
        existing = (
            db.query(Product)
            .filter(Product.company_id == current_user.company_id, Product.sku == sku)
            .first()
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='SKU already exists.')
    else:
        sku = _generate_sku(db, current_user.company_id, company_settings, payload)

    product = Product(
        id=str(uuid4()),
        company_id=current_user.company_id,
        sku=sku,
        title=payload.title.strip(),
        description=payload.description,
        brand=payload.brand,
        category=payload.category,
        color=payload.color,
        size=payload.size,
        status=payload.status,
        confidence_score=payload.confidence_score,
        ai_attributes_json=_json_dumps(payload.ai_attributes),
        created_by_user_id=current_user.id,
    )
    db.add(product)

    log_audit(
        db,
        action='catalog.product.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'product_id': product.id, 'sku': product.sku},
    )
    db.commit()
    db.refresh(product)
    return _to_product_response(product)


@router.get('/products/{product_id}', response_model=ProductResponse)
def get_product(product_id: str, db: DbSession, current_user: ReadUser) -> ProductResponse:
    product = _get_company_product_or_404(db, current_user.company_id, product_id)
    # Fetch primary image URL - get the first image for this product
    primary_image = db.query(ProductImage).filter(
        ProductImage.product_id == product_id,
        ProductImage.company_id == current_user.company_id
    ).order_by(ProductImage.created_at.asc()).first()
    if primary_image:
        product.primary_image_url = primary_image.file_url
    return _to_product_response(product)


@router.patch('/products/{product_id}', response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> ProductResponse:
    product = _get_company_product_or_404(db, current_user.company_id, product_id)

    updates = payload.model_dump(exclude_unset=True)
    if 'sku' in updates and updates['sku'] is not None:
        normalized_sku = _normalize_explicit_sku(updates['sku'])
        updates['sku'] = _find_unique_sku(
            db, current_user.company_id, normalized_sku, current_product_id=product.id
        )

    if 'title' in updates and updates['title'] is not None:
        updates['title'] = updates['title'].strip()

    if 'ai_attributes' in updates:
        product.ai_attributes_json = _json_dumps(updates.pop('ai_attributes'))

    for field_name, value in updates.items():
        setattr(product, field_name, value)

    log_audit(
        db,
        action='catalog.product.update',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'product_id': product.id},
    )
    db.commit()
    db.refresh(product)
    return _to_product_response(product)


@router.delete('/products/{product_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    db: DbSession,
    current_user: WriteUser,
) -> None:
    product = _get_company_product_or_404(db, current_user.company_id, product_id)
    
    log_audit(
        db,
        action='catalog.product.delete',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'product_id': product.id, 'sku': product.sku},
    )
    
    # Delete associated images, measurements, etc. (CASCADE should handle this, but explicit is better)
    db.query(ProductImage).filter(ProductImage.product_id == product_id).delete()
    db.query(ProductMeasurement).filter(ProductMeasurement.product_id == product_id).delete()
    db.query(ProcessingJob).filter(ProcessingJob.product_id == product_id).delete()
    
    db.delete(product)
    db.commit()


@router.post('/products/{product_id}/images', response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
def add_product_image(
    product_id: str,
    payload: ProductImageCreateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> ProductImageResponse:
    _get_company_product_or_404(db, current_user.company_id, product_id)
    image = ProductImage(
        id=str(uuid4()),
        company_id=current_user.company_id,
        product_id=product_id,
        file_name=payload.file_name,
        file_url=payload.file_url,
        mime_type=payload.mime_type,
        file_size_bytes=payload.file_size_bytes,
        width_px=payload.width_px,
        height_px=payload.height_px,
        processing_status=payload.processing_status,
        analysis_json=_json_dumps(payload.analysis),
    )
    db.add(image)

    log_audit(
        db,
        action='catalog.product.image.add',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'product_id': product_id, 'image_id': image.id},
    )
    db.commit()
    db.refresh(image)
    return _to_image_response(image)


@router.post(
    '/products/{product_id}/measurements',
    response_model=ProductMeasurementResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_product_measurement(
    product_id: str,
    payload: ProductMeasurementCreateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> ProductMeasurementResponse:
    _get_company_product_or_404(db, current_user.company_id, product_id)
    measurement = ProductMeasurement(
        id=str(uuid4()),
        company_id=current_user.company_id,
        product_id=product_id,
        measurement_key=payload.measurement_key,
        measurement_value=payload.measurement_value,
        unit=payload.unit,
        source=payload.source,
        confidence_score=payload.confidence_score,
        needs_review=payload.needs_review,
        notes=payload.notes,
    )
    db.add(measurement)

    log_audit(
        db,
        action='catalog.product.measurement.add',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'product_id': product_id, 'measurement_id': measurement.id},
    )
    db.commit()
    db.refresh(measurement)
    return _to_measurement_response(measurement)


@router.post('/exports', response_model=MarketplaceExportResponse, status_code=status.HTTP_201_CREATED)
def create_export(
    payload: MarketplaceExportCreateRequest,
    db: DbSession,
    current_user: WriteUser,
) -> MarketplaceExportResponse:
    export = MarketplaceExport(
        id=str(uuid4()),
        company_id=current_user.company_id,
        requested_by_user_id=current_user.id,
        marketplace=payload.marketplace.strip(),
        export_format=payload.export_format,
        status='queued',
        filters_json=_json_dumps(payload.filters),
    )
    db.add(export)

    log_audit(
        db,
        action='catalog.export.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'export_id': export.id, 'marketplace': export.marketplace},
    )
    db.commit()
    db.refresh(export)
    return _to_export_response(export)


@router.get('/exports', response_model=MarketplaceExportListResponse)
def list_exports(
    db: DbSession,
    current_user: ReadUser,
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> MarketplaceExportListResponse:
    query = db.query(MarketplaceExport).filter(MarketplaceExport.company_id == current_user.company_id)
    total = query.count()
    rows = query.order_by(MarketplaceExport.created_at.desc()).offset(offset).limit(limit).all()
    return MarketplaceExportListResponse(items=[_to_export_response(row) for row in rows], total=total)


@router.post('/jobs', response_model=ProcessingJobResponse, status_code=status.HTTP_201_CREATED)
def create_processing_job(
    payload: ProcessingJobCreateRequest,
    db: DbSession,
    current_user: WriteUser,
    background_tasks: BackgroundTasks,
) -> ProcessingJobResponse:
    if payload.product_id is not None:
        _get_company_product_or_404(db, current_user.company_id, payload.product_id)

    job = ProcessingJob(
        id=str(uuid4()),
        company_id=current_user.company_id,
        product_id=payload.product_id,
        job_type=payload.job_type,
        status='queued',
        input_ref=payload.input_ref,
        payload_json=_json_dumps(payload.payload),
        created_by_user_id=current_user.id,
    )
    db.add(job)

    log_audit(
        db,
        action='catalog.job.create',
        user_id=current_user.id,
        company_id=current_user.company_id,
        metadata={'job_id': job.id, 'job_type': job.job_type},
    )
    db.commit()
    db.refresh(job)
    db.refresh(job)

    if job.job_type == 'image_analysis':
        background_tasks.add_task(process_image_analysis_job, job.id)
    elif job.job_type == 'techpack_ocr':
        background_tasks.add_task(process_techpack_ocr_job, job.id)

    return _to_job_response(job)


@router.get('/jobs', response_model=ProcessingJobListResponse)
def list_processing_jobs(
    db: DbSession,
    current_user: ReadUser,
    status_filter: JobStatus | None = Query(default=None, alias='status'),
    job_type: JobType | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ProcessingJobListResponse:
    query = db.query(ProcessingJob).filter(ProcessingJob.company_id == current_user.company_id)
    if status_filter:
        query = query.filter(ProcessingJob.status == status_filter)
    if job_type:
        query = query.filter(ProcessingJob.job_type == job_type)

    total = query.count()
    rows = query.order_by(ProcessingJob.created_at.desc()).offset(offset).limit(limit).all()
    return ProcessingJobListResponse(items=[_to_job_response(row) for row in rows], total=total)


@router.get('/jobs/{job_id}', response_model=ProcessingJobResponse)
def get_processing_job(
    job_id: str,
    db: DbSession,
    current_user: ReadUser,
) -> ProcessingJobResponse:
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id, ProcessingJob.company_id == current_user.company_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found.')
    return _to_job_response(job)
