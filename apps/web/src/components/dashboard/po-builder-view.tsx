"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { apiRequest } from "@/src/lib/api-client";
import { getResolvedApiBaseUrl, getResolvedApiOriginUrl } from "@/src/lib/api-url";
import { getPOBuilderDefaults, type POBuilderDefaults } from "@/src/lib/settings";
import {
  ATTRIBUTE_LABELS,
  DRESS_ATTRIBUTE_OPTIONS,
  getLowConfidenceFields,
  getNextColorwayLetter,
  getStyleRowCount,
  getTotalPieces,
  type PORequestItem,
  type PORequestRow,
  type PORequestResponse,
  SIZE_KEYS,
} from "@/src/lib/po-builder";

interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  brand: string | null;
  category: string | null;
  color: string | null;
  primary_image_url: string | null;
}

interface StepProps {
  activeStep: number;
  currentStep: number;
  label: string;
}

function StepPill({ activeStep, currentStep, label }: StepProps): JSX.Element {
  const isActive = activeStep === currentStep;
  const isComplete = activeStep > currentStep;

  return (
    <div
      className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition-colors ${
        isActive
          ? "border-kira-brown bg-kira-brown text-kira-offwhite"
          : isComplete
            ? "border-kira-brown/40 bg-kira-brown/10 text-kira-brown"
            : "border-kira-warmgray bg-kira-offwhite/60 text-kira-darkgray dark:bg-white/5"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
          isActive ? "bg-kira-offwhite/20" : "bg-kira-warmgray/30"
        }`}
      >
        {currentStep}
      </span>
      <span>{label}</span>
    </div>
  );
}

function cloneItems(items: PORequestItem[]): PORequestItem[] {
  return items.map((item) => ({
    ...item,
    size_ratio: { ...item.size_ratio },
    extracted_attributes: {
      review_required: item.extracted_attributes.review_required,
      fields: Object.fromEntries(
        Object.entries(item.extracted_attributes.fields).map(([field, value]) => [
          field,
          { value: value.value, confidence: value.confidence },
        ]),
      ),
    },
    colorways: item.colorways.map((colorway) => ({ ...colorway })),
    product: item.product ? { ...item.product } : null,
  }));
}

function applyDefaultsToItems(
  items: PORequestItem[],
  defaults: POBuilderDefaults,
): PORequestItem[] {
  return items.map((item) => ({
    ...item,
    po_price: item.po_price ?? defaults.default_po_price,
    osp_inside_price: item.osp_inside_price ?? defaults.default_osp_in_sar,
    fabric_composition:
      item.fabric_composition && item.fabric_composition.trim().length > 0
        ? item.fabric_composition
        : defaults.default_fabric_composition,
    size_ratio: Object.values(item.size_ratio).some((value) => value > 0)
      ? item.size_ratio
      : defaults.default_size_ratio,
  }));
}

interface POBuilderViewProps {
  initialPoRequestId?: string;
}

type ExportFormat = "xlsx" | "csv";

interface PreviewColumn {
  group: string;
  key: keyof PORequestRow | null;
  label: string;
  className?: string;
}

const PREVIEW_COLUMNS: PreviewColumn[] = [
  { group: "Core", key: "sku_id", label: "Style Code", className: "min-w-[220px]" },
  { group: "Core", key: "brand_name", label: "Brand Name", className: "min-w-[160px]" },
  { group: "Core", key: "category_type", label: "Category Type", className: "min-w-[140px]" },
  { group: "Core", key: "styli_sku_id", label: "SKU Id", className: "min-w-[140px]" },
  { group: "Core", key: "color", label: "Color", className: "min-w-[140px]" },
  { group: "Core", key: "size", label: "Size", className: "min-w-[90px]" },
  { group: "Core", key: "l1", label: "L1", className: "min-w-[100px]" },
  {
    group: "Core",
    key: "fibre_composition",
    label: "Fibre Composition",
    className: "min-w-[180px]",
  },
  { group: "Core", key: "coo", label: "COO", className: "min-w-[120px]" },
  { group: "Core", key: "po_price", label: "PO PRICE", className: "min-w-[110px]" },
  { group: "Core", key: "osp_in_sar", label: "OSP in SAR", className: "min-w-[120px]" },
  { group: "Core", key: "po_qty", label: "PO Qnty", className: "min-w-[100px]" },
  { group: "Core", key: "knitted_woven", label: "Knitted / Wovan", className: "min-w-[150px]" },
  { group: "Core", key: "product_name", label: "Product Name / Title", className: "min-w-[320px]" },
  { group: "Tops", key: null, label: "Tops_Fit", className: "min-w-[140px]" },
  { group: "Tops", key: null, label: "Top_Style", className: "min-w-[140px]" },
  { group: "Tops", key: null, label: "Top_Neck", className: "min-w-[140px]" },
  { group: "Tops", key: null, label: "Top_Length", className: "min-w-[140px]" },
  { group: "Tops", key: null, label: "Top_pattern & Prints", className: "min-w-[170px]" },
  { group: "Tops", key: null, label: "sleeve_length", className: "min-w-[140px]" },
  { group: "Trouser", key: null, label: "*pattern", className: "min-w-[120px]" },
  { group: "Trouser", key: null, label: "*product_type_trousers", className: "min-w-[200px]" },
  { group: "Dress", key: "dress_print", label: "Dress Print", className: "min-w-[140px]" },
  { group: "Dress", key: "dress_length", label: "Dress Length", className: "min-w-[140px]" },
  { group: "Dress", key: "dress_shape", label: "Dress Shape", className: "min-w-[140px]" },
  {
    group: "Dress",
    key: "sleeve_length",
    label: "*sleeve_length_women_topwear_dr(dress)",
    className: "min-w-[230px]",
  },
  { group: "Dress", key: "neck_women", label: "*neck_women(dress)", className: "min-w-[180px]" },
  {
    group: "Dress",
    key: "sleeve_styling",
    label: "*sleeve_styling(dress)",
    className: "min-w-[200px]",
  },
  { group: "Coord Sets", key: null, label: "*pattern", className: "min-w-[120px]" },
  { group: "Coord Sets", key: null, label: "*print_or_pattern_type", className: "min-w-[190px]" },
  { group: "Coord Sets", key: null, label: "*bottom_type_sets", className: "min-w-[170px]" },
  { group: "Coord Sets", key: null, label: "*top_type_set", className: "min-w-[160px]" },
  { group: "Coord Sets", key: null, label: "Print", className: "min-w-[120px]" },
  { group: "Coord Sets", key: null, label: "Length", className: "min-w-[120px]" },
  { group: "Ethnic", key: null, label: "ethnic_sleeve_length", className: "min-w-[180px]" },
  { group: "Ethnic", key: null, label: "*ethnic_pattern", className: "min-w-[150px]" },
  { group: "Ethnic", key: null, label: "*ethnic_fit", className: "min-w-[140px]" },
  { group: "Ethnic", key: null, label: "*ethnic_type", className: "min-w-[150px]" },
  { group: "Ethnic", key: null, label: "*ethnic_neckline", className: "min-w-[170px]" },
  { group: "Ethnic", key: null, label: "*ethnic_leg_style", className: "min-w-[170px]" },
  { group: "Ethnic", key: null, label: "ethnic_sleeve_type", className: "min-w-[170px]" },
  { group: "Denim", key: null, label: "Jeans_Fit", className: "min-w-[140px]" },
  { group: "Denim", key: null, label: "Jeans_Waist Rise", className: "min-w-[170px]" },
  { group: "Denim", key: null, label: "Jeans_stretch", className: "min-w-[150px]" },
  { group: "Denim", key: null, label: "Jeans_Wash Shade", className: "min-w-[170px]" },
  { group: "Outerwear", key: null, label: "pattern", className: "min-w-[120px]" },
  { group: "Outerwear", key: null, label: "product_type_Outerwear", className: "min-w-[210px]" },
  {
    group: "Outerwear",
    key: null,
    label: "length_topwear_nightwear_outer",
    className: "min-w-[240px]",
  },
];

function formatPreviewCell(value: PORequestRow[keyof PORequestRow] | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return String(value);
}

function getStepForStatus(status: PORequestResponse["status"]): number {
  if (status === "analyzing") {
    return 3;
  }
  if (status === "ready" || status === "generated") {
    return 4;
  }
  return 2;
}

function getProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  const apiOrigin = getResolvedApiOriginUrl();
  const hasAbsoluteApiOrigin = apiOrigin.startsWith("http://") || apiOrigin.startsWith("https://");

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.pathname.startsWith("/static/") && hasAbsoluteApiOrigin) {
        const normalizedApiOrigin = apiOrigin.replace(/\/+$/, "");
        if (parsed.origin !== normalizedApiOrigin) {
          return `${normalizedApiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      }
    } catch {
      // Fall through and return original URL.
    }
    return imageUrl;
  }
  if (imageUrl.startsWith("/static")) {
    if (hasAbsoluteApiOrigin) {
      return `${apiOrigin.replace(/\/+$/, "")}${imageUrl}`;
    }
    return imageUrl;
  }
  return imageUrl;
}

export function POBuilderView({ initialPoRequestId }: POBuilderViewProps): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState(initialPoRequestId ? 2 : 1);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [poRequestId, setPoRequestId] = useState<string | null>(initialPoRequestId ?? null);
  const [poData, setPoData] = useState<PORequestResponse | null>(null);
  const [draftItems, setDraftItems] = useState<PORequestItem[]>([]);
  const [poBuilderDefaults, setPOBuilderDefaults] = useState<POBuilderDefaults>({
    company_id: "",
    default_po_price: 600,
    default_osp_in_sar: 95,
    default_fabric_composition: "100% Polyester",
    default_size_ratio: { S: 4, M: 7, L: 7, XL: 4, XXL: 4 },
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(Boolean(initialPoRequestId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [response, defaults] = await Promise.all([
          apiRequest<{ items: CatalogProduct[] }>("/catalog/products?limit=100", {
            method: "GET",
          }),
          getPOBuilderDefaults(),
        ]);
        setCatalogProducts(response.items ?? []);
        setPOBuilderDefaults(defaults);
      } catch (error) {
        console.error(error);
        setErrorMessage("Could not load catalog styles.");
      }
    };
    void fetchProducts();
  }, []);

  useEffect(() => {
    if (poData) {
      setDraftItems(applyDefaultsToItems(cloneItems(poData.items), poBuilderDefaults));
    }
  }, [poData, poBuilderDefaults]);

  useEffect(() => {
    if (!initialPoRequestId) {
      return;
    }

    let active = true;

    const loadRequest = async () => {
      try {
        setIsLoadingRequest(true);
        const response = await apiRequest<PORequestResponse>(`/po-requests/${initialPoRequestId}`, {
          method: "GET",
        });
        if (!active) {
          return;
        }
        setPoRequestId(response.id);
        setPoData(response);
        setStep(getStepForStatus(response.status));
      } catch (error) {
        console.error(error);
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Failed to load this PO builder.");
      } finally {
        if (active) {
          setIsLoadingRequest(false);
        }
      }
    };

    void loadRequest();

    return () => {
      active = false;
    };
  }, [initialPoRequestId]);

  useEffect(() => {
    if (step !== 3 || !poRequestId || poData?.status !== "analyzing") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await apiRequest<PORequestResponse>(`/po-requests/${poRequestId}`, {
          method: "GET",
        });
        setPoData(response);
      } catch (error) {
        console.error(error);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, poData?.status, poRequestId]);

  const previewRows = useMemo(() => poData?.rows ?? [], [poData]);
  const totalPieces = useMemo(() => getTotalPieces(previewRows), [previewRows]);

  const selectedCount = selectedProductIds.size;

  const updateDraftItem = (
    itemId: string,
    updater: (currentItem: PORequestItem) => PORequestItem,
  ): void => {
    setDraftItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  };

  const buildUpdatePayload = () => ({
    items: draftItems.map((item) => ({
      id: item.id,
      po_price: item.po_price ?? 0,
      osp_inside_price: item.osp_inside_price ?? 0,
      fabric_composition: item.fabric_composition ?? "",
      size_ratio: item.size_ratio,
      extracted_attributes: item.extracted_attributes,
      colorways: item.colorways.map((colorway) => ({
        id: colorway.id,
        letter: colorway.letter,
        color_name: colorway.color_name,
      })),
    })),
  });

  const fetchPoRequest = async (requestId: string): Promise<PORequestResponse> => {
    const response = await apiRequest<PORequestResponse>(`/po-requests/${requestId}`, {
      method: "GET",
    });
    setPoData(response);
    return response;
  };

  const handleCreatePORequest = async () => {
    if (selectedCount === 0) {
      return;
    }
    setIsCreating(true);
    setErrorMessage(null);
    try {
      const response = await apiRequest<PORequestResponse>("/po-requests", {
        method: "POST",
        body: JSON.stringify({ product_ids: Array.from(selectedProductIds) }),
      });
      setPoRequestId(response.id);
      setPoData(response);
      setStep(2);
      router.push(`/dashboard/po-builder/${response.id}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to start the PO builder.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!poRequestId) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await apiRequest<PORequestResponse>(`/po-requests/${poRequestId}/items`, {
        method: "PUT",
        body: JSON.stringify(buildUpdatePayload()),
      });
      setPoData(updated);
      await apiRequest(`/po-requests/${poRequestId}/extract-attributes`, { method: "POST" });
      setPoData({ ...updated, status: "analyzing" });
      setStep(3);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save style configuration.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReview = async () => {
    if (!poRequestId) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await apiRequest<PORequestResponse>(`/po-requests/${poRequestId}/items`, {
        method: "PUT",
        body: JSON.stringify(buildUpdatePayload()),
      });
      setPoData(updated);
      setStep(4);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save the attribute review.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!poRequestId) {
      return;
    }
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const cookieMatch = document.cookie.match(/(?:^|; )kira_access_token=([^;]*)/);
      const token = cookieMatch ? decodeURIComponent(cookieMatch[1] ?? "") : null;
      const response = await fetch(
        `${getResolvedApiBaseUrl()}/po-requests/${poRequestId}/export?format=${format}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!response.ok) {
        throw new Error("Workbook download failed.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `styli-po-${poRequestId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to export workbook.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardShell
      title="PO Format Builder"
      subtitle="Turn approved catalog styles into Styli-ready colorway x size rows with AI-reviewed dress attributes."
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-16">
        <div className="flex flex-wrap gap-3">
          <StepPill activeStep={step} currentStep={1} label="Select styles" />
          <StepPill activeStep={step} currentStep={2} label="Configure colorways" />
          <StepPill activeStep={step} currentStep={3} label="Review AI" />
          <StepPill activeStep={step} currentStep={4} label="Preview & export" />
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {isLoadingRequest ? (
          <div className="rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 px-6 py-16 text-center dark:bg-white/5">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-kira-brown border-t-transparent" />
            <h2 className="font-serif text-3xl text-kira-black">Loading builder workspace...</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-kira-darkgray">
              Restoring the selected styles, colorways, review state, and workbook preview.
            </p>
          </div>
        ) : null}

        {!initialPoRequestId && !isLoadingRequest && step === 1 ? (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4 rounded-[28px] border border-kira-warmgray/60 bg-[linear-gradient(135deg,rgba(244,239,232,0.9),rgba(255,255,255,1))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,31,27,0.96),rgba(15,21,18,0.92))]">
              <div className="max-w-2xl space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-kira-darkgray/65">
                  Current builder, upgraded
                </p>
                <h2 className="font-serif text-3xl text-kira-black">
                  Pick the base styles for this workbook.
                </h2>
                <p className="text-sm leading-6 text-kira-darkgray">
                  Each selected catalog style becomes a configurable PO style. In the next step
                  we’ll add colorways, ratios, pricing, and fabric so the app can explode each style
                  into final Styli rows.
                </p>
              </div>
              <div className="rounded-2xl bg-kira-black px-5 py-4 text-kira-offwhite dark:bg-[#141b18] dark:text-kira-offwhite">
                <div className="text-xs uppercase tracking-[0.2em] text-kira-offwhite/60">
                  Selected
                </div>
                <div className="text-3xl font-semibold">{selectedCount}</div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {catalogProducts.map((product) => {
                const isSelected = selectedProductIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    className={`group overflow-hidden rounded-[24px] border text-left transition ${
                      isSelected
                        ? "border-kira-brown bg-kira-brown/6 shadow-[0_12px_40px_rgba(84,48,35,0.12)]"
                        : "border-kira-warmgray/70 bg-kira-offwhite/45 hover:border-kira-brown/50 dark:bg-white/5"
                    }`}
                    onClick={() => {
                      setSelectedProductIds((current) => {
                        const next = new Set(current);
                        if (next.has(product.id)) {
                          next.delete(product.id);
                        } else {
                          next.add(product.id);
                        }
                        return next;
                      });
                    }}
                    type="button"
                  >
                    <div className="relative aspect-[4/5] bg-kira-warmgray/25">
                      {getProductImageUrl(product.primary_image_url) ? (
                        <Image
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          fill
                          src={getProductImageUrl(product.primary_image_url) ?? ""}
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-kira-darkgray/40">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-kira-black">{product.title}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-kira-darkgray/60">
                            {product.sku}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            isSelected
                              ? "bg-kira-brown text-kira-offwhite"
                              : "bg-kira-warmgray/35 text-kira-darkgray"
                          }`}
                        >
                          {isSelected ? "Added" : "Select"}
                        </span>
                      </div>
                      <p className="text-xs text-kira-darkgray/70">
                        {(product.category || "Dresses").replace(/_/g, " ")} ·{" "}
                        {product.color || "Default color"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button disabled={selectedCount === 0 || isCreating} onClick={handleCreatePORequest}>
                {isCreating ? "Starting builder..." : `Create builder (${selectedCount})`}
              </Button>
            </div>
          </section>
        ) : null}

        {!isLoadingRequest && step === 2 && poData ? (
          <section className="space-y-6">
            <div className="grid gap-4 rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 p-6 lg:grid-cols-[1.3fr_0.7fr] dark:bg-white/5">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kira-darkgray/55">
                  Style configuration
                </p>
                <h2 className="font-serif text-2xl text-kira-black">
                  Set each style up the way Styli expects it.
                </h2>
                <p className="text-sm leading-6 text-kira-darkgray">
                  Add colorways, adjust the size ratio, and set commercial inputs per style. The app
                  will derive the final submission rows from these style-level settings.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-kira-warmgray/18 p-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-kira-darkgray/55">
                    Styles
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-kira-black">
                    {draftItems.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-kira-darkgray/55">
                    Projected rows
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-kira-black">
                    {draftItems.reduce((sum, item) => sum + getStyleRowCount(item), 0)}
                  </div>
                </div>
              </div>
            </div>

            {draftItems.map((item) => (
              <article
                key={item.id}
                className="grid gap-6 rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 p-6 lg:grid-cols-[0.95fr_1.05fr] dark:bg-white/5"
              >
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative h-28 w-24 overflow-hidden rounded-2xl bg-kira-warmgray/25">
                      {getProductImageUrl(item.product?.primary_image_url) ? (
                        <Image
                          alt={item.product?.title || "Catalog style"}
                          className="h-full w-full object-cover"
                          fill
                          src={getProductImageUrl(item.product?.primary_image_url) ?? ""}
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-kira-darkgray/50">
                        {item.product?.sku || item.product_id}
                      </p>
                      <h3 className="font-serif text-2xl text-kira-black">
                        {item.product?.title || "Catalog style"}
                      </h3>
                      <p className="text-sm text-kira-darkgray">
                        {(item.product?.category || "Dresses").replace(/_/g, " ")} ·{" "}
                        {item.product?.brand || "Brand profile"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-kira-darkgray">
                      <span className="font-medium">PO price</span>
                      <input
                        className="w-full rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          updateDraftItem(item.id, (current) => ({
                            ...current,
                            po_price: Number.isFinite(nextValue) ? nextValue : 0,
                          }));
                        }}
                        type="number"
                        value={item.po_price ?? ""}
                      />
                    </label>
                    <label className="space-y-2 text-sm text-kira-darkgray">
                      <span className="font-medium">OSP in SAR</span>
                      <input
                        className="w-full rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          updateDraftItem(item.id, (current) => ({
                            ...current,
                            osp_inside_price: Number.isFinite(nextValue) ? nextValue : 0,
                          }));
                        }}
                        type="number"
                        value={item.osp_inside_price ?? ""}
                      />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-kira-darkgray">
                    <span className="font-medium">Fibre composition</span>
                    <input
                      className="w-full rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                      onChange={(event) => {
                        updateDraftItem(item.id, (current) => ({
                          ...current,
                          fabric_composition: event.target.value,
                        }));
                      }}
                      value={item.fabric_composition ?? ""}
                    />
                  </label>

                  <div className="rounded-2xl bg-kira-warmgray/18 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-kira-black">Colorways</p>
                      <Button
                        className="px-3 py-1 text-xs"
                        onClick={() => {
                          updateDraftItem(item.id, (current) => ({
                            ...current,
                            colorways: [
                              ...current.colorways,
                              {
                                id: `${current.id}-${current.colorways.length + 1}`,
                                po_request_item_id: current.id,
                                letter: getNextColorwayLetter(current.colorways),
                                color_name: "",
                                created_at: current.created_at,
                                updated_at: current.updated_at,
                              },
                            ],
                          }));
                        }}
                        variant="secondary"
                      >
                        Add colorway
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {item.colorways.map((colorway, colorwayIndex) => (
                        <div
                          key={`${item.id}-${colorway.letter}-${colorwayIndex}`}
                          className="flex gap-3"
                        >
                          <input
                            className="w-20 rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-center font-semibold text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                            maxLength={2}
                            onChange={(event) => {
                              updateDraftItem(item.id, (current) => ({
                                ...current,
                                colorways: current.colorways.map((entry, entryIndex) =>
                                  entryIndex === colorwayIndex
                                    ? { ...entry, letter: event.target.value.toUpperCase() }
                                    : entry,
                                ),
                              }));
                            }}
                            value={colorway.letter}
                          />
                          <input
                            className="flex-1 rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                            onChange={(event) => {
                              updateDraftItem(item.id, (current) => ({
                                ...current,
                                colorways: current.colorways.map((entry, entryIndex) =>
                                  entryIndex === colorwayIndex
                                    ? { ...entry, color_name: event.target.value }
                                    : entry,
                                ),
                              }));
                            }}
                            placeholder="Black"
                            value={colorway.color_name}
                          />
                          {item.colorways.length > 1 ? (
                            <Button
                              className="px-3"
                              onClick={() => {
                                updateDraftItem(item.id, (current) => ({
                                  ...current,
                                  colorways: current.colorways.filter(
                                    (_, entryIndex) => entryIndex !== colorwayIndex,
                                  ),
                                }));
                              }}
                              variant="secondary"
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-kira-warmgray/70 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-kira-black">Size ratio</p>
                        <p className="text-xs text-kira-darkgray/65">
                          Qty per colorway drives final row explosion.
                        </p>
                      </div>
                      <div className="rounded-full bg-kira-brown/10 px-3 py-1 text-xs font-semibold text-kira-brown">
                        {Object.values(item.size_ratio).reduce((sum, value) => sum + value, 0)}{" "}
                        pieces / colorway
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      {SIZE_KEYS.map((sizeKey) => (
                        <label
                          key={`${item.id}-${sizeKey}`}
                          className="space-y-2 text-center text-sm text-kira-darkgray"
                        >
                          <span className="font-medium">{sizeKey}</span>
                          <input
                            className="w-full rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-2 py-2 text-center text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                            min={0}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              updateDraftItem(item.id, (current) => ({
                                ...current,
                                size_ratio: {
                                  ...current.size_ratio,
                                  [sizeKey]: Number.isFinite(nextValue) ? nextValue : 0,
                                },
                              }));
                            }}
                            type="number"
                            value={item.size_ratio[sizeKey]}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-kira-black px-5 py-4 text-kira-offwhite dark:bg-white/90 dark:text-[#141b18]">
                    <p className="text-xs uppercase tracking-[0.18em] text-kira-offwhite/65 dark:text-[#141b18]/65">
                      Derived preview
                    </p>
                    <div className="mt-2 flex flex-wrap gap-6 text-sm">
                      <span>{item.colorways.length} colorways</span>
                      <span>{getStyleRowCount(item)} projected rows</span>
                      <span>
                        {Object.values(item.size_ratio).reduce((sum, value) => sum + value, 0) *
                          item.colorways.length}{" "}
                        pieces total
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div className="flex items-center justify-between">
              {initialPoRequestId ? (
                <Button onClick={() => router.push("/dashboard/po-builder")} variant="secondary">
                  Back to builders
                </Button>
              ) : (
                <Button onClick={() => setStep(1)} variant="secondary">
                  Back
                </Button>
              )}
              <Button disabled={isSaving} onClick={handleSaveConfiguration}>
                {isSaving ? "Saving styles..." : "Save styles & run AI review"}
              </Button>
            </div>
          </section>
        ) : null}

        {!isLoadingRequest && step === 3 && poData ? (
          <section className="space-y-6">
            {poData.status === "analyzing" ? (
              <div className="rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 px-6 py-16 text-center dark:bg-white/5">
                <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-kira-brown border-t-transparent" />
                <h2 className="font-serif text-3xl text-kira-black">AI is reviewing each style.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-kira-darkgray">
                  We’re constraining the dress attributes to Styli-safe enum values and pulling
                  confidence scores so you only need to touch the fields that look uncertain.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 p-6 dark:bg-white/5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kira-darkgray/55">
                    AI attribute review
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-kira-black">
                    Review the enum-constrained dress attributes before export.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-kira-darkgray">
                    Amber badges mark confidence below 75%, which usually means the image needs a
                    human correction before you export the workbook.
                  </p>
                </div>

                {draftItems.map((item) => {
                  const lowConfidenceFields = getLowConfidenceFields(item.extracted_attributes);
                  const reviewFields = Object.keys(ATTRIBUTE_LABELS) as Array<
                    keyof typeof ATTRIBUTE_LABELS & keyof typeof DRESS_ATTRIBUTE_OPTIONS
                  >;

                  return (
                    <article
                      key={item.id}
                      className="rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 p-6 dark:bg-white/5"
                    >
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-kira-darkgray/50">
                            {item.product?.sku || item.product_id}
                          </p>
                          <h3 className="mt-1 font-serif text-2xl text-kira-black">
                            {item.product?.title || "Catalog style"}
                          </h3>
                        </div>
                        <div className="rounded-full bg-kira-warmgray/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-kira-darkgray">
                          {item.extracted_attributes.review_required ? "Review required" : "Ready"}
                        </div>
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-4">
                          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-kira-warmgray/70 bg-kira-warmgray/20">
                            {getProductImageUrl(item.product?.primary_image_url) ? (
                              <Image
                                alt={item.product?.title || "Catalog style"}
                                className="h-full w-full object-cover"
                                fill
                                src={getProductImageUrl(item.product?.primary_image_url) ?? ""}
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-6 text-center text-xs uppercase tracking-[0.2em] text-kira-darkgray/45">
                                No image available
                              </div>
                            )}
                          </div>
                          <div className="rounded-2xl border border-kira-warmgray/70 bg-kira-warmgray/10 p-4 text-sm text-kira-darkgray">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kira-darkgray/55">
                              Review against image
                            </p>
                            <p className="mt-2 leading-6">
                              Compare the AI-selected dress attributes with the style image before
                              approving the workbook.
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {reviewFields.map((fieldKey) => {
                            const fieldValue =
                              item.extracted_attributes.fields[fieldKey]?.value ?? "";
                            const confidence =
                              item.extracted_attributes.fields[fieldKey]?.confidence;
                            const isLowConfidence =
                              typeof confidence === "number" &&
                              lowConfidenceFields.includes(fieldKey);
                            const fieldOptions = DRESS_ATTRIBUTE_OPTIONS[fieldKey] ?? [];

                            return (
                              <label
                                key={`${item.id}-${fieldKey}`}
                                className={`rounded-2xl border p-4 text-sm ${
                                  isLowConfidence
                                    ? "border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10"
                                    : "border-kira-warmgray/70 bg-kira-warmgray/10 dark:bg-white/5"
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <span className="font-medium text-kira-black">
                                    {ATTRIBUTE_LABELS[fieldKey]}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                      isLowConfidence
                                        ? "bg-amber-200 text-amber-900 dark:bg-amber-300/30 dark:text-amber-100"
                                        : "bg-kira-offwhite/75 text-kira-darkgray dark:bg-white/10"
                                    }`}
                                  >
                                    {typeof confidence === "number"
                                      ? `${Math.round(confidence)}%`
                                      : "manual"}
                                  </span>
                                </div>
                                <select
                                  className="w-full rounded-xl border border-kira-warmgray bg-kira-offwhite/70 px-3 py-2 text-kira-black outline-none transition focus:border-kira-brown dark:bg-white/10"
                                  onChange={(event) => {
                                    updateDraftItem(item.id, (current) => ({
                                      ...current,
                                      extracted_attributes: {
                                        review_required:
                                          current.extracted_attributes.review_required,
                                        fields: {
                                          ...current.extracted_attributes.fields,
                                          [fieldKey]: {
                                            value: event.target.value,
                                            confidence:
                                              current.extracted_attributes.fields[fieldKey]
                                                ?.confidence ?? null,
                                          },
                                        },
                                      },
                                    }));
                                  }}
                                  value={fieldValue}
                                >
                                  <option value="">Select...</option>
                                  {fieldOptions.map((option) => (
                                    <option key={`${fieldKey}-${option}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}

                <div className="flex items-center justify-between">
                  <Button onClick={() => setStep(2)} variant="secondary">
                    Back to style setup
                  </Button>
                  <Button disabled={isSaving} onClick={handleSaveReview}>
                    {isSaving ? "Saving review..." : "Save review & continue"}
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : null}

        {!isLoadingRequest && step === 4 && poData ? (
          <section className="space-y-6">
            <div className="grid gap-4 rounded-[28px] border border-kira-warmgray/70 bg-[linear-gradient(135deg,rgba(64,49,43,1),rgba(100,73,60,0.95))] p-6 text-kira-offwhite dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(20,27,24,0.98),rgba(35,47,41,0.94))] dark:text-kira-offwhite lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kira-offwhite/60 dark:text-kira-offwhite/60">
                  Workbook preview
                </p>
                <h2 className="font-serif text-3xl">Your Styli submission rows are ready.</h2>
                <p className="max-w-2xl text-sm leading-6 text-kira-offwhite/78 dark:text-kira-offwhite/78">
                  The builder has already exploded each style into colorway x size rows and placed
                  dress attributes into the correct section of the workbook. Export now to hand your
                  team the submission-ready sheet.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-[24px] bg-kira-offwhite/10 p-4 text-center text-sm dark:bg-white/5">
                <div className="rounded-[18px] bg-kira-offwhite/8 px-3 py-4 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-[0.16em] text-kira-offwhite/60 dark:text-kira-offwhite/60">
                    Styles
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{poData.items.length}</div>
                </div>
                <div className="rounded-[18px] bg-kira-offwhite/8 px-3 py-4 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-[0.16em] text-kira-offwhite/60 dark:text-kira-offwhite/60">
                    Rows
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{previewRows.length}</div>
                </div>
                <div className="rounded-[18px] bg-kira-offwhite/8 px-3 py-4 dark:bg-white/5">
                  <div className="text-xs uppercase tracking-[0.16em] text-kira-offwhite/60 dark:text-kira-offwhite/60">
                    Pieces
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{totalPieces}</div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-kira-warmgray/70 bg-kira-offwhite/35 dark:bg-white/5">
              <div className="flex items-center justify-between border-b border-kira-warmgray/60 px-6 py-4">
                <div>
                  <h3 className="font-semibold text-kira-black">Live export preview</h3>
                  <p className="text-sm text-kira-darkgray">
                    This is the row-level shape that will be written to the Women_SST workbook.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={isExporting} onClick={() => void handleExport("xlsx")}>
                    {isExporting ? "Preparing workbook..." : "Download PO (.xlsx)"}
                  </Button>
                  <Button
                    disabled={isExporting}
                    onClick={() => void handleExport("csv")}
                    variant="secondary"
                  >
                    {isExporting ? "Preparing workbook..." : "Download PO (.csv)"}
                  </Button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-[2600px] text-left text-sm">
                  <thead className="sticky top-0 z-10 text-kira-darkgray backdrop-blur">
                    <tr className="bg-kira-warmgray/18 text-[11px] uppercase tracking-[0.16em] text-kira-darkgray/75">
                      {PREVIEW_COLUMNS.map((column, index) => (
                        <th
                          key={`group-${column.label}-${index}`}
                          className={`px-4 py-2 font-semibold ${column.className ?? ""}`}
                        >
                          {column.group}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {PREVIEW_COLUMNS.map((column) => (
                        <th
                          key={`${column.group}-${column.label}`}
                          className={`bg-kira-warmgray/16 px-4 py-3 font-semibold ${column.className ?? ""}`}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-kira-warmgray/40 align-top text-kira-darkgray"
                      >
                        {PREVIEW_COLUMNS.map((column) => (
                          <td
                            key={`${row.id}-${column.key}`}
                            className={`px-4 py-3 ${column.key === "sku_id" ? "font-medium text-kira-black" : ""} ${column.className ?? ""}`}
                          >
                            {formatPreviewCell(column.key ? row[column.key] : "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setStep(3)} variant="secondary">
                Back to AI review
              </Button>
              <Button
                disabled={isExporting}
                onClick={() => void fetchPoRequest(poRequestId ?? "")}
                variant="secondary"
              >
                Refresh preview
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
