import { describe, expect, it } from "vitest";

import { resolveFileUrl } from "./received-po";
import {
  buildCartonDrafts,
  formatDocumentCurrency,
  formatReceivedPODate,
  getReceivedPOStatusTone,
  getTotalQuantity,
  toEditableLineItems,
  toHeaderDraft,
} from "./received-po-ui";

describe("received PO helpers", () => {
  it("formats empty dates defensively", () => {
    expect(formatReceivedPODate(null)).toBe("-");
  });

  it("maps status tone classes consistently", () => {
    expect(getReceivedPOStatusTone("confirmed")).toContain("emerald");
    expect(getReceivedPOStatusTone("parsed")).toContain("amber");
    expect(getReceivedPOStatusTone("failed")).toContain("rose");
    expect(getReceivedPOStatusTone("uploaded")).toContain("stone");
  });

  it("builds editable line item drafts and header drafts from a received PO", () => {
    const record = {
      id: "po_1",
      company_id: "co_1",
      file_url: "/static/uploads/received-pos/test.xlsx",
      po_number: "STY-2026-001",
      po_date: "2026-03-24T00:00:00+00:00",
      distributor: "Styli",
      status: "parsed",
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
    } as const;

    expect(toHeaderDraft(record)).toEqual({
      po_number: "STY-2026-001",
      po_date: "2026-03-24",
      distributor: "Styli",
    });
    expect(toEditableLineItems(record)).toEqual([
      {
        id: "item_1",
        brand_style_code: "HRDS25001",
        styli_style_id: "STY-1",
        model_number: "MOD-1",
        option_id: "OPT-BLK",
        sku_id: "HRDS25001-BLK-S",
        color: "Black",
        size: "S",
        quantity: 10,
        po_price: 499,
      },
    ]);
  });

  it("computes quantities and carton draft defaults", () => {
    expect(
      getTotalQuantity([
        {
          id: "item_1",
          brand_style_code: "A",
          styli_style_id: null,
          model_number: null,
          option_id: null,
          sku_id: "A-S",
          color: null,
          size: "S",
          quantity: 10,
          po_price: 100,
        },
        {
          id: "item_2",
          brand_style_code: "A",
          styli_style_id: null,
          model_number: null,
          option_id: null,
          sku_id: "A-M",
          color: null,
          size: "M",
          quantity: 12,
          po_price: 100,
        },
      ]),
    ).toBe(22);

    expect(
      buildCartonDrafts({
        id: "pl_1",
        received_po_id: "po_1",
        company_id: "co_1",
        status: "draft",
        file_url: null,
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
            items: [],
          },
        ],
      }),
    ).toEqual({
      carton_1: {
        gross_weight: "12.4",
        net_weight: "10.8",
        dimensions: "60x40x40 cm",
      },
    });
  });

  it("formats currency and file URLs for downloads", () => {
    expect(formatDocumentCurrency(11550)).toBe("INR 11550.00");
    expect(formatDocumentCurrency(null)).toBe("-");
    expect(resolveFileUrl("https://cdn.example.com/invoice.pdf")).toBe(
      "https://cdn.example.com/invoice.pdf",
    );
  });
});
