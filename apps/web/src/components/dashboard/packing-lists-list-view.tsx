"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import {
  listPackingLists,
  resolveFileUrl,
  type PackingListListItem,
} from "@/src/lib/packing-lists";

function formatDate(value: string): string {
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

export function PackingListsListView(): JSX.Element {
  const [items, setItems] = useState<PackingListListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const response = await listPackingLists();
        if (!active) {
          return;
        }
        setItems(response.items);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load packing lists.");
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
      subtitle="Track generated packing lists, jump back to the source PO, and download final PDFs."
      title="Packing Lists"
    >
      <div className="space-y-5">
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-kira-warmgray/25 text-sm">
              <thead className="bg-kira-warmgray/10 text-left text-xs uppercase tracking-[0.12em] text-kira-midgray">
                <tr>
                  <th className="px-4 py-3">Invoice number</th>
                  <th className="px-4 py-3">PO number</th>
                  <th className="px-4 py-3">Invoice date</th>
                  <th className="px-4 py-3">Cartons</th>
                  <th className="px-4 py-3">Total pieces</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kira-warmgray/15 text-kira-darkgray">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      Loading packing lists...
                    </td>
                  </tr>
                ) : null}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      No packing lists yet.
                    </td>
                  </tr>
                ) : null}
                {items.map((pl) => (
                  <tr key={pl.id}>
                    <td className="px-4 py-3 font-medium text-kira-black">
                      {pl.invoice_number ?? "-"}
                    </td>
                    <td className="px-4 py-3">{pl.po_number ?? "-"}</td>
                    <td className="px-4 py-3">{formatDate(pl.invoice_date ?? pl.created_at)}</td>
                    <td className="px-4 py-3">{pl.carton_count}</td>
                    <td className="px-4 py-3">{pl.total_pieces}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-kira-warmgray/20 px-2 py-1 text-xs uppercase tracking-[0.1em]">
                        {pl.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          className={cn(
                            "kira-focus-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-150",
                            "border border-kira-darkgray bg-transparent text-kira-darkgray hover:bg-kira-warmgray/18 active:bg-kira-warmgray/28",
                          )}
                          href={`/dashboard/received-pos/${pl.received_po_id}/documents`}
                        >
                          View details
                        </Link>
                        <Button
                          disabled={!pl.file_url}
                          onClick={() => {
                            const resolved = resolveFileUrl(pl.file_url);
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
                          href={`/dashboard/received-pos/${pl.received_po_id}`}
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
