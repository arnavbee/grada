import { apiRequest } from "@/src/lib/api-client";

export type MarketplaceDocumentType = "catalog" | "po_builder" | "packing_list" | "barcode";
export type MarketplaceTemplateKind = "tabular" | "workbook" | "pdf_layout" | "sticker";
export type MarketplaceFileFormat = "csv" | "xlsx" | "pdf" | "png" | "jpg" | "jpeg" | "webp";

export interface MarketplaceTemplateColumn {
  header: string;
  source_field: string | null;
  required: boolean;
  confidence?: number | null;
}

export interface MarketplaceDocumentTemplate {
  id: string;
  company_id: string;
  name: string;
  marketplace_key: string;
  document_type: MarketplaceDocumentType;
  template_kind: MarketplaceTemplateKind;
  file_format: MarketplaceFileFormat;
  sample_file_url: string | null;
  sheet_name: string | null;
  header_row_index: number;
  columns: MarketplaceTemplateColumn[];
  layout: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceDocumentTemplateListResponse {
  items: MarketplaceDocumentTemplate[];
  total: number;
}

export interface MarketplaceDocumentTemplateParseResponse {
  document_type: MarketplaceDocumentType;
  template_kind: MarketplaceTemplateKind;
  file_format: MarketplaceFileFormat;
  sample_file_url: string;
  sheet_name: string | null;
  header_row_index: number;
  detected_headers: string[];
  columns: MarketplaceTemplateColumn[];
  layout: Record<string, unknown>;
}

export interface MarketplaceDocumentTemplateInput {
  name: string;
  marketplace_key: string;
  document_type: MarketplaceDocumentType;
  template_kind: MarketplaceTemplateKind;
  file_format: MarketplaceFileFormat;
  sample_file_url?: string | null;
  sheet_name?: string | null;
  header_row_index: number;
  columns: MarketplaceTemplateColumn[];
  layout: Record<string, unknown>;
  is_default?: boolean;
  is_active?: boolean;
}

export async function listMarketplaceDocumentTemplates(
  documentType?: MarketplaceDocumentType,
): Promise<MarketplaceDocumentTemplate[]> {
  const query = documentType ? `?document_type=${documentType}` : "";
  const response = await apiRequest<MarketplaceDocumentTemplateListResponse>(
    `/marketplace-templates${query}`,
  );
  return response.items;
}

export async function parseMarketplaceTemplateSample(
  file: File,
  documentType: MarketplaceDocumentType,
): Promise<MarketplaceDocumentTemplateParseResponse> {
  const body = new FormData();
  body.append("file", file);
  body.append("document_type", documentType);
  return apiRequest<MarketplaceDocumentTemplateParseResponse>(
    "/marketplace-templates/parse-sample",
    {
      method: "POST",
      body,
    },
  );
}

export async function createMarketplaceDocumentTemplate(
  payload: MarketplaceDocumentTemplateInput,
): Promise<MarketplaceDocumentTemplate> {
  return apiRequest<MarketplaceDocumentTemplate>("/marketplace-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMarketplaceDocumentTemplate(templateId: string): Promise<void> {
  return apiRequest<void>(`/marketplace-templates/${templateId}`, {
    method: "DELETE",
  });
}
