import { describe, expect, it } from "vitest";

import {
  getLowConfidenceFields,
  getNextColorwayLetter,
  getStyleRowCount,
  getTotalPieces,
  type PORequestItem,
  type PORequestRow,
} from "@/src/lib/po-builder";

const baseItem: PORequestItem = {
  id: "item-1",
  po_request_id: "po-1",
  product_id: "product-1",
  po_price: 600,
  osp_inside_price: 95,
  fabric_composition: "100% Polyester",
  size_ratio: { S: 4, M: 7, L: 7, XL: 4, XXL: 4 },
  extracted_attributes: {
    review_required: true,
    fields: {
      dress_print: { value: "Plain", confidence: 92 },
      neck_women: { value: "High Neck", confidence: 72 },
    },
  },
  colorways: [
    {
      id: "colorway-1",
      po_request_item_id: "item-1",
      letter: "A",
      color_name: "Black",
      created_at: "2026-03-24T00:00:00Z",
      updated_at: "2026-03-24T00:00:00Z",
    },
    {
      id: "colorway-2",
      po_request_item_id: "item-1",
      letter: "B",
      color_name: "Lilac",
      created_at: "2026-03-24T00:00:00Z",
      updated_at: "2026-03-24T00:00:00Z",
    },
  ],
  product: null,
  created_at: "2026-03-24T00:00:00Z",
  updated_at: "2026-03-24T00:00:00Z",
};

describe("po-builder helpers", () => {
  it("computes colorway letters and row explosion counts", () => {
    expect(getNextColorwayLetter(baseItem.colorways)).toBe("C");
    expect(getStyleRowCount(baseItem)).toBe(10);
  });

  it("flags low-confidence review fields and totals pieces", () => {
    expect(getLowConfidenceFields(baseItem.extracted_attributes)).toEqual(["neck_women"]);

    const rows: PORequestRow[] = [
      {
        id: "row-1",
        po_request_id: "po-1",
        po_request_item_id: "item-1",
        product_id: "product-1",
        row_index: 1,
        sku_id: "HRDS25001-A-BLACK-S",
        brand_name: "House Of Raeli",
        category_type: "Dresses",
        styli_sku_id: "",
        color: "Black",
        size: "S",
        colorway_letter: "A",
        l1: "Women",
        fibre_composition: "100% Polyester",
        coo: "India",
        po_price: 600,
        osp_in_sar: 95,
        po_qty: 4,
        knitted_woven: "Woven",
        product_name: "Women's Black Polyester Maxi Dress DRESSES",
        dress_print: "Plain",
        dress_length: "Maxi",
        dress_shape: "A-Line",
        sleeve_length: "Long Sleeves",
        neck_women: "High Neck",
        sleeve_styling: "Flute Sleeve",
        created_at: "2026-03-24T00:00:00Z",
        updated_at: "2026-03-24T00:00:00Z",
      },
      {
        id: "row-2",
        po_request_id: "po-1",
        po_request_item_id: "item-1",
        product_id: "product-1",
        row_index: 2,
        sku_id: "HRDS25001-A-BLACK-M",
        brand_name: "House Of Raeli",
        category_type: "Dresses",
        styli_sku_id: "",
        color: "Black",
        size: "M",
        colorway_letter: "A",
        l1: "Women",
        fibre_composition: "100% Polyester",
        coo: "India",
        po_price: 600,
        osp_in_sar: 95,
        po_qty: 7,
        knitted_woven: "Woven",
        product_name: "Women's Black Polyester Maxi Dress DRESSES",
        dress_print: "Plain",
        dress_length: "Maxi",
        dress_shape: "A-Line",
        sleeve_length: "Long Sleeves",
        neck_women: "High Neck",
        sleeve_styling: "Flute Sleeve",
        created_at: "2026-03-24T00:00:00Z",
        updated_at: "2026-03-24T00:00:00Z",
      },
    ];

    expect(getTotalPieces(rows)).toBe(11);
  });
});
