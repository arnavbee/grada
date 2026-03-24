"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CartonBreakdown } from "@/src/components/received-po/CartonBreakdown";
import { DocumentCard } from "@/src/components/received-po/DocumentCard";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  type BarcodeJob,
  type Invoice,
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
import { listStickerTemplates, type StickerTemplate } from "@/src/lib/sticker-templates";
import {
  buildCartonDrafts,
  type CartonDraftState,
  formatDocumentCurrency,
} from "@/src/lib/received-po-ui";

interface ReceivedPODocumentsViewProps {
  receivedPoId: string;
}

export function ReceivedPODocumentsView({
  receivedPoId,
}: ReceivedPODocumentsViewProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTemplateId = searchParams.get("templateId");
  const [receivedPO, setReceivedPO] = useState<ReceivedPO | null>(null);
  const [barcodeJob, setBarcodeJob] = useState<BarcodeJob | null>(null);
  const [stickerTemplates, setStickerTemplates] = useState<StickerTemplate[]>([]);
  const [selectedBarcodeTemplate, setSelectedBarcodeTemplate] = useState<string>("styli");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [grossWeight, setGrossWeight] = useState("");
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

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const [nextReceivedPO, nextBarcodeJob, nextInvoice, nextPackingList, nextTemplates] =
          await Promise.all([
            getReceivedPO(receivedPoId),
            getOptionalBarcodeJob(receivedPoId),
            getOptionalInvoice(receivedPoId),
            getOptionalPackingList(receivedPoId),
            listStickerTemplates(),
          ]);
        if (!active) {
          return;
        }
        const defaultTemplateId = nextTemplates.find((template) => template.is_default)?.id ?? null;
        setReceivedPO(nextReceivedPO);
        setBarcodeJob(nextBarcodeJob);
        setStickerTemplates(nextTemplates);
        setSelectedBarcodeTemplate(
          requestedTemplateId &&
            nextTemplates.some((template) => template.id === requestedTemplateId)
            ? requestedTemplateId
            : (nextBarcodeJob?.template_id ?? defaultTemplateId ?? "styli"),
        );
        setInvoice(nextInvoice);
        setGrossWeight(nextInvoice?.gross_weight?.toString() ?? "");
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
    if (!barcodeJob || !["pending", "generating"].includes(barcodeJob.status)) {
      return undefined;
    }
    const interval = window.setInterval(async () => {
      try {
        const nextBarcodeJob = await getOptionalBarcodeJob(receivedPoId);
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
  }, [barcodeJob, receivedPoId]);

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
          if (nextInvoice.status === "final") {
            setWorkingKey(null);
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

  const handleGenerateBarcodes = async (): Promise<void> => {
    try {
      setWorkingKey("barcodes");
      setError(null);
      setStatusLine(null);
      await createBarcodeJob(
        receivedPoId,
        selectedBarcodeTemplate === "styli"
          ? { template_kind: "styli" }
          : { template_kind: "custom", template_id: selectedBarcodeTemplate },
      );
      const nextStatus = await getOptionalBarcodeJob(receivedPoId);
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
      setWorkingKey("invoice-create");
      setError(null);
      const nextInvoice = await createInvoiceDraft(receivedPoId);
      setInvoice(nextInvoice);
      setGrossWeight(nextInvoice.gross_weight?.toString() ?? "");
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
      });
      setInvoice(nextInvoice);
      setStatusLine("Invoice gross weight saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update invoice weight.");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleGenerateInvoicePdf = async (): Promise<void> => {
    try {
      setWorkingKey("invoice-pdf");
      setError(null);
      const ensuredInvoice = invoice ?? (await createInvoiceDraft(receivedPoId));
      setInvoice(ensuredInvoice);
      await generateInvoicePdf(receivedPoId);
      setStatusLine("Invoice PDF generation started.");
    } catch (nextError) {
      setWorkingKey(null);
      setError(nextError instanceof Error ? nextError.message : "Failed to generate invoice PDF.");
    }
  };

  const handleCreatePackingList = async (): Promise<void> => {
    try {
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
      setWorkingKey("packing-list-pdf");
      setError(null);
      if (!packingList) {
        await handleCreatePackingList();
      }
      await generatePackingListPdf(receivedPoId);
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
          <Card className="p-5 text-sm text-kira-darkgray">Loading document workspace...</Card>
        ) : null}
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        {statusLine ? <Card className="p-4 text-sm text-kira-darkgray">{statusLine}</Card> : null}

        <div className="grid gap-5 xl:grid-cols-3">
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
            <div className="space-y-3 text-sm text-kira-darkgray">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-kira-brown/10 px-2 py-1 text-xs font-medium uppercase tracking-[0.08em] text-kira-brown">
                  {selectedBarcodeTemplate === "styli" ? "Styli format" : "Custom template"}
                </span>
                {barcodeJob?.total_pages ? <span>{barcodeJob.total_pages} page(s)</span> : null}
              </div>
              <label className="block">
                <span className="mb-1 block text-kira-darkgray">Sticker template</span>
                <select
                  className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "__create_new__") {
                      router.push(
                        `/dashboard/sticker-builder?returnTo=${encodeURIComponent(
                          `/dashboard/received-pos/${receivedPoId}/documents`,
                        )}&preset=styli`,
                      );
                      return;
                    }
                    setSelectedBarcodeTemplate(value);
                  }}
                  value={selectedBarcodeTemplate}
                >
                  <option value="styli">
                    Styli format
                    {receivedPO?.distributor?.toLowerCase().includes("styli")
                      ? " (PO default)"
                      : ""}
                  </option>
                  {stickerTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default ? " (Default)" : ""}
                    </option>
                  ))}
                  <option value="__create_new__">Create new template...</option>
                </select>
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

          <DocumentCard
            actions={
              <>
                {!invoice ? (
                  <Button disabled={workingKey === "invoice-create"} onClick={handleCreateInvoice}>
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
                : "Create a draft invoice from the confirmed PO."
            }
            status={invoice?.status ?? "not created"}
            title="Invoice"
          >
            {invoice ? (
              <div className="space-y-3 text-sm text-kira-darkgray">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">
                      Subtotal
                    </p>
                    <p className="mt-1 text-kira-black">
                      {formatDocumentCurrency(invoice.subtotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">IGST</p>
                    <p className="mt-1 text-kira-black">
                      {formatDocumentCurrency(invoice.igst_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">Total</p>
                    <p className="mt-1 text-kira-black">
                      {formatDocumentCurrency(invoice.total_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block flex-1 text-sm">
                    <span className="mb-1 block text-kira-darkgray">Gross weight (kg)</span>
                    <input
                      className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-white px-3 py-2"
                      min="0"
                      onChange={(event) => setGrossWeight(event.target.value)}
                      step="0.01"
                      type="number"
                      value={grossWeight}
                    />
                  </label>
                  <Button
                    disabled={workingKey === "invoice-weight"}
                    onClick={handleSaveGrossWeight}
                    variant="secondary"
                  >
                    Save weight
                  </Button>
                </div>
              </div>
            ) : null}
          </DocumentCard>

          <DocumentCard
            actions={
              <>
                {!packingList ? (
                  <Button
                    disabled={workingKey === "packing-list-create"}
                    onClick={handleCreatePackingList}
                  >
                    {workingKey === "packing-list-create" ? "Creating..." : "Generate packing list"}
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
                ? `${packingList.cartons.length} cartons · ${totalPieces} pieces`
                : "Create carton assignments from the confirmed PO."
            }
            status={packingList?.status ?? "not created"}
            title="Packing list"
          >
            {packingList ? (
              <CartonBreakdown
                cartons={packingList.cartons}
                drafts={cartonDrafts}
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
            ) : null}
          </DocumentCard>
        </div>
      </div>
    </DashboardShell>
  );
}
