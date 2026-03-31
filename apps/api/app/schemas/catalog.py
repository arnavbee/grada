from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ProductStatus = Literal['draft', 'processing', 'needs_review', 'ready', 'archived']
ExportFormat = Literal['csv', 'xlsx']
ExportStatus = Literal['queued', 'processing', 'completed', 'failed']
JobType = Literal['image_analysis', 'techpack_ocr', 'measurement_validation', 'marketplace_export']
JobStatus = Literal['queued', 'processing', 'running', 'completed', 'failed']
FeedbackType = Literal['accept', 'reject']


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
    marketplace: str | None = Field(default=None, min_length=2, max_length=64)
    template_id: str | None = Field(default=None, max_length=36)
    export_format: ExportFormat = 'csv'
    filters: dict[str, Any] | None = None


class MarketplaceExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    requested_by_user_id: str | None
    marketplace: str
    template_id: str | None = None
    template_name: str | None = None
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


class AnalyzeImageRequest(BaseModel):
    image_url: str = Field(min_length=1)
    template_allowed: dict[str, list[str]] | None = None


class AnalyzeImageFieldResponse(BaseModel):
    value: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=100)
    source: str | None = None
    based_on: str | None = None
    learned_from: str | None = None


class AnalyzeImageResponse(BaseModel):
    category: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    style_name: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    color: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    fabric: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    composition: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    woven_knits: AnalyzeImageFieldResponse = Field(default_factory=AnalyzeImageFieldResponse)
    image_hash: str | None = Field(default=None, min_length=64, max_length=64)


class GenerateStyleCodeRequest(BaseModel):
    brand: str | None = None
    category: str | None = None
    pattern: str | None = Field(default=None, max_length=128)


class GenerateStyleCodeResponse(BaseModel):
    style_code: str


class LogCorrectionRequest(BaseModel):
    product_id: str | None = None
    image_hash: str | None = Field(default=None, min_length=64, max_length=64)
    field_name: str = Field(min_length=1, max_length=64)
    feedback_type: FeedbackType
    suggested_value: str | None = Field(default=None, max_length=255)
    corrected_value: str | None = Field(default=None, max_length=255)
    reason_code: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=500)
    source: str | None = Field(default=None, max_length=64)
    based_on: str | None = Field(default=None, max_length=500)
    learned_from: str | None = Field(default=None, max_length=500)
    confidence_score: float | None = Field(default=None, ge=0, le=100)


class AICorrectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    product_id: str | None
    image_hash: str | None
    field_name: str
    feedback_type: FeedbackType
    suggested_value: str | None
    corrected_value: str | None
    reason_code: str | None
    notes: str | None
    source: str | None
    based_on: str | None
    learned_from: str | None
    confidence_score: float | None
    retraining_status: str
    retraining_notes: str | None
    created_by_user_id: str | None
    created_at: datetime
    processed_at: datetime | None


class ImageLabelCreateRequest(BaseModel):
    image_url: str = Field(min_length=1, max_length=4096)
    ai_category: str | None = Field(default=None, max_length=128)
    ai_style: str | None = Field(default=None, max_length=255)
    human_category: str | None = Field(default=None, max_length=128)
    human_style: str | None = Field(default=None, max_length=255)
    corrected: bool = False


class ImageLabelUpdateRequest(BaseModel):
    human_category: str | None = Field(default=None, max_length=128)
    human_style: str | None = Field(default=None, max_length=255)
    corrected: bool | None = None


class ImageLabelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    image_url: str
    ai_category: str | None
    ai_style: str | None
    human_category: str | None
    human_style: str | None
    corrected: bool
    created_at: datetime


class ImageLabelListResponse(BaseModel):
    items: list[ImageLabelResponse]
    total: int


class LearningFieldAccuracy(BaseModel):
    field_name: str
    accepted_count: int
    rejected_count: int
    total_feedback: int
    accuracy_percent: float


class LearningStatsResponse(BaseModel):
    items_processed: int
    corrections_received: int
    time_saved_minutes: int
    pending_retraining: int
    field_accuracy: list[LearningFieldAccuracy]
    insights: list[str]


class CatalogTemplateBase(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    description: str | None = Field(default=None, max_length=500)
    defaults: dict[str, Any] | None = None
    allowed_categories: list[str] = Field(default_factory=list)
    allowed_style_names: list[str] = Field(default_factory=list)
    allowed_colors: list[str] = Field(default_factory=list)
    allowed_fabrics: list[str] = Field(default_factory=list)
    allowed_compositions: list[str] = Field(default_factory=list)
    allowed_woven_knits: list[str] = Field(default_factory=list)
    style_code_pattern: str | None = Field(default=None, max_length=128)
    is_active: bool = True


class CatalogTemplateCreateRequest(CatalogTemplateBase):
    pass


class CatalogTemplateUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=128)
    description: str | None = Field(default=None, max_length=500)
    defaults: dict[str, Any] | None = None
    allowed_categories: list[str] | None = None
    allowed_style_names: list[str] | None = None
    allowed_colors: list[str] | None = None
    allowed_fabrics: list[str] | None = None
    allowed_compositions: list[str] | None = None
    allowed_woven_knits: list[str] | None = None
    style_code_pattern: str | None = Field(default=None, max_length=128)
    is_active: bool | None = None


class CatalogTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    description: str | None
    defaults: dict[str, Any]
    allowed_categories: list[str]
    allowed_style_names: list[str]
    allowed_colors: list[str]
    allowed_fabrics: list[str]
    allowed_compositions: list[str]
    allowed_woven_knits: list[str]
    style_code_pattern: str | None
    is_active: bool
    created_by_user_id: str | None
    created_at: datetime
    updated_at: datetime


class CatalogTemplateListResponse(BaseModel):
    items: list[CatalogTemplateResponse]
    total: int
