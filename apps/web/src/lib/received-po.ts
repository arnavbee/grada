import { apiRequest } from "@/src/lib/api-client";
import { getResolvedApiOriginUrl } from "@/src/lib/api-url";
import type { StickerTemplateKind } from "@/src/lib/sticker-templates";

export type ReceivedPOStatus = "uploaded" | "parsing" | "parsed" | "confirmed" | "failed";
export type BarcodeJobStatus = "pending" | "generating" | "done" | "failed";
export type InvoiceStatus = "draft" | "final";
export type PackingListStatus = "draft" | "final";

export interface ReceivedPOLineItem {
  id: string;
  received_po_id: string;
  brand_style_code: string;
  styli_style_id: string | null;
  model_number: string | null;
  option_id: string | null;
  sku_id: string;
  color: string | null;
  size: string | null;
  quantity: number;
  po_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReceivedPO {
  id: string;
  company_id: string;
  file_url: string;
  po_number: string | null;
  po_date: string | null;
  distributor: string;
  status: ReceivedPOStatus;
  raw_extracted: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  items: ReceivedPOLineItem[];
}

export interface ReceivedPOListItem {
  id: string;
  po_number: string | null;
  po_date: string | null;
  distributor: string;
  status: ReceivedPOStatus;
  line_item_count: number;
  created_at: string;
}

interface ReceivedPOListResponse {
  items: ReceivedPOListItem[];
  total: number;
}

export interface BarcodeJob {
  id: string;
  received_po_id: string;
  status: BarcodeJobStatus;
  template_kind: StickerTemplateKind;
  template_id: string | null;
  file_url: string | null;
  total_stickers: number;
  total_pages: number;
  created_at: string;
}

interface BarcodeJobCreateResponse {
  job_id: string;
  status: BarcodeJobStatus;
}

export interface Invoice {
  id: string;
  received_po_id: string;
  company_id: string;
  invoice_number: string;
  invoice_date: string;
  gross_weight: number | null;
  subtotal: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  file_url: string | null;
  created_at: string;
}

interface InvoiceGeneratePdfResponse {
  invoice_id: string;
  status: InvoiceStatus;
  file_url: string | null;
}

export interface PackingListCartonItem {
  id: string;
  carton_id: string;
  line_item_id: string;
  pieces_in_carton: number;
  created_at: string;
}

export interface PackingListCarton {
  id: string;
  packing_list_id: string;
  carton_number: number;
  gross_weight: number | null;
  net_weight: number | null;
  dimensions: string | null;
  total_pieces: number;
  created_at: string;
  updated_at: string;
  items: PackingListCartonItem[];
}

export interface PackingList {
  id: string;
  received_po_id: string;
  company_id: string;
  status: PackingListStatus;
  file_url: string | null;
  created_at: string;
  cartons: PackingListCarton[];
}

export interface PackingListCreateResponse {
  packing_list_id: string;
  total_cartons: number;
  total_pieces: number;
}

interface PackingListGeneratePdfResponse {
  packing_list_id: string;
  status: PackingListStatus;
  file_url: string | null;
}

interface ReceivedPOUploadResponse {
  received_po_id: string;
  status: ReceivedPOStatus;
}

interface ReceivedPOConfirmResponse {
  id: string;
  status: ReceivedPOStatus;
}

export interface ReceivedPOHeaderInput {
  po_number?: string | null;
  po_date?: string | null;
  distributor?: string | null;
}

export interface ReceivedPOLineItemInput {
  id: string;
  brand_style_code: string;
  styli_style_id: string | null;
  model_number: string | null;
  option_id: string | null;
  sku_id: string;
  color: string | null;
  size: string | null;
  quantity: number;
  po_price: number | null;
}

export interface PackingListCartonInput {
  gross_weight?: number | null;
  net_weight?: number | null;
  dimensions?: string | null;
}

export async function listReceivedPOs(limit = 50, offset = 0): Promise<ReceivedPOListResponse> {
  return apiRequest<ReceivedPOListResponse>(`/received-pos?limit=${limit}&offset=${offset}`);
}

export async function uploadReceivedPO(file: File): Promise<ReceivedPOUploadResponse> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ReceivedPOUploadResponse>("/received-pos/upload", {
    method: "POST",
    body,
  });
}

export async function getReceivedPO(receivedPoId: string): Promise<ReceivedPO> {
  return apiRequest<ReceivedPO>(`/received-pos/${receivedPoId}`);
}

export async function updateReceivedPOHeader(
  receivedPoId: string,
  payload: ReceivedPOHeaderInput,
): Promise<ReceivedPO> {
  const nextPayload: Record<string, unknown> = { ...payload };
  if (typeof payload.po_date === "string" && payload.po_date) {
    nextPayload.po_date = new Date(payload.po_date).toISOString();
  }
  return apiRequest<ReceivedPO>(`/received-pos/${receivedPoId}`, {
    method: "PATCH",
    body: JSON.stringify(nextPayload),
  });
}

export async function updateReceivedPOItems(
  receivedPoId: string,
  items: ReceivedPOLineItemInput[],
): Promise<ReceivedPO> {
  return apiRequest<ReceivedPO>(`/received-pos/${receivedPoId}/items`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

export async function confirmReceivedPO(receivedPoId: string): Promise<ReceivedPOConfirmResponse> {
  return apiRequest<ReceivedPOConfirmResponse>(`/received-pos/${receivedPoId}/confirm`, {
    method: "POST",
  });
}

export async function createBarcodeJob(
  receivedPoId: string,
  payload?: { template_kind?: StickerTemplateKind; template_id?: string | null },
): Promise<BarcodeJobCreateResponse> {
  return apiRequest<BarcodeJobCreateResponse>(`/received-pos/${receivedPoId}/barcode`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export async function getBarcodeJobStatus(receivedPoId: string): Promise<BarcodeJob> {
  return apiRequest<BarcodeJob>(`/received-pos/${receivedPoId}/barcode/status`);
}

export async function getInvoice(receivedPoId: string): Promise<Invoice> {
  return apiRequest<Invoice>(`/received-pos/${receivedPoId}/invoice`);
}

export async function createInvoiceDraft(receivedPoId: string): Promise<Invoice> {
  return apiRequest<Invoice>(`/received-pos/${receivedPoId}/invoice`, {
    method: "POST",
  });
}

export async function updateInvoice(
  receivedPoId: string,
  payload: { gross_weight: number | null },
): Promise<Invoice> {
  return apiRequest<Invoice>(`/received-pos/${receivedPoId}/invoice`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function generateInvoicePdf(
  receivedPoId: string,
): Promise<InvoiceGeneratePdfResponse> {
  return apiRequest<InvoiceGeneratePdfResponse>(
    `/received-pos/${receivedPoId}/invoice/generate-pdf`,
    {
      method: "POST",
    },
  );
}

export async function getPackingList(receivedPoId: string): Promise<PackingList> {
  return apiRequest<PackingList>(`/received-pos/${receivedPoId}/packing-list`);
}

export async function createPackingList(receivedPoId: string): Promise<PackingListCreateResponse> {
  return apiRequest<PackingListCreateResponse>(`/received-pos/${receivedPoId}/packing-list`, {
    method: "POST",
  });
}

export async function updatePackingListCarton(
  receivedPoId: string,
  cartonId: string,
  payload: PackingListCartonInput,
): Promise<PackingListCarton> {
  return apiRequest<PackingListCarton>(
    `/received-pos/${receivedPoId}/packing-list/cartons/${cartonId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function generatePackingListPdf(
  receivedPoId: string,
): Promise<PackingListGeneratePdfResponse> {
  return apiRequest<PackingListGeneratePdfResponse>(
    `/received-pos/${receivedPoId}/packing-list/generate-pdf`,
    {
      method: "POST",
    },
  );
}

export function resolveFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) {
    return null;
  }
  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }
  return `${getResolvedApiOriginUrl()}${fileUrl}`;
}

export async function getOptionalInvoice(receivedPoId: string): Promise<Invoice | null> {
  try {
    return await getInvoice(receivedPoId);
  } catch (error) {
    if (error instanceof Error && error.message === "Invoice not found.") {
      return null;
    }
    throw error;
  }
}

export async function getOptionalPackingList(receivedPoId: string): Promise<PackingList | null> {
  try {
    return await getPackingList(receivedPoId);
  } catch (error) {
    if (error instanceof Error && error.message === "Packing list not found.") {
      return null;
    }
    throw error;
  }
}

export async function getOptionalBarcodeJob(receivedPoId: string): Promise<BarcodeJob | null> {
  try {
    return await getBarcodeJobStatus(receivedPoId);
  } catch (error) {
    if (error instanceof Error && error.message === "Barcode job not found.") {
      return null;
    }
    throw error;
  }
}
