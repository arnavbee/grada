from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.invoice import InvoiceDetails

BuyerDocumentType = Literal['invoice']
InvoiceLayoutKey = Literal['default_v1', 'landmark_v1']


class BuyerDocumentTemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    buyer_key: str = Field(min_length=1, max_length=255)
    document_type: BuyerDocumentType = 'invoice'
    layout_key: InvoiceLayoutKey = 'default_v1'
    defaults: InvoiceDetails = Field(default_factory=InvoiceDetails)
    is_default: bool = False
    is_active: bool = True


class BuyerDocumentTemplateCreateRequest(BuyerDocumentTemplateBase):
    pass


class BuyerDocumentTemplateUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    buyer_key: str | None = Field(default=None, min_length=1, max_length=255)
    document_type: BuyerDocumentType | None = None
    layout_key: InvoiceLayoutKey | None = None
    defaults: InvoiceDetails | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class BuyerDocumentTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    buyer_key: str
    document_type: BuyerDocumentType
    layout_key: InvoiceLayoutKey
    defaults: InvoiceDetails
    is_default: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BuyerDocumentTemplateListResponse(BaseModel):
    items: list[BuyerDocumentTemplateResponse]
    total: int


class BuyerDocumentTemplateParseResponse(BaseModel):
    document_type: BuyerDocumentType = 'invoice'
    file_format: Literal['pdf'] = 'pdf'
    sample_file_url: str
    layout_key: InvoiceLayoutKey = 'default_v1'
    detected_headers: list[str] = Field(default_factory=list)
    defaults: InvoiceDetails = Field(default_factory=InvoiceDetails)
