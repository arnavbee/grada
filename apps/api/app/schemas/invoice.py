from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

InvoiceStatus = Literal['draft', 'final']


class InvoiceCreateResponse(BaseModel):
    invoice_id: str


class InvoiceGeneratePdfResponse(BaseModel):
    invoice_id: str
    status: InvoiceStatus
    file_url: str | None = None


class InvoiceUpdateRequest(BaseModel):
    gross_weight: float | None = Field(default=None, ge=0)


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    received_po_id: str
    company_id: str
    invoice_number: str
    invoice_date: datetime
    gross_weight: float | None
    subtotal: float
    igst_rate: float
    igst_amount: float
    total_amount: float
    status: InvoiceStatus
    file_url: str | None
    created_at: datetime
