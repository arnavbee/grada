"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { type ReceivedPOListItem, listReceivedPOs, uploadReceivedPO } from "@/src/lib/received-po";
import { formatReceivedPODate, getReceivedPOStatusTone } from "@/src/lib/received-po-ui";

export function ReceivedPOListView(): JSX.Element {
  const [items, setItems] = useState<ReceivedPOListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listReceivedPOs()
      .then((response) => {
        if (!active) {
          return;
        }
        setItems(response.items);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load received POs.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const [uploadingSample, setUploadingSample] = useState(false);
  const router = useRouter();

  const handleTrySamplePO = async (): Promise<void> => {
    try {
      setUploadingSample(true);
      setError(null);
      const res = await fetch("/files/sample-po.xlsx");
      if (!res.ok) throw new Error("Could not find sample PO file.");
      const blob = await res.blob();
      const sampleFile = new File([blob], "70058628_HOR_PO-sample.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const response = await uploadReceivedPO(sampleFile);
      router.push(`/dashboard/received-pos/${response.received_po_id}`);
    } catch (err) {
      setUploadingSample(false);
      setError(err instanceof Error ? err.message : "Failed to load sample PO.");
    }
  };

  return (
    <DashboardShell
      subtitle="Review uploaded marketplace POs and move into barcode, invoice, and packing workflows."
      title="Received POs"
    >
      <div className="space-y-6">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5 bg-amber-500/5 border-amber-500/30">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              <span>✦</span>
              <span>Test AI PO Parsing</span>
            </div>
            <p className="mt-1 text-sm text-kira-darkgray">
              Upload an official marketplace PO, or test instant parsing with our preloaded sample
              PO.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="kira-focus-ring rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50 transition-colors"
              disabled={uploadingSample}
              onClick={() => void handleTrySamplePO()}
              type="button"
            >
              {uploadingSample ? "Parsing Sample PO..." : "Try with Sample PO →"}
            </button>
            <Link href="/dashboard/received-pos/upload">
              <Button variant="secondary">Upload PO</Button>
            </Link>
          </div>
        </Card>

        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}

        {loading ? (
          <Card className="p-5 text-sm text-kira-darkgray">Loading received POs...</Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center">
            <h2>No received POs yet</h2>
            <p className="mt-2 text-kira-darkgray">
              Start by uploading the official marketplace PO you received back from the buyer.
            </p>
            <Link className="mt-5 inline-block" href="/dashboard/received-pos/upload">
              <Button>Upload first PO</Button>
            </Link>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-kira-warmgray/18 text-left text-kira-darkgray">
                <tr>
                  <th className="px-4 py-3 font-semibold">PO number</th>
                  <th className="px-4 py-3 font-semibold">Distributor</th>
                  <th className="px-4 py-3 font-semibold">PO date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Line items</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-t border-kira-warmgray/25" key={item.id}>
                    <td className="px-4 py-3 text-kira-black">
                      {item.po_number || "Pending parse"}
                    </td>
                    <td className="px-4 py-3 text-kira-darkgray">{item.distributor}</td>
                    <td className="px-4 py-3 text-kira-darkgray">
                      {formatReceivedPODate(item.po_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getReceivedPOStatusTone(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-kira-darkgray">{item.line_item_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/dashboard/received-pos/${item.id}`}>
                          <Button variant="secondary">Review</Button>
                        </Link>
                        <Link href={`/dashboard/received-pos/${item.id}/documents`}>
                          <Button variant="text">Documents</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
