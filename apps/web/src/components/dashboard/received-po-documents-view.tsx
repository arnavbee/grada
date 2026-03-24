"use client";

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
  const [barcodeJob, setBarcodeJob] = useState<BarcodeJob | null>(null);
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
        await getReceivedPO(receivedPoId);
        const [nextBarcodeJob, nextInvoice, nextPackingList] = await Promise.all([
          getOptionalBarcodeJob(receivedPoId),
          getOptionalInvoice(receivedPoId),
          getOptionalPackingList(receivedPoId),
        ]);
        if (!active) {
          return;
        }
        setBarcodeJob(nextBarcodeJob);
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
  }, [receivedPoId]);

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
      await createBarcodeJob(receivedPoId);
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
          />

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
