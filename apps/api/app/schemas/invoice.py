from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

InvoiceStatus = Literal['draft', 'final']
ExportMode = Literal['Air', 'Sea', 'Road']


class InvoiceCreateResponse(BaseModel):
    invoice_id: str


class InvoiceGeneratePdfResponse(BaseModel):
    invoice_id: str
    status: InvoiceStatus
    file_url: str | None = None


class InvoiceDetails(BaseModel):
    marketplace_name: str = ''
    supplier_name: str = ''
    address: str = ''
    gst_number: str = ''
    pan_number: str = ''
    fbs_name: str = ''
    vendor_company_name: str = ''
    supplier_city: str = ''
    supplier_state: str = ''
    supplier_pincode: str = ''
    delivery_from_name: str = ''
    delivery_from_address: str = ''
    delivery_from_city: str = ''
    delivery_from_pincode: str = ''
    origin_country: str = ''
    origin_state: str = ''
    origin_district: str = ''
    bill_to_name: str = ''
    bill_to_address: str = ''
    bill_to_gst: str = ''
    bill_to_pan: str = ''
    ship_to_name: str = ''
    ship_to_address: str = ''
    ship_to_gst: str = ''
    stamp_image_url: str = ''


class InvoiceCreateRequest(BaseModel):
    number_of_cartons: int = Field(default=0, ge=0, le=100000)
    export_mode: ExportMode = 'Air'
    details: InvoiceDetails | None = None


class InvoiceUpdateRequest(BaseModel):
    gross_weight: float | None = Field(default=None, ge=0)
    number_of_cartons: int | None = Field(default=None, ge=0, le=100000)
    export_mode: ExportMode | None = None
    details: InvoiceDetails | None = None


class InvoiceLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    invoice_id: str
    vendor_style_hash: str
    neom_sku_id: str
    neom_po_code: str
    product_description: str
    hsn_code: str
    model_number: str
    fabric_composition: str
    knitted_woven: str
    neom_size: str
    country_of_origin: str
    state_of_origin: str
    district_of_origin: str
    quantity: int
    unit_price: float
    net_taxable_amount: float
    gst_rate: float
    igst_amount: float
    cgst_amount: float
    sgst_amount: float
    total_gst_amount: float
    total_amount: float
    sort_order: int
    created_at: datetime
    updated_at: datetime


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    received_po_id: str
    company_id: str
    invoice_number: str
    invoice_date: datetime
    number_of_cartons: int
    export_mode: ExportMode
    gross_weight: float | None
    total_quantity: int
    subtotal: float
    igst_rate: float
    igst_amount: float
    total_amount: float
    total_amount_words: str | None
    status: InvoiceStatus
    file_url: str | None
    created_at: datetime
    updated_at: datetime
    details: InvoiceDetails
    line_items: list[InvoiceLineItemResponse] = Field(default_factory=list)


class InvoiceListItemResponse(BaseModel):
    id: str
    received_po_id: str
    invoice_number: str
    invoice_date: datetime
    po_number: str | None
    number_of_cartons: int
    total_amount: float
    status: InvoiceStatus
    file_url: str | None
    created_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceListItemResponse]
    total: int
