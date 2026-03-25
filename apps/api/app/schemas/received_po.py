from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.sticker_template import StickerTemplateKind

ReceivedPOStatus = Literal['uploaded', 'parsing', 'parsed', 'confirmed', 'failed']
BarcodeJobStatus = Literal['pending', 'generating', 'done', 'failed']


class ReceivedPOLineItemBase(BaseModel):
    brand_style_code: str = Field(min_length=1, max_length=128)
    styli_style_id: str | None = Field(default=None, max_length=128)
    model_number: str | None = Field(default=None, max_length=128)
    option_id: str | None = Field(default=None, max_length=128)
    sku_id: str = Field(min_length=1, max_length=160)
    color: str | None = Field(default=None, max_length=128)
    knitted_woven: str | None = Field(default=None, max_length=64)
    size: str | None = Field(default=None, max_length=32)
    quantity: int = Field(ge=0)
    po_price: float | None = Field(default=None, ge=0)


class ReceivedPOLineItemUpdate(ReceivedPOLineItemBase):
    id: str


class ReceivedPOLineItemBatchUpdate(BaseModel):
    items: list[ReceivedPOLineItemUpdate] = Field(min_length=1)


class ReceivedPOLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    received_po_id: str
    brand_style_code: str
    styli_style_id: str | None
    model_number: str | None
    option_id: str | None
    sku_id: str
    color: str | None
    knitted_woven: str | None
    size: str | None
    quantity: int
    po_price: float | None
    created_at: datetime
    updated_at: datetime


class ReceivedPOHeaderUpdate(BaseModel):
    po_number: str | None = Field(default=None, max_length=128)
    po_date: datetime | None = None
    distributor: str | None = Field(default=None, max_length=128)


class ReceivedPOUploadResponse(BaseModel):
    received_po_id: str
    status: ReceivedPOStatus


class ReceivedPOConfirmResponse(BaseModel):
    id: str
    status: ReceivedPOStatus


class BarcodeJobCreateResponse(BaseModel):
    job_id: str
    status: BarcodeJobStatus


class BarcodeJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    received_po_id: str
    status: BarcodeJobStatus
    template_kind: StickerTemplateKind
    template_id: str | None
    file_url: str | None
    total_stickers: int
    total_pages: int
    created_at: datetime


class BarcodeJobListItemResponse(BaseModel):
    id: str
    received_po_id: str
    po_number: str | None
    template_kind: StickerTemplateKind
    template_id: str | None
    status: BarcodeJobStatus
    total_stickers: int
    total_pages: int
    file_url: str | None
    created_at: datetime


class BarcodeJobListResponse(BaseModel):
    items: list[BarcodeJobListItemResponse]
    total: int


class ReceivedPOListItemResponse(BaseModel):
    id: str
    po_number: str | None
    po_date: datetime | None
    distributor: str
    status: ReceivedPOStatus
    line_item_count: int
    created_at: datetime


class ReceivedPOListResponse(BaseModel):
    items: list[ReceivedPOListItemResponse]
    total: int


class ReceivedPOResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    company_id: str
    file_url: str
    po_number: str | None
    po_date: datetime | None
    distributor: str
    status: ReceivedPOStatus
    raw_extracted: dict[str, Any] = Field(validation_alias='raw_extracted_json')
    created_at: datetime
    updated_at: datetime
    items: list[ReceivedPOLineItemResponse] = Field(default_factory=list)
