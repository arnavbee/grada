"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CartonBreakdown } from "@/src/components/received-po/CartonBreakdown";
import { DocumentCard } from "@/src/components/received-po/DocumentCard";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { normalizeStickerAssetUrlForPdf } from "@/src/lib/sticker-asset-pdf";
import {
  type BarcodeJob,
  type ExportMode,
  type Invoice,
  type InvoiceDetails,
  type PackingList,
  type ReceivedPO,
  createBarcodeJob,
  createInvoiceDraft,
  createPackingList,
  generateInvoicePdf,
  generatePackingListPdf,
  getOptionalBarcodeJob,
  getOptionalInvoice,
  getOptionalPackingList,
  getReceivedPO,
  resolveFileUrl,
  updateInvoice,
  updatePackingListCarton,
} from "@/src/lib/received-po";
import { getBrandProfile, type BrandProfile } from "@/src/lib/settings";
import {
  getStickerTemplate,
  listStickerTemplates,
  resolveStickerAssetUrl,
  updateStickerTemplate,
  uploadStickerImage,
  type StickerElement,
  type StickerTemplate,
} from "@/src/lib/sticker-templates";
import {
  buildCartonDrafts,
  type CartonDraftState,
  formatDocumentCurrency,
} from "@/src/lib/received-po-ui";

interface ReceivedPODocumentsViewProps {
  receivedPoId: string;
}

type DocumentWorkspaceTab = "barcode" | "invoice" | "packing";

const EMPTY_INVOICE_DETAILS: InvoiceDetails = {
  marketplace_name: "",
  supplier_name: "",
  address: "",
  gst_number: "",
  pan_number: "",
  fbs_name: "",
  vendor_company_name: "",
  supplier_city: "",
  supplier_state: "",
  supplier_pincode: "",
  delivery_from_name: "",
  delivery_from_address: "",
  delivery_from_city: "",
  delivery_from_pincode: "",
  origin_country: "",
  origin_state: "",
  origin_district: "",
  bill_to_name: "",
  bill_to_address: "",
  bill_to_gst: "",
  bill_to_pan: "",
  ship_to_name: "",
  ship_to_address: "",
  ship_to_gst: "",
  stamp_image_url: "",
};

function previewTextForElement(element: StickerElement): string {
  const field = String(element.properties.field ?? "");
  if (element.element_type === "text_static") {
    return String(element.properties.content ?? "Text");
  }
  if (element.element_type === "text_dynamic") {
    const socialValue = String(element.properties.social_value ?? "").trim();
    if (socialValue) {
      return socialValue;
    }
    if (field === "po_number") return "PO No : 70150792";
    if (field === "model_number") return "Model No. : IN000090128";
    if (field === "option_id") return "Option ID : 7015079228";
    if (field === "size") return "Size : M";
    if (field === "quantity") return "Qty : 7";
    if (field === "styli_sku") return "701507922803";
    return String(element.properties.label ?? "Text");
  }
  if (element.element_type === "barcode") {
    return "701507922803";
  }
  return "";
}

function StickerTemplatePreview({
  template,
}: {
  template: {
    width_mm: number;
    height_mm: number;
    border_color: string | null;
    border_radius_mm: number;
    background_color: string;
    elements?: StickerElement[] | null;
  };
}): JSX.Element {
  const scale = Math.min(160 / template.width_mm, 210 / template.height_mm);
  const width = template.width_mm * scale;
  const height = template.height_mm * scale;
  const elements = template.elements ?? [];

  return (
    <div className="flex justify-center rounded-xl border border-kira-warmgray/20 bg-kira-offwhite/50 p-3 dark:border-white/10 dark:bg-white/5">
      <div
        className="relative overflow-hidden shadow-sm"
        style={{
          width,
          height,
          backgroundColor: template.background_color,
          border: `1px solid ${template.border_color ?? "#d7c9bc"}`,
          borderRadius: `${template.border_radius_mm * scale}px`,
        }}
      >
        {elements
          .slice()
          .sort((left, right) => left.z_index - right.z_index)
          .map((element) => {
            const commonStyle = {
              left: `${element.x_mm * scale}px`,
              top: `${element.y_mm * scale}px`,
              width: `${element.width_mm * scale}px`,
              height: `${element.height_mm * scale}px`,
            };

            if (element.element_type === "image") {
              const assetUrl = resolveStickerAssetUrl(String(element.properties.asset_url ?? ""));
              return assetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="absolute object-contain"
                  key={element.id}
                  src={assetUrl}
                  style={commonStyle}
                />
              ) : (
                <div
                  className="absolute flex items-center justify-center border border-dashed border-kira-midgray/60 text-[8px] text-kira-midgray"
                  key={element.id}
                  style={commonStyle}
                >
                  Logo
                </div>
              );
            }

            if (element.element_type === "barcode") {
              return (
                <div
                  className="absolute flex flex-col items-center justify-center"
                  key={element.id}
                  style={commonStyle}
                >
                  <div
                    className="h-[42%] w-[82%]"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg,#111 0 2px,#fff 2px 3px,#111 3px 4px,#fff 4px 6px)",
                    }}
                  />
                  <span className="mt-1 text-[8px] font-medium text-kira-black">701507922803</span>
                </div>
              );
            }

            if (element.element_type === "line") {
              return (
                <div
                  className="absolute bg-kira-black"
                  key={element.id}
                  style={
                    String(element.properties.orientation ?? "horizontal") === "vertical"
                      ? { ...commonStyle, width: "1px" }
                      : {
                          ...commonStyle,
                          height: `${Math.max(1, Number(element.properties.thickness_pt ?? 1))}px`,
                        }
                  }
                />
              );
            }

            return (
              <div
                className="absolute overflow-hidden text-kira-black"
                key={element.id}
                style={{
                  ...commonStyle,
                  fontSize: `${Math.max(8, Number(element.properties.font_size ?? 8) * scale * 0.42)}px`,
                  fontWeight:
                    String(
                      element.properties.font_weight ?? element.properties.value_weight ?? "normal",
                    ) === "bold"
                      ? 700
                      : 400,
                  textAlign: String(element.properties.alignment ?? "center") as
                    | "left"
                    | "center"
                    | "right",
                  color: String(element.properties.color ?? "#111111"),
                  lineHeight: 1.15,
                }}
              >
                {previewTextForElement(element)}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function StandardTemplatePreview(): JSX.Element {
  return (
    <div className="flex justify-center rounded-xl border border-kira-warmgray/20 bg-kira-offwhite/50 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="relative h-[210px] w-[158px] overflow-hidden rounded-[10px] border border-[#dc5096] bg-white shadow-sm">
        <div className="pt-3 text-center text-[11px] font-bold text-black">BRAND</div>
        <div className="mt-5 text-center text-[9px] text-black">PO No : 70150792</div>
        <div className="mt-1 text-center text-[9px] text-black">Model No. : IN000090128</div>
        <div className="mt-1 text-center text-[9px] text-black">Option ID : 7015079228</div>
        <div className="mx-auto mt-5 h-8 w-24 border-y border-black" />
        <div className="mt-1 text-center text-[8px] text-black">701507922803</div>
        <div className="mt-4 text-center text-[9px] font-semibold text-black">Qty : 7</div>
        <div className="mt-1 text-center text-[11px] font-bold text-black">Size : M</div>
        <div className="mt-1 text-center text-[8px] text-black">Made in India</div>
      </div>
    </div>
  );
}

async function loadTemplatesWithElements(): Promise<StickerTemplate[]> {
  const templates = await listStickerTemplates();
  const fullTemplates = await Promise.all(
    templates.map(async (template) => {
      if (template.elements && template.elements.length > 0) {
        return template;
      }
      try {
        return await getStickerTemplate(template.id);
      } catch {
        return template;
      }
    }),
  );
  return fullTemplates;
}

function buildTemplateElementPayload(template: StickerTemplate) {
  return template.elements.map((element, index) => ({
    element_type: element.element_type,
    x_mm: element.x_mm,
    y_mm: element.y_mm,
    width_mm: element.width_mm,
    height_mm: element.height_mm,
    z_index: element.z_index ?? index,
    properties: element.properties,
  }));
}
const DOC_INPUT_CLASS = "kira-field w-full";
const DOC_TEXTAREA_CLASS = "kira-textarea min-h-24 w-full";

function brandProfileToInvoiceDetails(profile: BrandProfile): InvoiceDetails {
  return {
    marketplace_name: "",
    supplier_name: profile.supplier_name,
    address: profile.address,
    gst_number: profile.gst_number,
    pan_number: profile.pan_number,
    fbs_name: profile.fbs_name,
    vendor_company_name: profile.vendor_company_name,
    supplier_city: profile.supplier_city,
    supplier_state: profile.supplier_state,
    supplier_pincode: profile.supplier_pincode,
    delivery_from_name: profile.delivery_from_name,
    delivery_from_address: profile.delivery_from_address,
    delivery_from_city: profile.delivery_from_city,
    delivery_from_pincode: profile.delivery_from_pincode,
    origin_country: profile.origin_country,
    origin_state: profile.origin_state,
    origin_district: profile.origin_district,
    bill_to_name: profile.bill_to_name,
    bill_to_address: profile.bill_to_address,
    bill_to_gst: profile.bill_to_gst,
    bill_to_pan: profile.bill_to_pan,
    ship_to_name: profile.ship_to_name,
    ship_to_address: profile.ship_to_address,
    ship_to_gst: profile.ship_to_gst,
    stamp_image_url: profile.stamp_image_url,
  };
}

export function ReceivedPODocumentsView({
  receivedPoId,
}: ReceivedPODocumentsViewProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTemplateId = searchParams.get("templateId");
  const [receivedPO, setReceivedPO] = useState<ReceivedPO | null>(null);
  const [barcodeJob, setBarcodeJob] = useState<BarcodeJob | null>(null);
  const [activeBarcodeJobId, setActiveBarcodeJobId] = useState<string | null>(null);
  const [stickerTemplates, setStickerTemplates] = useState<StickerTemplate[]>([]);
  const [selectedBarcodeTemplate, setSelectedBarcodeTemplate] = useState<string>("styli");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [numberOfCartons, setNumberOfCartons] = useState("0");
  const [exportMode, setExportMode] = useState<ExportMode>("Air");
  const [grossWeight, setGrossWeight] = useState("");
  const [defaultInvoiceDetails, setDefaultInvoiceDetails] =
    useState<InvoiceDetails>(EMPTY_INVOICE_DETAILS);
  const [invoiceDetailsDraft, setInvoiceDetailsDraft] =
    useState<InvoiceDetails>(EMPTY_INVOICE_DETAILS);
  const [invoiceDetailsDialogOpen, setInvoiceDetailsDialogOpen] = useState(false);
  const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DocumentWorkspaceTab>("barcode");
  const [packingListPreviewOpen, setPackingListPreviewOpen] = useState(false);
  const [cartonDrafts, setCartonDrafts] = useState<Record<string, CartonDraftState>>({});
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCartonId, setSavingCartonId] = useState<string | null>(null);
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  const totalPieces = useMemo(
    () => packingList?.cartons.reduce((sum, carton) => sum + carton.total_pieces, 0) ?? 0,
    [packingList],
  );
  const selectedStickerTemplateName = useMemo(() => {
    if (selectedBarcodeTemplate === "styli") {
      return "Standard format";
    }
    return (
      stickerTemplates.find((template) => template.id === selectedBarcodeTemplate)?.name ??
      "Select template"
    );
  }, [selectedBarcodeTemplate, stickerTemplates]);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const [
          nextReceivedPO,
          nextBarcodeJob,
          nextInvoice,
          nextPackingList,
          nextTemplates,
          nextBrandProfile,
        ] = await Promise.all([
          getReceivedPO(receivedPoId),
          getOptionalBarcodeJob(receivedPoId),
          getOptionalInvoice(receivedPoId),
          getOptionalPackingList(receivedPoId),
          loadTemplatesWithElements(),
          getBrandProfile(),
        ]);
        if (!active) {
          return;
        }
        const defaultDetails = {
          ...brandProfileToInvoiceDetails(nextBrandProfile),
          marketplace_name: nextReceivedPO.distributor || "Marketplace",
        };
        const defaultTemplateId = nextTemplates.find((template) => template.is_default)?.id ?? null;
        setReceivedPO(nextReceivedPO);
        setBarcodeJob(nextBarcodeJob);
        setActiveBarcodeJobId(nextBarcodeJob?.id ?? null);
        setStickerTemplates(nextTemplates);
        setSelectedBarcodeTemplate(
          requestedTemplateId &&
            nextTemplates.some((template) => template.id === requestedTemplateId)
            ? requestedTemplateId
            : (nextBarcodeJob?.template_id ?? defaultTemplateId ?? "styli"),
        );
        setInvoice(nextInvoice);
        setNumberOfCartons(nextInvoice?.number_of_cartons?.toString() ?? "0");
        setExportMode(nextInvoice?.export_mode ?? "Air");
        setGrossWeight(nextInvoice?.gross_weight?.toString() ?? "");
        setDefaultInvoiceDetails(defaultDetails);
        setInvoiceDetailsDraft(nextInvoice?.details ?? defaultDetails);
        setPackingList(nextPackingList);
        setCartonDrafts(buildCartonDrafts(nextPackingList));
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load document workspace.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [receivedPoId, requestedTemplateId]);

  useEffect(() => {
    const targetBarcodeJobId = activeBarcodeJobId ?? barcodeJob?.id ?? null;
    if (
      !barcodeJob ||
      !targetBarcodeJobId ||
      !["pending", "generating"].includes(barcodeJob.status)
    ) {
      return undefined;
    }
    const interval = window.setInterval(async () => {
      try {
        const nextBarcodeJob = await getOptionalBarcodeJob(receivedPoId, targetBarcodeJobId);
        if (nextBarcodeJob) {
          setBarcodeJob(nextBarcodeJob);
          if (!["pending", "generating"].includes(nextBarcodeJob.status)) {
            window.clearInterval(interval);
          }
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [activeBarcodeJobId, barcodeJob, receivedPoId]);

  useEffect(() => {
    if (!invoice || invoice.status === "final") {
      return undefined;
    }
    if (workingKey !== "invoice-pdf") {
      return undefined;
    }
    const interval = window.setInterval(async () => {
      try {
        const nextInvoice = await getOptionalInvoice(receivedPoId);
        if (nextInvoice) {
          setInvoice(nextInvoice);
          setInvoiceDetailsDraft(nextInvoice.details);
          if (nextInvoice.status === "final") {
            setWorkingKey(null);
            window.clearInterval(interval);
          } else if (nextInvoice.status === "failed") {
            setWorkingKey(null);
            setStatusLine(null);
            setError("Invoice PDF generation failed. Please try again.");
            window.clearInterval(interval);
          }
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [invoice, receivedPoId, workingKey]);

  useEffect(() => {
    if (!packingList || packingList.status === "final") {
      return undefined;
    }
    if (workingKey !== "packing-list-pdf") {
      return undefined;
    }
    const interval = window.setInterval(async () => {
      try {
        const nextPackingList = await getOptionalPackingList(receivedPoId);
        if (nextPackingList) {
          setPackingList(nextPackingList);
          setCartonDrafts(buildCartonDrafts(nextPackingList));
          if (nextPackingList.status === "final") {
            setWorkingKey(null);
            window.clearInterval(interval);
          } else if (nextPackingList.status === "failed") {
            setWorkingKey(null);
            setStatusLine(null);
            setError("Packing list PDF generation failed. Please try again.");
            window.clearInterval(interval);
          }
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [packingList, receivedPoId, workingKey]);

  const openFile = (fileUrl: string | null): void => {
    const resolved = resolveFileUrl(fileUrl);
    if (!resolved) {
      return;
    }
    window.open(resolved, "_blank", "noopener,noreferrer");
  };

  const updateInvoiceDetailsField = (field: keyof InvoiceDetails, value: string): void => {
    setInvoiceDetailsDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const refreshCustomTemplateImagesForPdf = async (templateId: string): Promise<void> => {
    const template = await getStickerTemplate(templateId);
    let changed = false;
    let failedImageCount = 0;

    const nextElements = await Promise.all(
      template.elements.map(async (element) => {
        if (element.element_type !== "image") {
          return element;
        }

        const rawAssetUrl = String(element.properties.asset_url ?? "").trim();
        if (!rawAssetUrl) {
          return element;
        }

        const resolvedAssetUrl = resolveStickerAssetUrl(rawAssetUrl);
        if (!resolvedAssetUrl) {
          return element;
        }

        try {
          const normalizedFile = await normalizeStickerAssetUrlForPdf(
            resolvedAssetUrl,
            `${template.name}-${element.id}`,
          );
          const uploaded = await uploadStickerImage(normalizedFile);
          if (!uploaded.url || uploaded.url === rawAssetUrl) {
            return element;
          }
          changed = true;
          return {
            ...element,
            properties: {
              ...element.properties,
              asset_url: uploaded.url,
            },
          };
        } catch {
          failedImageCount += 1;
          return element;
        }
      }),
    );

    if (failedImageCount > 0) {
      throw new Error(
        failedImageCount === 1
          ? "Template logo/image could not be prepared for PDF. Re-upload it in the sticker builder, save the template, and try again."
          : "Some template images could not be prepared for PDF. Re-upload them in the sticker builder, save the template, and try again.",
      );
    }

    if (!changed) {
      return;
    }

    const savedTemplate = await updateStickerTemplate(template.id, {
      elements: buildTemplateElementPayload({
        ...template,
        elements: nextElements,
      }),
    });
    setStickerTemplates((current) =>
      current.map((item) => (item.id === savedTemplate.id ? savedTemplate : item)),
    );
  };

  const handleGenerateBarcodes = async (): Promise<void> => {
    try {
      setActiveTab("barcode");
      setWorkingKey("barcodes");
      setError(null);
      setStatusLine(null);
      const templateKind = selectedBarcodeTemplate === "styli" ? "styli" : "custom";
      const templateId = templateKind === "custom" ? selectedBarcodeTemplate : null;
      if (templateId) {
        setStatusLine("Preparing template images for PDF...");
        await refreshCustomTemplateImagesForPdf(templateId);
      }
      const createdJob = await createBarcodeJob(
        receivedPoId,
        templateKind === "styli"
          ? { template_kind: "styli" }
          : { template_kind: "custom", template_id: templateId },
      );
      setActiveBarcodeJobId(createdJob.job_id);
      setBarcodeJob({
        id: createdJob.job_id,
        received_po_id: receivedPoId,
        status: createdJob.status,
        template_kind: templateKind,
        template_id: templateId,
        file_url: null,
        total_stickers: receivedPO?.items.length ?? barcodeJob?.total_stickers ?? 0,
        total_pages: 0,
        created_at: new Date().toISOString(),
      });
      const nextStatus = await getOptionalBarcodeJob(receivedPoId, createdJob.job_id);
      setBarcodeJob(nextStatus);
      setStatusLine("Barcode generation started.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to generate barcode sheet.",
      );
    } finally {
      setWorkingKey(null);
    }
  };

  const handleCreateInvoice = async (): Promise<void> => {
    try {
      setActiveTab("invoice");
      setWorkingKey("invoice-create");
      setError(null);
      const nextInvoice = await createInvoiceDraft(receivedPoId, {
        number_of_cartons: Math.max(0, Number(numberOfCartons) || 0),
        export_mode: exportMode,
        details: invoiceDetailsDraft,
      });
      setInvoice(nextInvoice);
      setNumberOfCartons(nextInvoice.number_of_cartons.toString());
      setExportMode(nextInvoice.export_mode);
      setGrossWeight(nextInvoice.gross_weight?.toString() ?? "");
      setInvoiceDetailsDraft(nextInvoice.details);
      setStatusLine("Invoice draft created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create invoice.");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleSaveGrossWeight = async (): Promise<void> => {
    try {
      setWorkingKey("invoice-weight");
      setError(null);
      const nextInvoice = await updateInvoice(receivedPoId, {
        gross_weight: grossWeight ? Number(grossWeight) : null,
        number_of_cartons: Math.max(0, Number(numberOfCartons) || 0),
        export_mode: exportMode,
        details: invoiceDetailsDraft,
      });
      setInvoice(nextInvoice);
      setNumberOfCartons(nextInvoice.number_of_cartons.toString());
      setExportMode(nextInvoice.export_mode);
      setInvoiceDetailsDraft(nextInvoice.details);
      setStatusLine("Invoice draft details saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update invoice weight.");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleGenerateInvoicePdf = async (): Promise<void> => {
    try {
      setActiveTab("invoice");
      setWorkingKey("invoice-pdf");
      setError(null);
      const ensuredInvoice =
        invoice ??
        (await createInvoiceDraft(receivedPoId, {
          number_of_cartons: Math.max(0, Number(numberOfCartons) || 0),
          export_mode: exportMode,
          details: invoiceDetailsDraft,
        }));
      setInvoice(ensuredInvoice);
      setInvoiceDetailsDraft(ensuredInvoice.details);
      const generation = await generateInvoicePdf(receivedPoId);
      setInvoice((current) =>
        current
          ? {
              ...current,
              status: generation.status,
              file_url: generation.file_url,
            }
          : current,
      );
      setStatusLine("Invoice PDF generation started.");
    } catch (nextError) {
      setWorkingKey(null);
      setError(nextError instanceof Error ? nextError.message : "Failed to generate invoice PDF.");
    }
  };

  const handleSaveInvoiceDetails = async (): Promise<void> => {
    try {
      setError(null);
      if (!invoice) {
        setInvoiceDetailsDialogOpen(false);
        setStatusLine("Invoice details updated. They’ll be used when you create the draft.");
        return;
      }
      setWorkingKey("invoice-details");
      const nextInvoice = await updateInvoice(receivedPoId, {
        gross_weight: grossWeight ? Number(grossWeight) : null,
        number_of_cartons: Math.max(0, Number(numberOfCartons) || 0),
        export_mode: exportMode,
        details: invoiceDetailsDraft,
      });
      setInvoice(nextInvoice);
      setInvoiceDetailsDraft(nextInvoice.details);
      setInvoiceDetailsDialogOpen(false);
      setStatusLine("Invoice details saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save invoice details.");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleUseDefaultInvoiceDetails = async (): Promise<void> => {
    try {
      setError(null);
      setInvoiceDetailsDraft(defaultInvoiceDetails);
      if (!invoice) {
        setInvoiceDetailsDialogOpen(false);
        setStatusLine("Invoice defaults restored for the next draft.");
        return;
      }
      setWorkingKey("invoice-defaults");
      const nextInvoice = await updateInvoice(receivedPoId, {
        gross_weight: grossWeight ? Number(grossWeight) : null,
        number_of_cartons: Math.max(0, Number(numberOfCartons) || 0),
        export_mode: exportMode,
        details: defaultInvoiceDetails,
      });
      setInvoice(nextInvoice);
      setInvoiceDetailsDraft(nextInvoice.details);
      setInvoiceDetailsDialogOpen(false);
      setStatusLine("Invoice defaults applied.");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to apply default invoice details.",
      );
    } finally {
      setWorkingKey(null);
    }
  };

  const handleCreatePackingList = async (): Promise<void> => {
    try {
      setActiveTab("packing");
      setWorkingKey("packing-list-create");
      setError(null);
      await createPackingList(receivedPoId);
      const nextPackingList = await getOptionalPackingList(receivedPoId);
      setPackingList(nextPackingList);
      setCartonDrafts(buildCartonDrafts(nextPackingList));
      setStatusLine("Packing list created from confirmed PO quantities.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create packing list.");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleSaveCarton = async (cartonId: string): Promise<void> => {
    const draft = cartonDrafts[cartonId];
    if (!draft) {
      return;
    }
    try {
      setSavingCartonId(cartonId);
      setError(null);
      await updatePackingListCarton(receivedPoId, cartonId, {
        gross_weight: draft.gross_weight ? Number(draft.gross_weight) : null,
        net_weight: draft.net_weight ? Number(draft.net_weight) : null,
        dimensions: draft.dimensions || null,
      });
      const nextPackingList = await getOptionalPackingList(receivedPoId);
      setPackingList(nextPackingList);
      setCartonDrafts(buildCartonDrafts(nextPackingList));
      setStatusLine(`Saved carton ${cartonId}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save carton details.");
    } finally {
      setSavingCartonId(null);
    }
  };

  const handleGeneratePackingListPdf = async (): Promise<void> => {
    try {
      setActiveTab("packing");
      setWorkingKey("packing-list-pdf");
      setError(null);
      if (!packingList) {
        await handleCreatePackingList();
      }
      const generation = await generatePackingListPdf(receivedPoId);
      setPackingList((current) =>
        current
          ? {
              ...current,
              status: generation.status,
              file_url: generation.file_url,
            }
          : current,
      );
      setStatusLine("Packing list PDF generation started.");
    } catch (nextError) {
      setWorkingKey(null);
      setError(
        nextError instanceof Error ? nextError.message : "Failed to generate packing list PDF.",
      );
    }
  };

  return (
    <DashboardShell
      subtitle="Generate the three downstream documents from the confirmed marketplace PO."
      title="Received PO Documents"
    >
      <div className="space-y-6">
        {loading ? (
          <Card className="p-5 text-sm text-kira-darkgray dark:text-gray-200">
            Loading document workspace...
          </Card>
        ) : null}
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        {statusLine ? (
          <Card className="p-4 text-sm text-kira-darkgray dark:text-gray-200">{statusLine}</Card>
        ) : null}

        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-kira-warmgray/25 bg-kira-offwhite/40 p-2 dark:border-white/10 dark:bg-white/5">
            {(
              [
                {
                  key: "barcode",
                  label: "Barcode",
                  summary: barcodeJob
                    ? `${barcodeJob.total_stickers} stickers`
                    : selectedBarcodeTemplate === "styli"
                      ? "Standard format"
                      : "Custom template",
                },
                {
                  key: "invoice",
                  label: "Invoice",
                  summary: invoice ? invoice.invoice_number : "Draft not created",
                },
                {
                  key: "packing",
                  label: "Packing List",
                  summary: packingList
                    ? `${packingList.cartons.length} cartons`
                    : invoice
                      ? "Ready to create"
                      : "Requires invoice",
                },
              ] as Array<{ key: DocumentWorkspaceTab; label: string; summary: string }>
            ).map((tab) => (
              <button
                className={`min-w-[190px] rounded-xl px-4 py-3 text-left transition ${
                  activeTab === tab.key
                    ? "bg-white text-kira-black shadow-sm dark:bg-white/10 dark:text-white"
                    : "text-kira-darkgray hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className="mt-1 text-xs text-kira-midgray dark:text-gray-400">{tab.summary}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {activeTab === "barcode" ? (
            <DocumentCard
              actions={
                <>
                  <Button disabled={workingKey === "barcodes"} onClick={handleGenerateBarcodes}>
                    {workingKey === "barcodes" ? "Generating..." : "Generate barcodes"}
                  </Button>
                  {barcodeJob?.file_url ? (
                    <Button onClick={() => openFile(barcodeJob.file_url)} variant="secondary">
                      Download PDF
                    </Button>
                  ) : null}
                </>
              }
              description={`${barcodeJob?.total_stickers ?? 0} stickers ready for barcode output.`}
              status={barcodeJob?.status ?? "not generated"}
              title="Barcode sheet"
            >
              <div className="space-y-3 text-sm text-kira-darkgray dark:text-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-kira-brown/10 px-2 py-1 text-xs font-medium uppercase tracking-[0.08em] text-kira-brown dark:bg-kira-brown/20 dark:text-amber-200">
                    {selectedBarcodeTemplate === "styli" ? "Standard format" : "Custom template"}
                  </span>
                  {barcodeJob?.total_pages ? <span>{barcodeJob.total_pages} page(s)</span> : null}
                </div>
                <label className="block">
                  <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                    Sticker template
                  </span>
                  <button
                    className="kira-focus-ring flex w-full items-center justify-between rounded-md border border-kira-warmgray/35 bg-white px-3 py-2 text-left text-kira-black dark:border-white/15 dark:bg-white/5 dark:text-white"
                    onClick={() => setTemplatePickerOpen(true)}
                    type="button"
                  >
                    <span>{selectedStickerTemplateName}</span>
                    <span className="text-xs text-kira-midgray dark:text-gray-400">Choose</span>
                  </button>
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/sticker-builder?returnTo=${encodeURIComponent(
                          `/dashboard/received-pos/${receivedPoId}/documents`,
                        )}&preset=styli`,
                      )
                    }
                    variant="secondary"
                  >
                    Open sticker builder
                  </Button>
                  <p className="text-xs text-kira-midgray">
                    Save a new template in the builder and you&apos;ll return here with it selected.
                  </p>
                </div>
              </div>
            </DocumentCard>
          ) : null}

          {activeTab === "invoice" ? (
            <DocumentCard
              actions={
                <>
                  {!invoice ? (
                    <Button
                      disabled={workingKey === "invoice-create"}
                      onClick={handleCreateInvoice}
                    >
                      {workingKey === "invoice-create" ? "Creating..." : "Create invoice"}
                    </Button>
                  ) : null}
                  {invoice ? (
                    <Button
                      disabled={workingKey === "invoice-pdf"}
                      onClick={handleGenerateInvoicePdf}
                    >
                      {workingKey === "invoice-pdf" ? "Generating..." : "Generate invoice PDF"}
                    </Button>
                  ) : null}
                  {invoice?.file_url ? (
                    <Button onClick={() => openFile(invoice.file_url)} variant="secondary">
                      Download PDF
                    </Button>
                  ) : null}
                </>
              }
              description={
                invoice
                  ? `${invoice.invoice_number} · ${formatDocumentCurrency(invoice.total_amount)}`
                  : "Create a commercial invoice draft from the confirmed PO."
              }
              status={invoice?.status ?? "not created"}
              title="Invoice"
            >
              {invoice ? (
                <div className="space-y-3 text-sm text-kira-darkgray dark:text-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">
                        Total Qty
                      </p>
                      <p className="mt-1 text-kira-black dark:text-white">
                        {invoice.total_quantity} pcs
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">
                        Subtotal
                      </p>
                      <p className="mt-1 text-kira-black dark:text-white">
                        {formatDocumentCurrency(invoice.subtotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">IGST</p>
                      <p className="mt-1 text-kira-black dark:text-white">
                        {formatDocumentCurrency(invoice.igst_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">Total</p>
                      <p className="mt-1 text-kira-black dark:text-white">
                        {formatDocumentCurrency(invoice.total_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="kira-muted-panel">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-kira-black dark:text-white">
                          Invoice details and draft inputs are hidden by default.
                        </p>
                      </div>
                      <Button
                        onClick={() => setInvoiceEditorOpen((current) => !current)}
                        variant="secondary"
                      >
                        {invoiceEditorOpen ? "Hide details" : "Edit details"}
                      </Button>
                    </div>
                  </div>
                  {invoiceEditorOpen ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setInvoiceDetailsDialogOpen(true)}
                          variant="secondary"
                        >
                          Change invoice details
                        </Button>
                        <Button
                          disabled={workingKey === "invoice-defaults"}
                          onClick={handleUseDefaultInvoiceDetails}
                          variant="secondary"
                        >
                          Use defaults
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="block text-sm">
                          <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                            Cartons
                          </span>
                          <input
                            className={DOC_INPUT_CLASS}
                            min="0"
                            onChange={(event) => setNumberOfCartons(event.target.value)}
                            step="1"
                            type="number"
                            value={numberOfCartons}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                            Export mode
                          </span>
                          <select
                            className={DOC_INPUT_CLASS}
                            onChange={(event) => setExportMode(event.target.value as ExportMode)}
                            value={exportMode}
                          >
                            <option value="Air">Air</option>
                            <option value="Sea">Sea</option>
                            <option value="Road">Road</option>
                          </select>
                        </label>
                        <label className="block flex-1 text-sm">
                          <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                            Gross weight (kg)
                          </span>
                          <input
                            className={DOC_INPUT_CLASS}
                            min="0"
                            onChange={(event) => setGrossWeight(event.target.value)}
                            step="0.01"
                            type="number"
                            value={grossWeight}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <Button
                          disabled={
                            workingKey === "invoice-weight" || workingKey === "invoice-details"
                          }
                          onClick={handleSaveGrossWeight}
                          variant="secondary"
                        >
                          Save draft details
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {invoice.total_amount_words ? (
                    <p className="text-xs leading-5 text-kira-midgray">
                      Amount in words: {invoice.total_amount_words}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-kira-darkgray dark:text-gray-200">
                  <div className="kira-muted-panel">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-kira-black dark:text-white">
                          Invoice details and draft inputs are hidden by default.
                        </p>
                      </div>
                      <Button
                        onClick={() => setInvoiceEditorOpen((current) => !current)}
                        variant="secondary"
                      >
                        {invoiceEditorOpen ? "Hide details" : "Edit details"}
                      </Button>
                    </div>
                  </div>
                  {invoiceEditorOpen ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setInvoiceDetailsDialogOpen(true)}
                          variant="secondary"
                        >
                          Change invoice details
                        </Button>
                        <Button onClick={handleUseDefaultInvoiceDetails} variant="secondary">
                          Use defaults
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                            Cartons
                          </span>
                          <input
                            className={DOC_INPUT_CLASS}
                            min="0"
                            onChange={(event) => setNumberOfCartons(event.target.value)}
                            step="1"
                            type="number"
                            value={numberOfCartons}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                            Export mode
                          </span>
                          <select
                            className={DOC_INPUT_CLASS}
                            onChange={(event) => setExportMode(event.target.value as ExportMode)}
                            value={exportMode}
                          >
                            <option value="Air">Air</option>
                            <option value="Sea">Sea</option>
                            <option value="Road">Road</option>
                          </select>
                        </label>
                      </div>
                      <p className="text-xs leading-5 text-kira-midgray">
                        The invoice draft will snapshot current PO line items so later PO edits do
                        not change the commercial invoice.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </DocumentCard>
          ) : null}

          {activeTab === "packing" ? (
            <DocumentCard
              actions={
                <>
                  {!packingList && !invoice ? (
                    <Button disabled variant="secondary">
                      Create invoice first
                    </Button>
                  ) : null}
                  {!packingList && invoice ? (
                    <Button
                      disabled={workingKey === "packing-list-create"}
                      onClick={handleCreatePackingList}
                    >
                      {workingKey === "packing-list-create"
                        ? "Creating..."
                        : "Create packing list draft"}
                    </Button>
                  ) : null}
                  {packingList ? (
                    <Button onClick={() => setPackingListPreviewOpen(true)} variant="secondary">
                      Preview
                    </Button>
                  ) : null}
                  {packingList ? (
                    <Button
                      disabled={workingKey === "packing-list-pdf"}
                      onClick={handleGeneratePackingListPdf}
                    >
                      {workingKey === "packing-list-pdf" ? "Generating..." : "Generate PDF"}
                    </Button>
                  ) : null}
                  {packingList?.file_url ? (
                    <Button onClick={() => openFile(packingList.file_url)} variant="secondary">
                      Download PDF
                    </Button>
                  ) : null}
                </>
              }
              description={
                packingList
                  ? `${packingList.cartons.length} cartons · ${totalPieces} pieces${packingList.invoice_number ? ` · linked to ${packingList.invoice_number}` : ""}`
                  : invoice
                    ? "Create carton assignments from the confirmed PO before generating the final packing-list PDF."
                    : "An invoice draft is required before generating a packing list."
              }
              status={packingList?.status ?? "not created"}
              title="Packing list"
            >
              {!packingList && !invoice ? (
                <p className="text-sm text-kira-midgray">
                  Create an invoice draft first. The packing list will be linked to it so commercial
                  row data stays consistent between documents.
                </p>
              ) : null}
              {packingList ? (
                <div className="space-y-3 text-sm text-kira-midgray">
                  <p>
                    Packing list is ready. Review the full carton breakdown in Preview, then
                    generate the final PDF when everything looks right.
                  </p>
                  <p>
                    Carton details can still be edited from the preview dialog before PDF
                    generation.
                  </p>
                </div>
              ) : null}
            </DocumentCard>
          ) : null}
        </div>
      </div>
      {templatePickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-kira-black/40 px-4 py-8">
          <div
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl dark:border dark:border-white/10 dark:bg-[#12141B]"
            role="dialog"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-kira-black dark:text-white">
                  Choose sticker template
                </h2>
                <p className="mt-1 text-sm text-kira-midgray dark:text-gray-400">
                  Pick a template visually, or create a new one in the builder.
                </p>
              </div>
              <Button onClick={() => setTemplatePickerOpen(false)} variant="secondary">
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <button
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedBarcodeTemplate === "styli"
                    ? "border-kira-brown bg-kira-brown/10 dark:border-amber-300/40 dark:bg-amber-300/10"
                    : "border-kira-warmgray/30 bg-transparent hover:border-kira-brown/50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10"
                }`}
                onClick={() => {
                  setSelectedBarcodeTemplate("styli");
                  setTemplatePickerOpen(false);
                }}
                type="button"
              >
                <StandardTemplatePreview />
                <div className="mt-3">
                  <p className="font-medium text-kira-black dark:text-white">Standard format</p>
                  <p className="text-xs text-kira-midgray dark:text-gray-400">
                    Fixed marketplace-compatible sticker sheet
                  </p>
                </div>
              </button>

              {stickerTemplates.map((template) => (
                <button
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedBarcodeTemplate === template.id
                      ? "border-kira-brown bg-kira-brown/10 dark:border-amber-300/40 dark:bg-amber-300/10"
                      : "border-kira-warmgray/30 bg-transparent hover:border-kira-brown/50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10"
                  }`}
                  key={template.id}
                  onClick={() => {
                    setSelectedBarcodeTemplate(template.id);
                    setTemplatePickerOpen(false);
                  }}
                  type="button"
                >
                  <StickerTemplatePreview template={template} />
                  <div className="mt-3">
                    <p className="font-medium text-kira-black dark:text-white">
                      {template.name}
                      {template.is_default ? " (Default)" : ""}
                    </p>
                    <p className="text-xs text-kira-midgray dark:text-gray-400">
                      {template.width_mm.toFixed(2)} × {template.height_mm.toFixed(2)} mm
                    </p>
                  </div>
                </button>
              ))}

              <button
                className="rounded-2xl border border-dashed border-kira-warmgray/40 bg-transparent p-4 text-left transition hover:border-kira-brown/50 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10"
                onClick={() =>
                  router.push(
                    `/dashboard/sticker-builder?returnTo=${encodeURIComponent(
                      `/dashboard/received-pos/${receivedPoId}/documents`,
                    )}&preset=styli`,
                  )
                }
                type="button"
              >
                <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-kira-warmgray/30 bg-kira-offwhite/50 text-sm text-kira-midgray dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  Create new template
                </div>
                <div className="mt-3">
                  <p className="font-medium text-kira-black dark:text-white">New template</p>
                  <p className="text-xs text-kira-midgray dark:text-gray-400">
                    Open the sticker builder and start from a visual base.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {packingListPreviewOpen && packingList ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-kira-black/40 px-4 py-8">
          <div
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl dark:border dark:border-white/10 dark:bg-[#12141B]"
            role="dialog"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-kira-black dark:text-white">
                  Packing list preview
                </h2>
                <p className="mt-1 text-sm text-kira-midgray">
                  Review every carton allocation and update carton measurements here before
                  generating the PDF.
                </p>
              </div>
              <Button onClick={() => setPackingListPreviewOpen(false)} variant="secondary">
                Close
              </Button>
            </div>

            <div className="mt-6">
              <CartonBreakdown
                cartons={packingList.cartons}
                lineItems={receivedPO?.items ?? []}
                drafts={cartonDrafts}
                expandAll
                onChange={(cartonId, field, value) =>
                  setCartonDrafts((current) => ({
                    ...current,
                    [cartonId]: {
                      ...(current[cartonId] ?? {
                        gross_weight: "",
                        net_weight: "",
                        dimensions: "",
                      }),
                      [field]: value,
                    },
                  }))
                }
                onSave={handleSaveCarton}
                savingCartonId={savingCartonId}
              />
            </div>
          </div>
        </div>
      ) : null}
      {invoiceDetailsDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-kira-black/40 px-4 py-8">
          <div
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl dark:border dark:border-white/10 dark:bg-[#12141B]"
            role="dialog"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-kira-black dark:text-white">
                  Invoice details
                </h2>
                <p className="mt-1 text-sm text-kira-midgray">
                  Update invoice-specific supplier, delivery, billing, shipping, and origin details
                  here. Settings remain the source of your defaults.
                </p>
              </div>
              <Button onClick={() => setInvoiceDetailsDialogOpen(false)} variant="secondary">
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-kira-midgray">
                  Supplier
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Supplier name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("supplier_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.supplier_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      FBS name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("fbs_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.fbs_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Vendor company name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("vendor_company_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.vendor_company_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      GST number
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("gst_number", event.target.value)
                      }
                      value={invoiceDetailsDraft.gst_number}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      PAN number
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("pan_number", event.target.value)
                      }
                      value={invoiceDetailsDraft.pan_number}
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Address
                    </span>
                    <textarea
                      className={DOC_TEXTAREA_CLASS}
                      onChange={(event) => updateInvoiceDetailsField("address", event.target.value)}
                      value={invoiceDetailsDraft.address}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">City</span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("supplier_city", event.target.value)
                      }
                      value={invoiceDetailsDraft.supplier_city}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">State</span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("supplier_state", event.target.value)
                      }
                      value={invoiceDetailsDraft.supplier_state}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Pincode
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("supplier_pincode", event.target.value)
                      }
                      value={invoiceDetailsDraft.supplier_pincode}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-kira-midgray">
                  Delivery And Origin
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Delivery from name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("delivery_from_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.delivery_from_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Delivery from city
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("delivery_from_city", event.target.value)
                      }
                      value={invoiceDetailsDraft.delivery_from_city}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Delivery from pincode
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("delivery_from_pincode", event.target.value)
                      }
                      value={invoiceDetailsDraft.delivery_from_pincode}
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Delivery from address
                    </span>
                    <textarea
                      className={DOC_TEXTAREA_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("delivery_from_address", event.target.value)
                      }
                      value={invoiceDetailsDraft.delivery_from_address}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Origin country
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("origin_country", event.target.value)
                      }
                      value={invoiceDetailsDraft.origin_country}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Origin state
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("origin_state", event.target.value)
                      }
                      value={invoiceDetailsDraft.origin_state}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Origin district
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("origin_district", event.target.value)
                      }
                      value={invoiceDetailsDraft.origin_district}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-kira-midgray">
                  Bill To And Ship To
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Marketplace label
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("marketplace_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.marketplace_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Bill to name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("bill_to_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.bill_to_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Bill to GST
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("bill_to_gst", event.target.value)
                      }
                      value={invoiceDetailsDraft.bill_to_gst}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Bill to PAN
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("bill_to_pan", event.target.value)
                      }
                      value={invoiceDetailsDraft.bill_to_pan}
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Bill to address
                    </span>
                    <textarea
                      className={DOC_TEXTAREA_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("bill_to_address", event.target.value)
                      }
                      value={invoiceDetailsDraft.bill_to_address}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Ship to name
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("ship_to_name", event.target.value)
                      }
                      value={invoiceDetailsDraft.ship_to_name}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Ship to GST
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("ship_to_gst", event.target.value)
                      }
                      value={invoiceDetailsDraft.ship_to_gst}
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Ship to address
                    </span>
                    <textarea
                      className={DOC_TEXTAREA_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("ship_to_address", event.target.value)
                      }
                      value={invoiceDetailsDraft.ship_to_address}
                    />
                  </label>
                  <label className="block text-sm md:col-span-2">
                    <span className="mb-1 block text-kira-darkgray dark:text-gray-200">
                      Stamp image URL
                    </span>
                    <input
                      className={DOC_INPUT_CLASS}
                      onChange={(event) =>
                        updateInvoiceDetailsField("stamp_image_url", event.target.value)
                      }
                      value={invoiceDetailsDraft.stamp_image_url}
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                disabled={workingKey === "invoice-defaults"}
                onClick={handleUseDefaultInvoiceDetails}
                variant="secondary"
              >
                Use defaults
              </Button>
              <Button onClick={() => setInvoiceDetailsDialogOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button
                disabled={workingKey === "invoice-details"}
                onClick={handleSaveInvoiceDetails}
              >
                {invoice ? "Save details" : "Use these details"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
