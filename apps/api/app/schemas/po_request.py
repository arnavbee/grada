from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

PORequestStatus = Literal['draft', 'analyzing', 'ready', 'generated']


class PORequestItemUpdate(BaseModel):
    id: str
    po_price: float | None = None
    osp_inside_price: float | None = None
    fabric_composition: str | None = None
    size_ratio: dict[str, int] | None = None
    extracted_attributes: dict[str, Any] | None = None


class PORequestItemCreate(BaseModel):
    product_id: str


class PORequestItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    po_request_id: str
    product_id: str
    po_price: float | None
    osp_inside_price: float | None
    fabric_composition: str | None
    size_ratio: dict[str, int]
    extracted_attributes: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class PORequestCreate(BaseModel):
    product_ids: list[str] = Field(min_length=1)


class PORequestUpdate(BaseModel):
    status: PORequestStatus | None = None


class PORequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    status: PORequestStatus
    created_by_user_id: str | None
    created_at: datetime
    updated_at: datetime
    items: list[PORequestItemResponse] = Field(default_factory=list)


class PORequestListResponse(BaseModel):
    items: list[PORequestResponse]
    total: int

class PORequestBatchUpdateItems(BaseModel):
    items: list[PORequestItemUpdate]
