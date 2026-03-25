"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { listBarcodes, resolveFileUrl, type BarcodeListItem } from "@/src/lib/barcodes";

function formatBarcodeDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function templateLabel(item: BarcodeListItem): string {
  if (item.template_kind === "styli") {
    return "Styli format";
  }
  return item.template_id ? "Custom template" : "Custom";
}

export function BarcodesListView(): JSX.Element {
  const [items, setItems] = useState<BarcodeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const response = await listBarcodes();
        if (!active) {
          return;
        }
        setItems(response.items);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load barcode sheets.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardShell
      subtitle="Review generated barcode sheets, jump back to the source PO, and download ready-to-print sticker PDFs."
      title="Barcodes"
    >
      <div className="space-y-5">
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-kira-warmgray/25 text-sm">
              <thead className="bg-kira-warmgray/10 text-left text-xs uppercase tracking-[0.12em] text-kira-midgray">
                <tr>
                  <th className="px-4 py-3">PO number</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Stickers</th>
                  <th className="px-4 py-3">Pages</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kira-warmgray/15 text-kira-darkgray">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      Loading barcode sheets...
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      No barcode sheets yet.
                    </td>
                  </tr>
                ) : null}
                {items.map((barcode) => (
                  <tr key={barcode.id}>
                    <td className="px-4 py-3 font-medium text-kira-black">
                      {barcode.po_number ?? "-"}
                    </td>
                    <td className="px-4 py-3">{templateLabel(barcode)}</td>
                    <td className="px-4 py-3">{formatBarcodeDate(barcode.created_at)}</td>
                    <td className="px-4 py-3">{barcode.total_stickers}</td>
                    <td className="px-4 py-3">{barcode.total_pages}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-kira-warmgray/20 px-2 py-1 text-xs uppercase tracking-[0.1em]">
                        {barcode.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          className={cn(
                            "kira-focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150",
                            "border border-kira-darkgray bg-transparent text-kira-darkgray hover:bg-kira-warmgray/18 active:bg-kira-warmgray/28",
                          )}
                          href={`/dashboard/received-pos/${barcode.received_po_id}/documents`}
                        >
                          View details
                        </Link>
                        <Button
                          disabled={!barcode.file_url}
                          onClick={() => {
                            const resolved = resolveFileUrl(barcode.file_url);
                            if (resolved) {
                              window.open(resolved, "_blank", "noopener,noreferrer");
                            }
                          }}
                          variant="secondary"
                        >
                          Download PDF
                        </Button>
                        <Link
                          className={cn(
                            "kira-focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150",
                            "border border-kira-darkgray bg-transparent text-kira-darkgray hover:bg-kira-warmgray/18 active:bg-kira-warmgray/28",
                          )}
                          href={`/dashboard/received-pos/${barcode.received_po_id}`}
                        >
                          View PO
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
