from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ProductStatus = Literal['draft', 'processing', 'needs_review', 'ready', 'archived']
ExportFormat = Literal['csv', 'xlsx']
ExportStatus = Literal['queued', 'processing', 'completed', 'failed']
JobType = Literal['image_analysis', 'techpack_ocr', 'measurement_validation', 'marketplace_export']
JobStatus = Literal['queued', 'processing', 'running', 'completed', 'failed']


class ProductCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    sku: str | None = Field(default=None, max_length=96)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    color: str | None = Field(default=None, max_length=64)
    size: str | None = Field(default=None, max_length=64)
    status: ProductStatus = 'draft'
    confidence_score: float | None = Field(default=None, ge=0, le=100)
    ai_attributes: dict[str, Any] | None = None


class ProductUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    sku: str | None = Field(default=None, max_length=96)
    description: str | None = None
    brand: str | None = Field(default=None, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    color: str | None = Field(default=None, max_length=64)
    size: str | None = Field(default=None, max_length=64)
    status: ProductStatus | None = None
    confidence_score: float | None = Field(default=None, ge=0, le=100)
    ai_attributes: dict[str, Any] | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    sku: str
    title: str
    description: str | None
    brand: str | None
    category: str | None
    color: str | None
    size: str | None
    status: ProductStatus
    confidence_score: float | None
    ai_attributes: dict[str, Any]
    created_by_user_id: str | None
    created_at: datetime
    created_at: datetime
    updated_at: datetime
    primary_image_url: str | None = None


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int


class ProductImageCreateRequest(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_url: str = Field(min_length=3, max_length=512)
    mime_type: str | None = Field(default=None, max_length=128)
    file_size_bytes: int | None = Field(default=None, ge=1)
    width_px: int | None = Field(default=None, ge=1)
    height_px: int | None = Field(default=None, ge=1)
    processing_status: str = Field(default='uploaded', max_length=32)
    analysis: dict[str, Any] | None = None


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    file_name: str
    file_url: str
    mime_type: str | None
    file_size_bytes: int | None
    width_px: int | None
    height_px: int | None
    processing_status: str
    analysis: dict[str, Any]
    created_at: datetime


class ProductMeasurementCreateRequest(BaseModel):
    measurement_key: str = Field(min_length=1, max_length=64)
    measurement_value: float = Field(ge=0)
    unit: str = Field(default='cm', max_length=16)
    source: str = Field(default='manual', max_length=32)
    confidence_score: float | None = Field(default=None, ge=0, le=100)
    needs_review: bool = False
    notes: str | None = Field(default=None, max_length=255)


class ProductMeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    measurement_key: str
    measurement_value: float
    unit: str
    source: str
    confidence_score: float | None
    needs_review: bool
    notes: str | None
    created_at: datetime


class MarketplaceExportCreateRequest(BaseModel):
    marketplace: str = Field(min_length=2, max_length=64)
    export_format: ExportFormat = 'csv'
    filters: dict[str, Any] | None = None


class MarketplaceExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    requested_by_user_id: str | None
    marketplace: str
    export_format: ExportFormat
    status: ExportStatus
    filters: dict[str, Any]
    file_url: str | None
    error_message: str | None
    row_count: int
    created_at: datetime
    completed_at: datetime | None


class MarketplaceExportListResponse(BaseModel):
    items: list[MarketplaceExportResponse]
    total: int


class ProcessingJobCreateRequest(BaseModel):
    job_type: JobType
    product_id: str | None = None
    input_ref: str | None = Field(default=None, max_length=512)
    payload: dict[str, Any] | None = None


class ProcessingJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    product_id: str | None
    job_type: JobType
    status: JobStatus
    input_ref: str | None
    payload: dict[str, Any]
    result: dict[str, Any]
    confidence_score: float | None
    progress_percent: int
    error_message: str | None
    created_by_user_id: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class ProcessingJobListResponse(BaseModel):
    items: list[ProcessingJobResponse]
    total: int
