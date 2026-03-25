import { apiRequest } from "@/src/lib/api-client";
import { resolveFileUrl, type InvoiceStatus } from "@/src/lib/received-po";

export interface InvoiceListItem {
  id: string;
  received_po_id: string;
  invoice_number: string;
  invoice_date: string;
  po_number: string | null;
  number_of_cartons: number;
  total_amount: number;
  status: InvoiceStatus;
  file_url: string | null;
  created_at: string;
}

interface InvoiceListResponse {
  items: InvoiceListItem[];
  total: number;
}

export async function listInvoices(limit = 50, offset = 0): Promise<InvoiceListResponse> {
  return apiRequest<InvoiceListResponse>(`/invoices?limit=${limit}&offset=${offset}`);
}

export { resolveFileUrl };
