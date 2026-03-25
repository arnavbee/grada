## Packing List Generation Plan

### Summary

Upgrade packing list generation from the current plain carton summary PDF into a structured, invoice-aligned packing list that matches the uploaded sample.

The packing list will use the **invoice snapshot as the source of truth** for row-level commercial data, and **carton assignments as the source of truth** for carton grouping and carton-level weights/dimensions. A packing list will **require an invoice draft to exist first**. It will also become a first-class module in the UI with a dedicated **Packing Lists** tab, similar to Invoices and Barcodes.

### Key Changes

#### Data model and backend behavior

- Extend `PackingList` to store invoice-linked header metadata needed by the sample format:
  - `invoice_id`
  - optional denormalized display fields if needed for historical stability: `invoice_number`, `invoice_date`, `number_of_cartons`, `gross_weight`
- Keep carton-level data on `PackingListCarton` as the source of:
  - carton number
  - carton dimensions
  - carton net weight
  - carton gross weight
  - total pieces
- Keep `PackingListCartonItem` as the carton allocation map, but render rows by joining:
  - `PackingListCartonItem`
  - `PackingListCarton`
  - `InvoiceLineItem`
- Packing list creation flow:
  - require confirmed received PO
  - require invoice draft/final for the same received PO
  - create or refresh carton assignments
  - link packing list to that invoice snapshot
- If the invoice is regenerated or edited later, the packing list should still use the linked invoice snapshot rows, not re-derive from raw received PO rows.

#### PDF format and rendering

- Replace the current `_packing_list_pdf_lines()` text dump in [received_po_documents.py](/Users/arnavbsingh/Downloads/kira-web/apps/api/app/services/received_po_documents.py) with a structured landscape A4 ReportLab PDF.
- Header structure should mirror the uploaded sample:
  - full-width `PACKING LIST` title row
  - left stacked boxes:
    - Supplier
    - Delivery From
  - middle stacked boxes:
    - Bill To
    - Ship To
  - right-side boxed meta section:
    - invoice no
    - invoice date
    - number of cartons
    - gross weight
    - export shipment mode
- Main table should use one row per **carton allocation row**, not one row per carton:
  - repeated carton number for each row in the carton
  - repeated invoice/PO/commercial columns from linked invoice line items
  - carton-level dimensions / net weight / gross weight shown only on the first row for that carton, blank on following rows in the same carton
- Table columns should match the uploaded sample’s intent:
  - Carton No
  - PO number
  - marketplace PO / option / row identifiers as shown in sample
  - product description / length or category column
  - country / state / district of origin
  - fabric composition
  - model number
  - HSN code
  - marketplace SKU ID
  - size
  - qty
  - unit rate
  - carton dimensions
  - carton net weight
  - carton gross weight
- The renderer should reuse the same invoice header defaults/details already supported for invoice PDFs, so supplier, bill-to, ship-to, and marketplace naming stay visually consistent between invoice and packing list.

#### API and UI flow

- Keep packing list creation/generation on the Received PO Documents page, but change the dependency:
  - if no invoice exists, block generation and prompt user to create invoice first
- Update packing list card behavior:
  - `Create packing list` should attach to existing invoice snapshot
  - `Generate PDF` should use linked invoice metadata + carton assignments
  - keep carton-level edit UI for dimensions, net weight, gross weight
- Add a dedicated `/dashboard/packing-lists` page and sidebar item after Invoices/Barcodes.
- Add a backend list endpoint similar to invoices/barcodes:
  - return packing list id, received PO id, invoice number, PO number, cartons count, total pieces, status, file URL, created date
- Add a web client and list view similar to Invoices/Barcodes:
  - actions: View details, Download PDF, View PO

### Interfaces and Implementation Notes

- Source-of-truth policy:
  - commercial row fields come from `InvoiceLineItem`
  - carton grouping and carton measurements come from `PackingListCarton` + `PackingListCartonItem`
- Required joins for PDF rendering:
  - `PackingList` -> linked `Invoice`
  - `PackingList` -> `PackingListCarton[]`
  - `PackingListCarton` -> `PackingListCartonItem[]`
  - `PackingListCartonItem.line_item_id` must resolve back to the original received PO line item, then map to the corresponding `InvoiceLineItem` for the same style/size row
- Recommended implementation detail:
  - when invoice draft is created, preserve enough stable identifiers on `InvoiceLineItem` to join packing rows cleanly by received PO line item identity or by a stable composite key
- Validation rules:
  - packing list PDF generation should fail with clear errors if:
    - no invoice exists
    - no cartons exist
    - carton items cannot be matched back to invoice rows
- Reuse the invoice header styling helpers where possible instead of duplicating all layout code.

### Test Plan

- Backend:
  - creating a packing list without an invoice returns a clear 409/400 error
  - creating a packing list with an invoice links the correct invoice
  - carton assignments still total correctly across all rows
  - packing list list endpoint returns invoice number, PO number, status, and file URL
  - generated packing list PDF starts with `%PDF-` and contains key strings from:
    - `PACKING LIST`
    - invoice number
    - PO number
    - carton dimensions / weights
    - marketplace SKU IDs
- Rendering:
  - first row of each carton includes carton dimensions/net/gross weight
  - subsequent rows in the same carton leave carton-level cells blank
  - multi-carton output keeps row ordering stable by carton number, then item size order
- UI:
  - Documents page blocks packing list generation when invoice is missing
  - Documents page allows carton edits before PDF generation
  - Packing Lists page loads, lists records, and downloads PDFs

### Assumptions and Defaults

- Use the uploaded sample as the structural reference for the packing list header and row layout.
- Packing list rows should follow the linked invoice snapshot, not raw PO defaults, so invoice and packing list remain aligned.
- Packing list generation is not a standalone document anymore; it depends on invoice existence.
- A dedicated Packing Lists tab should be added now, matching the newer Invoices and Barcodes navigation pattern.
