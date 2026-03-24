from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PackingListStatus = Literal['draft', 'final']


class PackingListCartonItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    carton_id: str
    line_item_id: str
    pieces_in_carton: int
    created_at: datetime


class PackingListCartonUpdateRequest(BaseModel):
    gross_weight: float | None = Field(default=None, ge=0)
    net_weight: float | None = Field(default=None, ge=0)
    dimensions: str | None = Field(default=None, max_length=128)


class PackingListCartonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    packing_list_id: str
    carton_number: int
    gross_weight: float | None
    net_weight: float | None
    dimensions: str | None
    total_pieces: int
    created_at: datetime
    updated_at: datetime
    items: list[PackingListCartonItemResponse] = Field(default_factory=list)


class PackingListCreateResponse(BaseModel):
    packing_list_id: str
    total_cartons: int
    total_pieces: int


class PackingListGeneratePdfResponse(BaseModel):
    packing_list_id: str
    status: PackingListStatus
    file_url: str | None = None


class PackingListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    received_po_id: str
    company_id: str
    status: PackingListStatus
    file_url: str | None
    created_at: datetime
    cartons: list[PackingListCartonResponse] = Field(default_factory=list)
