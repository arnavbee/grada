from pydantic import BaseModel, ConfigDict, Field


class BrandProfileSettings(BaseModel):
    supplier_name: str = Field(min_length=2, max_length=255)
    address: str = Field(min_length=5, max_length=1000)
    gst_number: str = Field(min_length=5, max_length=32)
    pan_number: str = Field(min_length=5, max_length=32)
    bill_to_address: str = Field(min_length=5, max_length=1000)
    ship_to_address: str = Field(min_length=5, max_length=1000)
    invoice_prefix: str = Field(default='INV', min_length=1, max_length=24)
    default_igst_rate: float = Field(default=5, ge=0, le=100)


class BrandProfileResponse(BaseModel):
    company_id: str
    supplier_name: str = ''
    address: str = ''
    gst_number: str = ''
    pan_number: str = ''
    bill_to_address: str = ''
    ship_to_address: str = ''
    invoice_prefix: str = 'INV'
    default_igst_rate: float = 5


class POBuilderDefaultsSettings(BaseModel):
    default_po_price: float = Field(default=600, ge=0, le=1000000)
    default_osp_in_sar: float = Field(default=95, ge=0, le=1000000)
    default_fabric_composition: str = Field(default='100% Polyester', min_length=2, max_length=255)
    default_size_ratio: dict[str, int] = Field(
        default_factory=lambda: {'S': 4, 'M': 7, 'L': 7, 'XL': 4, 'XXL': 4}
    )


class POBuilderDefaultsResponse(BaseModel):
    company_id: str
    default_po_price: float = 600
    default_osp_in_sar: float = 95
    default_fabric_composition: str = '100% Polyester'
    default_size_ratio: dict[str, int] = Field(
        default_factory=lambda: {'S': 4, 'M': 7, 'L': 7, 'XL': 4, 'XXL': 4}
    )


class CartonCapacityRuleCreateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=128)
    pieces_per_carton: int = Field(ge=1, le=10000)
    is_default: bool = False


class CartonCapacityRuleUpdateRequest(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=128)
    pieces_per_carton: int | None = Field(default=None, ge=1, le=10000)
    is_default: bool | None = None


class CartonCapacityRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    category: str
    pieces_per_carton: int
    is_default: bool


class CartonCapacityRuleListResponse(BaseModel):
    items: list[CartonCapacityRuleResponse]
    total: int
