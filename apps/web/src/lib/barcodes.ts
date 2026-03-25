import { apiRequest } from "@/src/lib/api-client";
import { resolveFileUrl, type BarcodeJobStatus } from "@/src/lib/received-po";
import type { StickerTemplateKind } from "@/src/lib/sticker-templates";

export interface BarcodeListItem {
  id: string;
  received_po_id: string;
  po_number: string | null;
  template_kind: StickerTemplateKind;
  template_id: string | null;
  status: BarcodeJobStatus;
  total_stickers: number;
  total_pages: number;
  file_url: string | null;
  created_at: string;
}

interface BarcodeListResponse {
  items: BarcodeListItem[];
  total: number;
}

export async function listBarcodes(limit = 50, offset = 0): Promise<BarcodeListResponse> {
  return apiRequest<BarcodeListResponse>(`/barcodes?limit=${limit}&offset=${offset}`);
}

export { resolveFileUrl };
