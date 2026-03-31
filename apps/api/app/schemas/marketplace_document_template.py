from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

MarketplaceDocumentType = Literal['catalog', 'po_builder', 'packing_list', 'barcode']
MarketplaceTemplateKind = Literal['tabular', 'workbook', 'pdf_layout', 'sticker']
MarketplaceFileFormat = Literal['csv', 'xlsx', 'pdf', 'png', 'jpg', 'jpeg', 'webp']


class MarketplaceTemplateColumn(BaseModel):
    header: str = Field(min_length=1, max_length=255)
    source_field: str | None = Field(default=None, max_length=128)
    required: bool = False
    confidence: float | None = Field(default=None, ge=0, le=1)


class MarketplaceDocumentTemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    marketplace_key: str = Field(min_length=1, max_length=64)
    document_type: MarketplaceDocumentType = 'catalog'
    template_kind: MarketplaceTemplateKind = 'tabular'
    file_format: MarketplaceFileFormat = 'csv'
    sample_file_url: str | None = Field(default=None, max_length=512)
    sheet_name: str | None = Field(default=None, max_length=128)
    header_row_index: int = Field(default=1, ge=1, le=50)
    columns: list[MarketplaceTemplateColumn] = Field(default_factory=list)
    layout: dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False
    is_active: bool = True


class MarketplaceDocumentTemplateCreateRequest(MarketplaceDocumentTemplateBase):
    pass


class MarketplaceDocumentTemplateUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    marketplace_key: str | None = Field(default=None, min_length=1, max_length=64)
    document_type: MarketplaceDocumentType | None = None
    template_kind: MarketplaceTemplateKind | None = None
    file_format: MarketplaceFileFormat | None = None
    sample_file_url: str | None = Field(default=None, max_length=512)
    sheet_name: str | None = Field(default=None, max_length=128)
    header_row_index: int | None = Field(default=None, ge=1, le=50)
    columns: list[MarketplaceTemplateColumn] | None = None
    layout: dict[str, Any] | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class MarketplaceDocumentTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    marketplace_key: str
    document_type: MarketplaceDocumentType
    template_kind: MarketplaceTemplateKind
    file_format: MarketplaceFileFormat
    sample_file_url: str | None
    sheet_name: str | None
    header_row_index: int
    columns: list[MarketplaceTemplateColumn]
    layout: dict[str, Any]
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MarketplaceDocumentTemplateListResponse(BaseModel):
    items: list[MarketplaceDocumentTemplateResponse]
    total: int


class MarketplaceDocumentTemplateParseResponse(BaseModel):
    document_type: MarketplaceDocumentType
    template_kind: MarketplaceTemplateKind
    file_format: MarketplaceFileFormat
    sample_file_url: str
    sheet_name: str | None
    header_row_index: int
    detected_headers: list[str]
    columns: list[MarketplaceTemplateColumn]
    layout: dict[str, Any]
