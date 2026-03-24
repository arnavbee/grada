from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.config.styli_attributes import DEFAULT_SIZE_RATIO

PORequestStatus = Literal['draft', 'analyzing', 'ready', 'generated', 'failed']
PORequestExportFormat = Literal['xlsx', 'csv']


class PORequestColorwayUpdate(BaseModel):
    id: str | None = None
    letter: str
    color_name: str


class PORequestColorwayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    po_request_item_id: str
    letter: str
    color_name: str
    created_at: datetime
    updated_at: datetime


class PORequestAttributeValue(BaseModel):
    value: str = ''
    confidence: float | None = None


class PORequestExtractedAttributes(BaseModel):
    fields: dict[str, PORequestAttributeValue] = Field(default_factory=dict)
    review_required: bool = False


class PORequestProductSnapshot(BaseModel):
    id: str
    sku: str
    title: str
    brand: str
    category: str
    color: str
    primary_image_url: str | None = None


class PORequestItemUpdate(BaseModel):
    id: str
    po_price: float | None = None
    osp_inside_price: float | None = None
    fabric_composition: str | None = None
    size_ratio: dict[str, int] | None = None
    extracted_attributes: dict[str, Any] | None = None
    colorways: list[PORequestColorwayUpdate] | None = None


class PORequestItemCreate(BaseModel):
    product_id: str


class PORequestItemResponse(BaseModel):
    id: str
    po_request_id: str
    product_id: str
    po_price: float | None
    osp_inside_price: float | None
    fabric_composition: str | None
    size_ratio: dict[str, int] = Field(default_factory=lambda: dict(DEFAULT_SIZE_RATIO))
    extracted_attributes: PORequestExtractedAttributes = Field(default_factory=PORequestExtractedAttributes)
    colorways: list[PORequestColorwayResponse] = Field(default_factory=list)
    product: PORequestProductSnapshot | None = None
    created_at: datetime
    updated_at: datetime


class PORequestRowResponse(BaseModel):
    id: str
    po_request_id: str
    po_request_item_id: str
    product_id: str
    row_index: int
    sku_id: str
    brand_name: str
    category_type: str
    styli_sku_id: str | None = None
    color: str
    size: str
    colorway_letter: str
    l1: str
    fibre_composition: str | None
    coo: str
    po_price: float | None
    osp_in_sar: float | None
    po_qty: int
    knitted_woven: str | None
    product_name: str | None
    dress_print: str | None
    dress_length: str | None
    dress_shape: str | None
    sleeve_length: str | None
    neck_women: str | None
    sleeve_styling: str | None
    created_at: datetime
    updated_at: datetime


class PORequestCreate(BaseModel):
    product_ids: list[str] = Field(min_length=1)


class PORequestUpdate(BaseModel):
    status: PORequestStatus | None = None


class PORequestResponse(BaseModel):
    id: str
    company_id: str
    status: PORequestStatus
    created_by_user_id: str | None
    created_at: datetime
    updated_at: datetime
    items: list[PORequestItemResponse] = Field(default_factory=list)
    rows: list[PORequestRowResponse] = Field(default_factory=list)


class PORequestListResponse(BaseModel):
    items: list[PORequestResponse]
    total: int


class PORequestBatchUpdateItems(BaseModel):
    items: list[PORequestItemUpdate]
