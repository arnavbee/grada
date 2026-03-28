// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReceivedPODocumentsView } from "@/src/components/dashboard/received-po-documents-view";
import { ReceivedPOReviewView } from "@/src/components/dashboard/received-po-review-view";
import { ReceivedPOUploadView } from "@/src/components/dashboard/received-po-upload-view";
import type {
  BarcodeJob,
  Invoice,
  InvoiceDetails,
  PackingList,
  ReceivedPO,
} from "@/src/lib/received-po";
import type { BrandProfile } from "@/src/lib/settings";

const {
  pushMock,
  uploadReceivedPOMock,
  getReceivedPOMock,
  confirmReceivedPOMock,
  updateReceivedPOHeaderMock,
  updateReceivedPOItemsMock,
  getOptionalBarcodeJobMock,
  getOptionalInvoiceMock,
  getOptionalPackingListMock,
  createBarcodeJobMock,
  createInvoiceDraftMock,
  updateInvoiceMock,
  generateInvoicePdfMock,
  createPackingListMock,
  updatePackingListCartonMock,
  generatePackingListPdfMock,
  resolveFileUrlMock,
  listStickerTemplatesMock,
  getStickerTemplateMock,
  updateStickerTemplateMock,
  uploadStickerImageMock,
  getBrandProfileMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  uploadReceivedPOMock: vi.fn(),
  getReceivedPOMock: vi.fn(),
  confirmReceivedPOMock: vi.fn(),
  updateReceivedPOHeaderMock: vi.fn(),
  updateReceivedPOItemsMock: vi.fn(),
  getOptionalBarcodeJobMock: vi.fn(),
  getOptionalInvoiceMock: vi.fn(),
  getOptionalPackingListMock: vi.fn(),
  createBarcodeJobMock: vi.fn(),
  createInvoiceDraftMock: vi.fn(),
  updateInvoiceMock: vi.fn(),
  generateInvoicePdfMock: vi.fn(),
  createPackingListMock: vi.fn(),
  updatePackingListCartonMock: vi.fn(),
  generatePackingListPdfMock: vi.fn(),
  resolveFileUrlMock: vi.fn((url: string | null | undefined) =>
    url ? `https://files.example.test${url}` : null,
  ),
  listStickerTemplatesMock: vi.fn(),
  getStickerTemplateMock: vi.fn(),
  updateStickerTemplateMock: vi.fn(),
  uploadStickerImageMock: vi.fn(),
  getBrandProfileMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/src/components/dashboard/dashboard-shell", () => ({
  DashboardShell: ({
    title,
    subtitle,
    children,
  }: {
    title?: string;
    subtitle?: string;
    children: ReactNode;
  }) => (
    <div data-testid="dashboard-shell">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/src/lib/received-po", async () => {
  const actual =
    await vi.importActual<typeof import("@/src/lib/received-po")>("@/src/lib/received-po");
  return {
    ...actual,
    uploadReceivedPO: uploadReceivedPOMock,
    getReceivedPO: getReceivedPOMock,
    confirmReceivedPO: confirmReceivedPOMock,
    updateReceivedPOHeader: updateReceivedPOHeaderMock,
    updateReceivedPOItems: updateReceivedPOItemsMock,
    getOptionalBarcodeJob: getOptionalBarcodeJobMock,
    getOptionalInvoice: getOptionalInvoiceMock,
    getOptionalPackingList: getOptionalPackingListMock,
    createBarcodeJob: createBarcodeJobMock,
    createInvoiceDraft: createInvoiceDraftMock,
    updateInvoice: updateInvoiceMock,
    generateInvoicePdf: generateInvoicePdfMock,
    createPackingList: createPackingListMock,
    updatePackingListCarton: updatePackingListCartonMock,
    generatePackingListPdf: generatePackingListPdfMock,
    resolveFileUrl: resolveFileUrlMock,
  };
});

vi.mock("@/src/lib/sticker-templates", async () => {
  const actual = await vi.importActual<typeof import("@/src/lib/sticker-templates")>(
    "@/src/lib/sticker-templates",
  );
  return {
    ...actual,
    listStickerTemplates: listStickerTemplatesMock,
    getStickerTemplate: getStickerTemplateMock,
    updateStickerTemplate: updateStickerTemplateMock,
    uploadStickerImage: uploadStickerImageMock,
  };
});

vi.mock("@/src/lib/settings", () => ({
  getBrandProfile: getBrandProfileMock,
}));

const DEFAULT_INVOICE_DETAILS: InvoiceDetails = {
  marketplace_name: "Styli",
  supplier_name: "Documents Co",
  address: "123 Export Lane, Gurugram",
  gst_number: "07ABCDE1234F1Z5",
  pan_number: "ABCDE1234F",
  fbs_name: "FBS-DOCUMENTS CO",
  vendor_company_name: "Documents Co",
  supplier_city: "Gurugram",
  supplier_state: "Haryana",
  supplier_pincode: "122004",
  delivery_from_name: "Documents Co Warehouse",
  delivery_from_address: "Warehouse 4, IMT Manesar",
  delivery_from_city: "Gurugram",
  delivery_from_pincode: "122004",
  origin_country: "India",
  origin_state: "Haryana",
  origin_district: "Gurugram",
  bill_to_name: "Documents Buyer",
  bill_to_address: "Sector 44, Gurugram",
  bill_to_gst: "06ABCDE1234F1Z5",
  bill_to_pan: "ABCDE1234F",
  ship_to_name: "Documents Buyer",
  ship_to_address: "Sector 44, Gurugram",
  ship_to_gst: "06ABCDE1234F1Z5",
  stamp_image_url: "",
};

function buildBrandProfile(): BrandProfile {
  return {
    company_id: "co_1",
    supplier_name: DEFAULT_INVOICE_DETAILS.supplier_name,
    address: DEFAULT_INVOICE_DETAILS.address,
    gst_number: DEFAULT_INVOICE_DETAILS.gst_number,
    pan_number: DEFAULT_INVOICE_DETAILS.pan_number,
    fbs_name: DEFAULT_INVOICE_DETAILS.fbs_name,
    vendor_company_name: DEFAULT_INVOICE_DETAILS.vendor_company_name,
    supplier_city: DEFAULT_INVOICE_DETAILS.supplier_city,
    supplier_state: DEFAULT_INVOICE_DETAILS.supplier_state,
    supplier_pincode: DEFAULT_INVOICE_DETAILS.supplier_pincode,
    delivery_from_name: DEFAULT_INVOICE_DETAILS.delivery_from_name,
    delivery_from_address: DEFAULT_INVOICE_DETAILS.delivery_from_address,
    delivery_from_city: DEFAULT_INVOICE_DETAILS.delivery_from_city,
    delivery_from_pincode: DEFAULT_INVOICE_DETAILS.delivery_from_pincode,
    origin_country: DEFAULT_INVOICE_DETAILS.origin_country,
    origin_state: DEFAULT_INVOICE_DETAILS.origin_state,
    origin_district: DEFAULT_INVOICE_DETAILS.origin_district,
    bill_to_name: DEFAULT_INVOICE_DETAILS.bill_to_name,
    bill_to_address: DEFAULT_INVOICE_DETAILS.bill_to_address,
    bill_to_gst: DEFAULT_INVOICE_DETAILS.bill_to_gst,
    bill_to_pan: DEFAULT_INVOICE_DETAILS.bill_to_pan,
    ship_to_name: DEFAULT_INVOICE_DETAILS.ship_to_name,
    ship_to_address: DEFAULT_INVOICE_DETAILS.ship_to_address,
    ship_to_gst: DEFAULT_INVOICE_DETAILS.ship_to_gst,
    stamp_image_url: DEFAULT_INVOICE_DETAILS.stamp_image_url,
    instagram_handle: "",
    website_url: "",
    facebook_handle: "",
    snapchat_handle: "",
    invoice_prefix: "INV",
    default_igst_rate: 5,
  };
}

function buildReceivedPO(status: ReceivedPO["status"]): ReceivedPO {
  return {
    id: "po_1",
    company_id: "co_1",
    file_url: "/static/uploads/received-pos/po_1.xlsx",
    po_number: "STY-2026-001",
    po_date: "2026-03-24T00:00:00+00:00",
    distributor: "Styli",
    status,
    raw_extracted: {},
    created_at: "2026-03-24T00:00:00+00:00",
    updated_at: "2026-03-24T00:00:00+00:00",
    items: [
      {
        id: "item_1",
        received_po_id: "po_1",
        brand_style_code: "HRDS25001",
        styli_style_id: "STY-1",
        model_number: "MOD-1",
        option_id: "OPT-BLK",
        sku_id: "HRDS25001-BLK-S",
        color: "Black",
        size: "S",
        quantity: 10,
        po_price: 499,
        created_at: "2026-03-24T00:00:00+00:00",
        updated_at: "2026-03-24T00:00:00+00:00",
      },
    ],
  };
}

function buildReceivedPOWithOverrides(
  status: ReceivedPO["status"],
  overrides: Partial<ReceivedPO["items"][number]>,
): ReceivedPO {
  const base = buildReceivedPO(status);
  return {
    ...base,
    items: base.items.map((item) => ({
      ...item,
      ...overrides,
    })),
  };
}

function buildInvoice(status: Invoice["status"], fileUrl: string | null = null): Invoice {
  return {
    id: "inv_1",
    received_po_id: "po_1",
    company_id: "co_1",
    invoice_number: "INV-2026-001",
    invoice_date: "2026-03-24T00:00:00+00:00",
    number_of_cartons: 9,
    export_mode: "Air",
    gross_weight: 12.5,
    total_quantity: 10,
    subtotal: 4990,
    igst_rate: 5,
    igst_amount: 249.5,
    total_amount: 5239.5,
    total_amount_words: "Five Thousand Two Hundred Thirty Nine and Fifty Paisa only",
    status,
    file_url: fileUrl,
    created_at: "2026-03-24T00:00:00+00:00",
    updated_at: "2026-03-24T00:00:00+00:00",
    details: DEFAULT_INVOICE_DETAILS,
  };
}

function buildBarcodeJob(status: BarcodeJob["status"], fileUrl: string | null = null): BarcodeJob {
  return {
    id: "job_1",
    received_po_id: "po_1",
    status,
    template_kind: "styli",
    template_id: null,
    file_url: fileUrl,
    total_stickers: 1,
    total_pages: 1,
    created_at: "2026-03-24T00:00:00+00:00",
  };
}

function buildPackingList(
  status: PackingList["status"],
  fileUrl: string | null = null,
): PackingList {
  return {
    id: "pl_1",
    received_po_id: "po_1",
    company_id: "co_1",
    status,
    file_url: fileUrl,
    created_at: "2026-03-24T00:00:00+00:00",
    cartons: [
      {
        id: "carton_1",
        packing_list_id: "pl_1",
        carton_number: 1,
        gross_weight: 12.4,
        net_weight: 10.8,
        dimensions: "60x40x40 cm",
        total_pieces: 20,
        created_at: "2026-03-24T00:00:00+00:00",
        updated_at: "2026-03-24T00:00:00+00:00",
        items: [
          {
            id: "carton_item_1",
            carton_id: "carton_1",
            line_item_id: "item_1",
            pieces_in_carton: 20,
            created_at: "2026-03-24T00:00:00+00:00",
          },
        ],
      },
    ],
  };
}

async function openDocumentsTab(name: "Invoice" | "Packing List"): Promise<void> {
  const tabLabel = screen.getByText(name);
  const tabButton = tabLabel.closest("button");
  expect(tabButton).not.toBeNull();
  fireEvent.click(tabButton as HTMLElement);
}

describe("received PO dashboard flows", () => {
  beforeEach(() => {
    pushMock.mockReset();
    uploadReceivedPOMock.mockReset();
    getReceivedPOMock.mockReset();
    confirmReceivedPOMock.mockReset();
    updateReceivedPOHeaderMock.mockReset();
    updateReceivedPOItemsMock.mockReset();
    getOptionalBarcodeJobMock.mockReset();
    getOptionalInvoiceMock.mockReset();
    getOptionalPackingListMock.mockReset();
    createBarcodeJobMock.mockReset();
    createInvoiceDraftMock.mockReset();
    updateInvoiceMock.mockReset();
    generateInvoicePdfMock.mockReset();
    createPackingListMock.mockReset();
    updatePackingListCartonMock.mockReset();
    generatePackingListPdfMock.mockReset();
    resolveFileUrlMock.mockClear();
    listStickerTemplatesMock.mockReset();
    listStickerTemplatesMock.mockResolvedValue([]);
    getStickerTemplateMock.mockReset();
    updateStickerTemplateMock.mockReset();
    uploadStickerImageMock.mockReset();
    getBrandProfileMock.mockReset();
    getBrandProfileMock.mockResolvedValue(buildBrandProfile());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("polls received PO parsing and redirects once parsed", async () => {
    vi.useFakeTimers();
    uploadReceivedPOMock.mockResolvedValue({ received_po_id: "po_1", status: "uploaded" });
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("parsed"));

    const { container } = render(<ReceivedPOUploadView />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const file = new File(["po"], "styli-po.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await act(async () => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    expect(uploadReceivedPOMock).toHaveBeenCalledWith(file);
    expect(screen.getByText("AI is reading your PO...")).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard/received-pos/po_1");
  });

  it("locks the review form after confirmation", async () => {
    getReceivedPOMock
      .mockResolvedValueOnce(buildReceivedPO("parsed"))
      .mockResolvedValueOnce(buildReceivedPO("confirmed"));
    confirmReceivedPOMock.mockResolvedValue({ id: "po_1", status: "confirmed" });

    render(<ReceivedPOReviewView receivedPoId="po_1" />);

    const poNumberInput = (await screen.findByDisplayValue("STY-2026-001")) as HTMLInputElement;
    expect(poNumberInput.disabled).toBe(false);

    await userEvent.setup().click(screen.getByRole("button", { name: "Confirm PO data" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirmed. Open documents" })).toBeTruthy();
    });
    expect((screen.getByDisplayValue("STY-2026-001") as HTMLInputElement).disabled).toBe(true);
  });

  it("allows editing line items before confirmation and saves the updated payload", async () => {
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("parsed"));
    updateReceivedPOItemsMock.mockResolvedValue(
      buildReceivedPOWithOverrides("parsed", {
        model_number: "MOD-2",
        quantity: 12,
      }),
    );

    render(<ReceivedPOReviewView receivedPoId="po_1" />);

    const modelNumberInput = (await screen.findByDisplayValue("MOD-1")) as HTMLInputElement;
    const quantityInput = screen.getByDisplayValue("10") as HTMLInputElement;

    await userEvent.setup().clear(modelNumberInput);
    await userEvent.setup().type(modelNumberInput, "MOD-2");
    await userEvent.setup().clear(quantityInput);
    await userEvent.setup().type(quantityInput, "12");
    await userEvent.setup().click(screen.getByRole("button", { name: "Save line items" }));

    await waitFor(() => {
      expect(updateReceivedPOItemsMock).toHaveBeenCalledWith("po_1", [
        {
          id: "item_1",
          brand_style_code: "HRDS25001",
          styli_style_id: "STY-1",
          model_number: "MOD-2",
          option_id: "OPT-BLK",
          sku_id: "HRDS25001-BLK-S",
          color: "Black",
          size: "S",
          quantity: 12,
          po_price: 499,
        },
      ]);
    });

    expect(screen.getByDisplayValue("MOD-2")).toBeTruthy();
    expect(screen.getByDisplayValue("12")).toBeTruthy();
    expect(screen.getByText("Line items saved.")).toBeTruthy();
  });

  it("transitions the invoice document card from create to generate", async () => {
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock.mockResolvedValue(null);
    getOptionalInvoiceMock.mockResolvedValue(null);
    getOptionalPackingListMock.mockResolvedValue(null);
    createInvoiceDraftMock.mockResolvedValue(buildInvoice("draft"));
    generateInvoicePdfMock.mockResolvedValue({
      invoice_id: "inv_1",
      status: "draft",
      file_url: null,
    });

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    await openDocumentsTab("Invoice");
    await screen.findByRole("button", { name: "Create invoice" });

    await userEvent.setup().click(screen.getByRole("button", { name: "Create invoice" }));

    await waitFor(() => {
      expect(createInvoiceDraftMock).toHaveBeenCalledWith("po_1", {
        number_of_cartons: 0,
        export_mode: "Air",
        details: DEFAULT_INVOICE_DETAILS,
      });
    });
    expect(screen.getByRole("button", { name: "Generate invoice PDF" })).toBeTruthy();
    expect(screen.getAllByText(/INV-2026-001/i).length).toBeGreaterThan(0);

    await userEvent.setup().click(screen.getByRole("button", { name: "Generate invoice PDF" }));

    await waitFor(() => {
      expect(generateInvoicePdfMock).toHaveBeenCalledWith("po_1");
    });
    expect(screen.getByText("Invoice PDF generation started.")).toBeTruthy();
  });

  it("lets users override invoice details from the documents page", async () => {
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock.mockResolvedValue(null);
    getOptionalInvoiceMock.mockResolvedValue(buildInvoice("draft"));
    getOptionalPackingListMock.mockResolvedValue(null);
    updateInvoiceMock.mockResolvedValue({
      ...buildInvoice("draft"),
      details: {
        ...DEFAULT_INVOICE_DETAILS,
        vendor_company_name: "Modern Sanskriti",
      },
    });

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    await openDocumentsTab("Invoice");
    await screen.findByRole("button", { name: "Edit details" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Edit details" }));
    await userEvent.setup().click(screen.getByRole("button", { name: "Change invoice details" }));

    const dialog = await screen.findByRole("dialog");
    const vendorCompanyInput = within(dialog).getByLabelText("Vendor company name");
    await userEvent.setup().clear(vendorCompanyInput);
    await userEvent.setup().type(vendorCompanyInput, "Modern Sanskriti");
    await userEvent.setup().click(within(dialog).getByRole("button", { name: "Save details" }));

    await waitFor(() => {
      expect(updateInvoiceMock).toHaveBeenCalledWith("po_1", {
        gross_weight: 12.5,
        number_of_cartons: 9,
        export_mode: "Air",
        details: {
          ...DEFAULT_INVOICE_DETAILS,
          vendor_company_name: "Modern Sanskriti",
        },
      });
    });
  });

  it("uses resolved file URLs from document cards when downloads are available", async () => {
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock.mockResolvedValue(
      buildBarcodeJob("done", "/static/generated/barcodes/po_1.pdf"),
    );
    getOptionalInvoiceMock.mockResolvedValue(
      buildInvoice("final", "/static/generated/invoices/inv_1.pdf"),
    );
    getOptionalPackingListMock.mockResolvedValue(
      buildPackingList("final", "/static/generated/packing-lists/pl_1.pdf"),
    );

    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    await openDocumentsTab("Invoice");
    const invoiceHeading = await screen.findByRole("heading", { name: "Invoice" });
    const invoiceCard = invoiceHeading.closest(".surface-card");
    expect(invoiceCard).not.toBeNull();

    await userEvent
      .setup()
      .click(within(invoiceCard as HTMLElement).getByRole("button", { name: "Download PDF" }));

    expect(resolveFileUrlMock).toHaveBeenCalledWith("/static/generated/invoices/inv_1.pdf");
    expect(openSpy).toHaveBeenCalledWith(
      "https://files.example.test/static/generated/invoices/inv_1.pdf",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });

  it("tracks the newly created barcode job and clears stale downloads while regenerating", async () => {
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock
      .mockResolvedValueOnce(buildBarcodeJob("done", "/static/generated/barcodes/old.pdf"))
      .mockResolvedValueOnce({
        ...buildBarcodeJob("pending"),
        id: "job_2",
        template_kind: "custom",
        template_id: "template_2",
        file_url: null,
      });
    getOptionalInvoiceMock.mockResolvedValue(null);
    getOptionalPackingListMock.mockResolvedValue(null);
    listStickerTemplatesMock.mockResolvedValue([
      {
        id: "template_2",
        company_id: "co_1",
        name: "new-one",
        width_mm: 44,
        height_mm: 74,
        border_color: "#E34A93",
        border_radius_mm: 2,
        background_color: "#FFFFFF",
        is_default: false,
        created_at: "2026-03-24T00:00:00+00:00",
        updated_at: "2026-03-24T00:00:00+00:00",
        elements: [],
      },
    ]);
    getStickerTemplateMock.mockResolvedValue({
      id: "template_2",
      company_id: "co_1",
      name: "new-one",
      width_mm: 44,
      height_mm: 74,
      border_color: "#E34A93",
      border_radius_mm: 2,
      background_color: "#FFFFFF",
      is_default: false,
      created_at: "2026-03-24T00:00:00+00:00",
      updated_at: "2026-03-24T00:00:00+00:00",
      elements: [],
    });
    createBarcodeJobMock.mockResolvedValue({
      job_id: "job_2",
      status: "pending",
    });

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    expect(await screen.findByRole("button", { name: "Download PDF" })).toBeTruthy();

    await userEvent.setup().click(screen.getByRole("button", { name: "Generate barcodes" }));

    await waitFor(() => {
      expect(createBarcodeJobMock).toHaveBeenCalledWith("po_1", { template_kind: "styli" });
      expect(getOptionalBarcodeJobMock).toHaveBeenLastCalledWith("po_1", "job_2");
    });
    expect(screen.queryByRole("button", { name: "Download PDF" })).toBeNull();
    expect(screen.getByText("Barcode generation started.")).toBeTruthy();
  });

  it("stops invoice PDF polling and shows an error when generation fails", async () => {
    vi.useFakeTimers();
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock.mockResolvedValue(null);
    getOptionalInvoiceMock
      .mockResolvedValueOnce(buildInvoice("draft"))
      .mockResolvedValueOnce(buildInvoice("failed"));
    getOptionalPackingListMock.mockResolvedValue(null);
    generateInvoicePdfMock.mockResolvedValue({
      invoice_id: "inv_1",
      status: "draft",
      file_url: null,
    });

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    await act(async () => {});
    await openDocumentsTab("Invoice");
    fireEvent.click(screen.getByRole("button", { name: "Generate invoice PDF" }));
    await act(async () => {});
    expect(generateInvoicePdfMock).toHaveBeenCalledWith("po_1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Invoice PDF generation failed. Please try again.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate invoice PDF" })).toBeTruthy();
  });

  it("stops packing list PDF polling and shows an error when generation fails", async () => {
    vi.useFakeTimers();
    getReceivedPOMock.mockResolvedValue(buildReceivedPO("confirmed"));
    getOptionalBarcodeJobMock.mockResolvedValue(null);
    getOptionalInvoiceMock.mockResolvedValue(
      buildInvoice("final", "/static/generated/invoices/inv_1.pdf"),
    );
    getOptionalPackingListMock
      .mockResolvedValueOnce(buildPackingList("draft"))
      .mockResolvedValueOnce(buildPackingList("failed"));
    createPackingListMock.mockResolvedValue({
      packing_list_id: "pl_1",
      total_cartons: 1,
      total_pieces: 20,
    });
    generatePackingListPdfMock.mockResolvedValue({
      packing_list_id: "pl_1",
      status: "draft",
      file_url: null,
    });

    render(<ReceivedPODocumentsView receivedPoId="po_1" />);

    await act(async () => {});
    await openDocumentsTab("Packing List");
    fireEvent.click(screen.getByRole("button", { name: "Generate PDF" }));
    await act(async () => {});
    expect(generatePackingListPdfMock).toHaveBeenCalledWith("po_1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(screen.getByText("Packing list PDF generation failed. Please try again.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate PDF" })).toBeTruthy();
  });
});
