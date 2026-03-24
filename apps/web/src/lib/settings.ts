import { apiRequest } from "@/src/lib/api-client";

export interface BrandProfile {
  company_id: string;
  supplier_name: string;
  address: string;
  gst_number: string;
  pan_number: string;
  bill_to_address: string;
  ship_to_address: string;
  invoice_prefix: string;
  default_igst_rate: number;
}

export interface BrandProfileInput {
  supplier_name: string;
  address: string;
  gst_number: string;
  pan_number: string;
  bill_to_address: string;
  ship_to_address: string;
  invoice_prefix: string;
  default_igst_rate: number;
}

export interface POBuilderDefaults {
  company_id: string;
  default_po_price: number;
  default_osp_in_sar: number;
  default_fabric_composition: string;
  default_size_ratio: Record<string, number>;
}

export interface POBuilderDefaultsInput {
  default_po_price: number;
  default_osp_in_sar: number;
  default_fabric_composition: string;
  default_size_ratio: Record<string, number>;
}

export interface CartonCapacityRule {
  id: string;
  company_id: string;
  category: string;
  pieces_per_carton: number;
  is_default: boolean;
}

interface CartonRuleListResponse {
  items: CartonCapacityRule[];
  total: number;
}

export interface CartonCapacityRuleInput {
  category: string;
  pieces_per_carton: number;
  is_default: boolean;
}

export async function getBrandProfile(): Promise<BrandProfile> {
  return apiRequest<BrandProfile>("/settings/brand");
}

export async function updateBrandProfile(payload: BrandProfileInput): Promise<BrandProfile> {
  return apiRequest<BrandProfile>("/settings/brand", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getPOBuilderDefaults(): Promise<POBuilderDefaults> {
  return apiRequest<POBuilderDefaults>("/settings/po-builder");
}

export async function updatePOBuilderDefaults(
  payload: POBuilderDefaultsInput,
): Promise<POBuilderDefaults> {
  return apiRequest<POBuilderDefaults>("/settings/po-builder", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listCartonRules(): Promise<CartonCapacityRule[]> {
  const response = await apiRequest<CartonRuleListResponse>("/settings/carton-rules");
  return response.items;
}

export async function createCartonRule(
  payload: CartonCapacityRuleInput,
): Promise<CartonCapacityRule> {
  return apiRequest<CartonCapacityRule>("/settings/carton-rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCartonRule(
  ruleId: string,
  payload: Partial<CartonCapacityRuleInput>,
): Promise<CartonCapacityRule> {
  return apiRequest<CartonCapacityRule>(`/settings/carton-rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCartonRule(ruleId: string): Promise<void> {
  return apiRequest<void>(`/settings/carton-rules/${ruleId}`, {
    method: "DELETE",
  });
}
