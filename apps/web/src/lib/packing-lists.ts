import { apiRequest } from "@/src/lib/api-client";
import { resolveFileUrl, type PackingListStatus } from "@/src/lib/received-po";

export interface PackingListListItem {
  id: string;
  received_po_id: string;
  po_number: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  carton_count: number;
  total_pieces: number;
  status: PackingListStatus;
  file_url: string | null;
  created_at: string;
}

interface PackingListListResponse {
  items: PackingListListItem[];
  total: number;
}

export async function listPackingLists(limit = 50, offset = 0): Promise<PackingListListResponse> {
  return apiRequest<PackingListListResponse>(`/packing-lists?limit=${limit}&offset=${offset}`);
}

export { resolveFileUrl };
