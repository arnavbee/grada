"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { apiRequest } from "@/src/lib/api-client";
import { getResolvedApiBaseUrl } from "@/src/lib/api-url";

export function POBuilderView(): JSX.Element {
  const [step, setStep] = useState<number>(1);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [poRequestId, setPoRequestId] = useState<string | null>(null);
  const [poData, setPoData] = useState<any>(null);

  // Forms
  const [prices, setPrices] = useState({
    poPrice: "600",
    ospPrice: "95",
    fabric: "100% Polyester",
  });
  const [sizeRatio, setSizeRatio] = useState({ S: 1, M: 2, L: 2, XL: 1, XXL: 0 });

  useEffect(() => {
    // Fetch draft/ready products for selection
    const fetchProducts = async () => {
      try {
        const res = await apiRequest<{ items: any[] }>("/catalog/products?limit=50", {
          method: "GET",
        });
        if (res.items) setProducts(res.items);
      } catch (err) {
        console.error("Failed to fetch catalog", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 3 && poRequestId) {
      interval = setInterval(async () => {
        try {
          const res = await apiRequest<{ status: string; items: any[] }>(
            `/po-requests/${poRequestId}`,
            { method: "GET" },
          );
          if (res.status === "ready") {
            setPoData(res);
            setStep(4);
          }
        } catch (err) {
          console.error("Error polling PO status", err);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, poRequestId]);

  const handleCreatePORequest = async () => {
    if (selectedProductIds.size === 0) return;
    try {
      const res = await apiRequest<{ id: string }>("/po-requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: Array.from(selectedProductIds) }),
      });
      setPoRequestId(res.id);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    if (!poRequestId) return;

    // We need to fetch the items first so we can update them
    const reqData = await apiRequest<{ items: any[] }>(`/po-requests/${poRequestId}`, {
      method: "GET",
    });

    const itemsUpdate = reqData.items.map((item: any) => ({
      id: item.id,
      po_price: parseFloat(prices.poPrice) || 0,
      osp_inside_price: parseFloat(prices.ospPrice) || 0,
      fabric_composition: prices.fabric,
      size_ratio: sizeRatio,
    }));

    await apiRequest(`/po-requests/${poRequestId}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsUpdate }),
    });

    // trigger AI extraction
    await apiRequest(`/po-requests/${poRequestId}/extract-attributes`, {
      method: "POST",
    });

    setStep(3);
  };

  const handleExport = async () => {
    if (!poRequestId) return;
    try {
      const cookieMatch = document.cookie.match(/(?:^|; )kira_access_token=([^;]*)/);
      const token = cookieMatch ? decodeURIComponent(cookieMatch[1] || "") : null;

      const res = await fetch(`${getResolvedApiBaseUrl()}/po-requests/${poRequestId}/export`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `styli-po-${poRequestId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download CSV File. Wait for API to finish generating.");
    }
  };

  return (
    <DashboardShell
      title="PO Format Builder"
      subtitle="Generate Styli Purchase Order requests from your catalog."
    >
      <div className="mx-auto max-w-5xl space-y-8 pb-16">
        {/* Progress Tracker */}
        <div className="flex items-center space-x-4 mb-8 border-b pb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              onClick={() => {
                // Allow jumping back to previous steps, or forward if preconditions are met
                if (
                  s < step ||
                  (s === 2 && selectedProductIds.size > 0) ||
                  (s >= 3 && poRequestId)
                ) {
                  setStep(s);
                }
              }}
              className={`flex items-center space-x-2 ${
                s < step || (s === 2 && selectedProductIds.size > 0) || (s >= 3 && poRequestId)
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-not-allowed opacity-50"
              } ${step >= s ? "text-blue-600 font-bold" : "text-gray-400 "}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= s ? "border-blue-600 bg-blue-50 " : "border-gray-300 "}`}
              >
                {s}
              </div>
              <span className="hidden sm:inline">
                {s === 1
                  ? "Select Items"
                  : s === 2
                    ? "Configuration"
                    : s === 3
                      ? "AI Extraction"
                      : "Export"}
              </span>
              {s < 4 && (
                <div
                  className="h-px w-8 bg-gray-300 ml-4 pointer-events-none"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1: Catalog Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 ">Select Garments</h3>
              <Button
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={() => {
                  if (selectedProductIds.size === products.length && products.length > 0) {
                    setSelectedProductIds(new Set());
                  } else {
                    setSelectedProductIds(new Set(products.map((p) => p.id)));
                  }
                }}
              >
                {selectedProductIds.size === products.length && products.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    const next = new Set(selectedProductIds);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    setSelectedProductIds(next);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${selectedProductIds.has(p.id) ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20" : "border-gray-200 hover:border-blue-300 :border-blue-500/50 bg-white "}`}
                >
                  <div className="aspect-[3/4] w-full bg-gray-100 rounded-md overflow-hidden mb-3">
                    {p.primary_image_url ? (
                      <img
                        src={p.primary_image_url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex w-full h-full items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate text-gray-900 ">{p.title}</p>
                  <p className="text-xs text-gray-500 ">{p.sku || "No SKU"}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t ">
              <Button onClick={handleCreatePORequest} disabled={selectedProductIds.size === 0}>
                Continue ({selectedProductIds.size} selected)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Configuration */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Ratio Configuration</h3>
              <div className="flex flex-wrap items-center gap-4">
                {["S", "M", "L", "XL", "XXL"].map((sz) => (
                  <div key={sz} className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700 ">{sz}</label>
                    <input
                      type="number"
                      min="0"
                      className="w-20 border rounded-md p-2 text-center text-gray-900 "
                      value={(sizeRatio as any)[sz]}
                      onChange={(e) =>
                        setSizeRatio({ ...sizeRatio, [sz]: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-t pt-6">
                Pricing & Fabric Settings (Applies to all selected)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Price (SAR)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2 text-gray-900 "
                    value={prices.poPrice}
                    onChange={(e) => setPrices({ ...prices, poPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OSP Inside Price (SAR)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2 text-gray-900 "
                    value={prices.ospPrice}
                    onChange={(e) => setPrices({ ...prices, ospPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fabric Composition
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2 text-gray-900 "
                    value={prices.fabric}
                    onChange={(e) => setPrices({ ...prices, fabric: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t ">
              <Button onClick={handleSaveConfig}>Save & Run AI Extraction</Button>
            </div>
          </div>
        )}

        {/* STEP 3: AI Review */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 ">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 ">AI is analyzing garments...</h3>
              <p>Extracting detailed attributes from images in the background.</p>

              <div className="mt-8">
                <Button
                  onClick={async () => {
                    if (poRequestId) {
                      try {
                        const res = await apiRequest<{ status: string; items: any[] }>(
                          `/po-requests/${poRequestId}`,
                          { method: "GET" },
                        );
                        setPoData(res);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    setStep(4);
                  }}
                  variant="secondary"
                >
                  Skip Wait (Proceed to Export)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Export */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600 "
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ">PO Format Sheet Ready</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                The AI has extracted all required attributes and your size ratios have been applied.
                Your sheet is ready for download.
              </p>

              <div className="pt-6">
                <Button onClick={handleExport} className="w-full sm:w-auto px-8 py-3">
                  Download Styli PO (.csv)
                </Button>
              </div>
            </div>

            {/* PREVIEW TABLE */}
            {poData?.items && poData.items.length > 0 && (
              <div className="bg-white p-6 rounded-xl border shadow-sm overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extraction Preview</h3>
                <table className="w-full text-left text-sm text-gray-600 ">
                  <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Garment</th>
                      <th className="px-4 py-3">PO Price</th>
                      <th className="px-4 py-3">Fabric</th>
                      <th className="px-4 py-3 rounded-tr-lg">Extracted Attributes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poData.items.map((item: any, idx: number) => {
                      const productInfo = products.find((p) => p.id === item.product_id);
                      return (
                        <tr key={idx} className="border-b last:border-b-0 align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 shrink-0 rounded bg-gray-100 overflow-hidden">
                                {productInfo?.primary_image_url ? (
                                  <img
                                    src={productInfo.primary_image_url}
                                    alt="Garment"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[9px] text-gray-400 ">
                                    N/A
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 text-sm whitespace-nowrap">
                                  {productInfo?.title || "Unknown Garment"}
                                </span>
                                <span className="text-xs text-gray-500 ">
                                  {productInfo?.sku || item.product_id?.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap pt-4">SAR {item.po_price}</td>
                          <td
                            className="px-4 py-3 max-w-[150px] truncate pt-4"
                            title={item.fabric_composition}
                          >
                            {item.fabric_composition}
                          </td>
                          <td className="px-4 py-3 pt-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.extracted_attributes || {}).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-block bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded"
                                >
                                  <span className="font-semibold text-gray-500 ">
                                    {k
                                      .split("_")
                                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                      .join(" ")}
                                    :
                                  </span>{" "}
                                  {String(v)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
