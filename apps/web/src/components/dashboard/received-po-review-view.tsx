"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { LineItemsTable } from "@/src/components/received-po/LineItemsTable";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  type ReceivedPO,
  type ReceivedPOHeaderInput,
  type ReceivedPOLineItemInput,
  confirmReceivedPO,
  getReceivedPO,
  updateReceivedPOHeader,
  updateReceivedPOItems,
} from "@/src/lib/received-po";
import { getTotalQuantity, toEditableLineItems, toHeaderDraft } from "@/src/lib/received-po-ui";

interface ReceivedPOReviewViewProps {
  receivedPoId: string;
}

export function ReceivedPOReviewView({ receivedPoId }: ReceivedPOReviewViewProps): JSX.Element {
  const [record, setRecord] = useState<ReceivedPO | null>(null);
  const [headerDraft, setHeaderDraft] = useState<ReceivedPOHeaderInput>({});
  const [itemDrafts, setItemDrafts] = useState<ReceivedPOLineItemInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getReceivedPO(receivedPoId)
      .then((response) => {
        if (!active) {
          return;
        }
        setRecord(response);
        setHeaderDraft(toHeaderDraft(response));
        setItemDrafts(toEditableLineItems(response));
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load received PO.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [receivedPoId]);

  const totalQuantity = useMemo(() => getTotalQuantity(itemDrafts), [itemDrafts]);
  const editable = record?.status !== "confirmed";

  const handleSaveHeader = async (): Promise<void> => {
    try {
      setSavingHeader(true);
      setError(null);
      setMessage(null);
      const updated = await updateReceivedPOHeader(receivedPoId, headerDraft);
      setRecord(updated);
      setMessage("PO header saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save PO header.");
    } finally {
      setSavingHeader(false);
    }
  };

  const handleSaveItems = async (): Promise<void> => {
    try {
      setSavingItems(true);
      setError(null);
      setMessage(null);
      const updated = await updateReceivedPOItems(receivedPoId, itemDrafts);
      setRecord(updated);
      setItemDrafts(toEditableLineItems(updated));
      setMessage("Line items saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save line items.");
    } finally {
      setSavingItems(false);
    }
  };

  const handleConfirm = async (): Promise<void> => {
    try {
      setConfirming(true);
      setError(null);
      setMessage(null);
      await confirmReceivedPO(receivedPoId);
      const refreshed = await getReceivedPO(receivedPoId);
      setRecord(refreshed);
      setHeaderDraft(toHeaderDraft(refreshed));
      setMessage("Received PO confirmed. Fields are now locked.");
    } catch (confirmError) {
      setError(
        confirmError instanceof Error ? confirmError.message : "Failed to confirm received PO.",
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <DashboardShell
      subtitle="Review parsed PO fields, make corrections, and lock the PO before document generation."
      title="Review Received PO"
    >
      <div className="space-y-6 pb-28">
        {loading ? (
          <Card className="p-5 text-sm text-kira-darkgray">Loading PO review...</Card>
        ) : null}
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        {message ? <Card className="p-4 text-sm text-kira-darkgray">{message}</Card> : null}

        {record ? (
          <>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">PO header</p>
                  <h2 className="mt-2 text-xl font-semibold text-kira-black">
                    {record.po_number || "Untitled PO"}
                  </h2>
                </div>
                {editable ? (
                  <Button disabled={savingHeader} onClick={handleSaveHeader} variant="secondary">
                    {savingHeader ? "Saving..." : "Save header"}
                  </Button>
                ) : (
                  <Link href={`/dashboard/received-pos/${receivedPoId}/documents`}>
                    <Button>Open documents</Button>
                  </Link>
                )}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-kira-darkgray">PO number</span>
                  <input
                    className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-transparent px-3 py-2"
                    disabled={!editable}
                    onChange={(event) =>
                      setHeaderDraft((current) => ({ ...current, po_number: event.target.value }))
                    }
                    value={headerDraft.po_number ?? ""}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-kira-darkgray">PO date</span>
                  <input
                    className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-transparent px-3 py-2"
                    disabled={!editable}
                    onChange={(event) =>
                      setHeaderDraft((current) => ({ ...current, po_date: event.target.value }))
                    }
                    type="date"
                    value={headerDraft.po_date ?? ""}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-kira-darkgray">Distributor</span>
                  <input
                    className="kira-focus-ring w-full rounded-md border border-kira-warmgray/35 bg-transparent px-3 py-2"
                    disabled={!editable}
                    onChange={(event) =>
                      setHeaderDraft((current) => ({ ...current, distributor: event.target.value }))
                    }
                    value={headerDraft.distributor ?? ""}
                  />
                </label>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">
                    Line items
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-kira-black">
                    {itemDrafts.length} extracted rows
                  </h2>
                </div>
                {editable ? (
                  <Button disabled={savingItems} onClick={handleSaveItems} variant="secondary">
                    {savingItems ? "Saving..." : "Save line items"}
                  </Button>
                ) : null}
              </div>
              <div className="mt-5">
                <LineItemsTable editable={editable} items={itemDrafts} onChange={setItemDrafts} />
              </div>
            </Card>
          </>
        ) : null}
      </div>

      {record ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-kira-warmgray/35 bg-kira-offwhite/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div className="text-sm text-kira-darkgray">
              {itemDrafts.length} line items · {totalQuantity} pieces total
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {record.status === "confirmed" ? (
                <Link href={`/dashboard/received-pos/${receivedPoId}/documents`}>
                  <Button>Confirmed. Open documents</Button>
                </Link>
              ) : (
                <Button disabled={confirming || itemDrafts.length === 0} onClick={handleConfirm}>
                  {confirming ? "Confirming..." : "Confirm PO data"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
