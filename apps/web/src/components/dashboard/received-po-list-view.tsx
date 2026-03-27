"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { type ReceivedPOListItem, listReceivedPOs } from "@/src/lib/received-po";
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

  return (
    <DashboardShell
      subtitle="Review uploaded marketplace POs and move into barcode, invoice, and packing workflows."
      title="Received POs"
    >
      <div className="space-y-6">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-kira-darkgray">
              Upload once, then review, confirm, and generate all downstream documents.
            </p>
          </div>
          <Link href="/dashboard/received-pos/upload">
            <Button>Upload PO</Button>
          </Link>
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
