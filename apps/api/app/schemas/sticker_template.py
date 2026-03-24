from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

StickerTemplateKind = Literal['styli', 'custom']
StickerElementType = Literal['text_static', 'text_dynamic', 'barcode', 'image', 'line']


class BarcodeLineItem(BaseModel):
    po_number: str = Field(min_length=1, max_length=128)
    model_number: str | None = Field(default=None, max_length=128)
    option_id: str | None = Field(default=None, max_length=128)
    size: str | None = Field(default=None, max_length=32)
    quantity: int = Field(default=0, ge=0)
    sku_id: str | None = Field(default=None, max_length=160)
    color: str | None = Field(default=None, max_length=128)
    brand_name: str | None = Field(default=None, max_length=160)


class BarcodeGenerateStyliSheetRequest(BaseModel):
    received_po_id: str = Field(min_length=1, max_length=64)
    line_items: list[BarcodeLineItem] = Field(min_length=1)


class BarcodeGenerateCustomSheetRequest(BaseModel):
    template_id: str = Field(min_length=1, max_length=64)
    received_po_id: str | None = Field(default=None, max_length=64)
    line_items: list[BarcodeLineItem] = Field(min_length=1)


class BarcodeGenerateResponse(BaseModel):
    file_url: str
    total_stickers: int
    total_pages: int


class CreateBarcodeJobRequest(BaseModel):
    template_kind: StickerTemplateKind = 'styli'
    template_id: str | None = Field(default=None, max_length=64)


class StickerElementBase(BaseModel):
    element_type: StickerElementType
    x_mm: float
    y_mm: float
    width_mm: float = Field(gt=0)
    height_mm: float = Field(gt=0)
    z_index: int = 0
    properties: dict[str, Any] = Field(default_factory=dict)


class StickerElementCreate(StickerElementBase):
    pass


class StickerElementUpdate(BaseModel):
    element_type: StickerElementType | None = None
    x_mm: float | None = None
    y_mm: float | None = None
    width_mm: float | None = Field(default=None, gt=0)
    height_mm: float | None = Field(default=None, gt=0)
    z_index: int | None = None
    properties: dict[str, Any] | None = None


class StickerElementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    template_id: str
    element_type: StickerElementType
    x_mm: float
    y_mm: float
    width_mm: float
    height_mm: float
    z_index: int
    properties: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class StickerTemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    width_mm: float = Field(gt=0)
    height_mm: float = Field(gt=0)
    border_color: str | None = Field(default=None, max_length=32)
    border_radius_mm: float = Field(default=2, ge=0)
    background_color: str = Field(default='#FFFFFF', max_length=32)
    is_default: bool = False


class StickerTemplateCreate(StickerTemplateBase):
    elements: list[StickerElementCreate] = Field(default_factory=list)


class StickerTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    width_mm: float | None = Field(default=None, gt=0)
    height_mm: float | None = Field(default=None, gt=0)
    border_color: str | None = Field(default=None, max_length=32)
    border_radius_mm: float | None = Field(default=None, ge=0)
    background_color: str | None = Field(default=None, max_length=32)
    is_default: bool | None = None
    elements: list[StickerElementCreate] | None = None


class StickerTemplateSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    width_mm: float
    height_mm: float
    border_color: str | None
    border_radius_mm: float
    background_color: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class StickerTemplateDetailResponse(StickerTemplateSummaryResponse):
    elements: list[StickerElementResponse] = Field(default_factory=list)


class StickerTemplateListResponse(BaseModel):
    items: list[StickerTemplateSummaryResponse]


class StickerTemplateReorderRequest(BaseModel):
    element_ids: list[str] = Field(min_length=1)
