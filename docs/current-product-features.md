# Current Product Features

Current as of April 2, 2026.

This document summarizes the major product capabilities that are implemented in the app today across catalog, PO operations, received marketplace PO processing, document generation, settings, and platform infrastructure.

## 1. Authentication and tenancy

- User registration, sign-in, refresh-token, logout, forgot-password, and reset-password flows
- Role-aware access control for admin, manager, and operator actions
- Middleware route protection for `/dashboard` and auth pages with session-aware redirects
- JWT-aware session checks in middleware, including token normalization and expiry validation for access and refresh cookies
- `next` redirect preservation when unauthenticated users are sent to login from protected routes
- Company-scoped data isolation across products, templates, received POs, jobs, exports, invoices, and packing lists
- Audit logging for key business actions across auth, catalog, PO, and document workflows

## 2. Smart Catalog

- Catalog product CRUD with searchable and filterable product lists
- Product image attachment and product measurement capture
- AI-powered image analysis for product attributes such as category, style name, color, fabric, composition, and woven/knits
- Confidence-aware AI suggestion workflows in the catalog UI
- AI correction logging for human feedback and continuous learning
- Learning stats dashboard for processed images, corrections received, pending retraining, and field-level accuracy
- Smart style-code generation, including pattern-based generation and automatic fallback generation
- Image labeling workflows with AI labels, human overrides, and corrected-state tracking
- Catalog templates with saved defaults, allowed values, and style-code patterns
- Marketplace export generation with validation and export history
- Marketplace-specific export support for Generic, Myntra, Ajio, Amazon IN, Flipkart, and Nykaa
- Processing-job tracking for image-analysis and tech-pack OCR workflows

## 3. PO Format Builder

- PO request builder workflow connected to catalog products
- Attribute extraction and row review before export
- Builder defaults for PO price, OSP in SAR, default fabric composition, and size ratios
- Exact XLSX export generation for PO request workbooks

## 4. Received marketplace POs

- Upload support for PDF, XLS, and XLSX marketplace PO files
- Parsing workflow with durable background processing
- Vendor-format parsing support, including quantity aliases such as `Total`
- Review and edit flow for received PO headers and line items before confirmation
- Confirmation gate before downstream document generation
- Received PO list and detail views with status tracking

## 5. Barcode generation

- Barcode PDF generation directly from confirmed received POs
- Built-in Styli barcode format
- Custom barcode template support through saved sticker templates
- Exact barcode job tracking, including per-job status lookup and latest-job status lookup
- Barcode regeneration flows that track the current generation job instead of reusing stale downloads
- Barcode history/list view with PO reference, template type, page count, and direct download
- Better failure handling for custom-template barcode jobs when template images cannot be prepared or loaded
- Same-origin asset proxying and PDF-safe image normalization for custom sticker assets

## 6. Sticker template builder

- Visual sticker-template builder for custom barcode labels
- Template canvas with configurable width, height, border, radius, and background
- Element support for static text, dynamic text, barcodes, images, and lines
- Template save, update, delete, and preview workflows
- Sticker-image upload support with PDF-safe normalization
- Better compatibility for template assets stored in object storage

## 7. Commercial invoices

- Invoice draft creation from confirmed received POs
- Editable invoice details for supplier, GST, bill-to, ship-to, origin, delivery-from, and invoice metadata
- Invoice numbering driven by company settings
- Invoice PDF generation as a durable background job
- Invoice list/history APIs and UI
- GST-aware invoice math
- Interstate invoices use IGST
- Intrastate invoices automatically split tax into CGST + SGST based on GST state codes
- Invoice snapshot refresh before PDF generation so the document stays aligned with latest PO and invoice details
- Amount-in-words generation for invoice totals

## 8. Packing lists

- Packing list creation downstream of invoice creation
- Carton auto-assignment from received PO quantities
- Carton capacity rules by category, including default rules
- Carton-level editing for gross weight, net weight, and dimensions
- Packing-list PDF generation as a durable background job
- Packing-list history/list support
- Invoice linkage carried through to packing-list records and documents

## 9. Settings and operational defaults

- Brand profile management for supplier, GST, PAN, address, delivery, origin, bill-to, and ship-to details
- Invoice defaults, including invoice prefix and default IGST rate
- Brand stamp upload for document use
- Social-handle and website fields for brand identity
- PO-builder default management
- Carton-capacity rule management, including create, update, delete, and default rules

## 10. File storage and document durability

- Local filesystem fallback for uploads and generated documents during simple/local setups
- S3-compatible object-storage support, including Cloudflare R2
- Durable barcode, invoice, and packing-list PDFs when object storage is configured
- Storage health endpoint to verify whether production is using local or object-backed storage

## 11. Jobs, reliability, and platform behavior

- Built-in durable worker started by the API for parse and document-generation jobs
- Durable job types for received PO parsing, barcode PDF generation, invoice PDF generation, and packing-list PDF generation
- Clearer failed-state handling for document generation instead of indefinite loading states
- Health endpoints for API and storage status
- Separate web and API apps in a monorepo with tenancy-aware backend enforcement

## 12. Admin and reporting

- Super-admin route group for operational analytics and tenancy-aware reporting
- Super-admin-only dashboard navigation visibility for Admin screens
- Cached auth-profile lookups in the dashboard shell for faster company/role-aware navigation rendering
- Invoice, barcode, and packing-list list views for downstream operations visibility

## Highlights worth showing externally

- AI-assisted catalog creation with correction learning
- Marketplace-ready export generation for multiple channels
- End-to-end received PO workflow from upload to barcode, invoice, and packing-list PDFs
- Custom sticker-template builder for barcode labels
- Automatic intrastate vs interstate invoice tax handling
- Durable generated-document storage through R2-compatible object storage
