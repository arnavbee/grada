"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { apiRequest } from "@/src/lib/api-client";
import type { PORequestResponse } from "@/src/lib/po-builder";

interface PORequestListResponse {
  items: PORequestResponse[];
  total: number;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: PORequestResponse["status"]): string {
  switch (status) {
    case "draft":
      return "bg-kira-warmgray/25 text-kira-darkgray";
    case "analyzing":
      return "bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-100";
    case "ready":
    case "generated":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-300/20 dark:text-emerald-100";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-300/20 dark:text-red-100";
    default:
      return "bg-kira-warmgray/25 text-kira-darkgray";
  }
}

function getStatusLabel(status: PORequestResponse["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "analyzing":
      return "AI Review";
    case "ready":
      return "Ready";
    case "generated":
      return "Exported";
    case "failed":
      return "Needs Fix";
    default:
      return status;
  }
}

export function POBuilderListView(): JSX.Element {
  const [requests, setRequests] = useState<PORequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const response = await apiRequest<PORequestListResponse>("/po-requests?limit=50", {
          method: "GET",
        });
        if (!active) {
          return;
        }
        setRequests(response.items ?? []);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load PO builders.");
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

  async function handleDeleteRequest(requestId: string): Promise<void> {
    if (
      !window.confirm(
        "Delete this workbook? This will remove its styles, rows, and export history.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(requestId);
      setError(null);
      await apiRequest<void>(`/po-requests/${requestId}`, {
        method: "DELETE",
      });
      setRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete workbook.");
    } finally {
      setDeletingId(null);
    }
  }

  const summary = useMemo(() => {
    return {
      drafts: requests.filter((request) => request.status === "draft").length,
      analyzing: requests.filter((request) => request.status === "analyzing").length,
      ready: requests.filter(
        (request) => request.status === "ready" || request.status === "generated",
      ).length,
    };
  }, [requests]);

  return (
    <DashboardShell
      title="PO Format Builder"
      subtitle="Manage workbook drafts, resume in-flight builders, and jump back into review or export."
    >
      <div className="space-y-6">
        {error ? <Card className="p-4 text-sm text-kira-warmgray">{error}</Card> : null}

        <Card className="rounded-[30px] border border-kira-warmgray/45 bg-[linear-gradient(135deg,rgba(244,239,232,0.9),rgba(255,255,255,1))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,31,27,0.96),rgba(15,21,18,0.92))]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-kira-midgray">
                Workbook history
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-kira-black">
                Treat PO builders like working files, not one-off exports.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-kira-darkgray">
                Every builder is now resumable. Start a new workbook, return to drafts, or reopen
                builders that are already ready for export.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/po-builder/new">
                  <Button>Start new builder</Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-[22px] border border-kira-warmgray/45 bg-kira-offwhite/60 p-4 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">Drafts</p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : summary.drafts}
                </p>
              </Card>
              <Card className="rounded-[22px] border border-kira-warmgray/45 bg-kira-offwhite/60 p-4 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">AI Review</p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : summary.analyzing}
                </p>
              </Card>
              <Card className="rounded-[22px] border border-kira-warmgray/45 bg-kira-offwhite/60 p-4 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.16em] text-kira-midgray">Ready</p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : summary.ready}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-5 text-sm text-kira-darkgray">Loading PO builders...</Card>
        ) : null}

        {!loading && requests.length === 0 ? (
          <Card className="rounded-[28px] p-6">
            <h2 className="text-2xl font-semibold text-kira-black">No workbooks yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-kira-darkgray">
              Start your first PO builder from approved catalog styles. Once created, every workbook
              will show up here so your team can continue drafts and revisit ready exports.
            </p>
            <div className="mt-5">
              <Link href="/dashboard/po-builder/new">
                <Button>Start first builder</Button>
              </Link>
            </div>
          </Card>
        ) : null}

        {!loading && requests.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {requests.map((request) => (
              <Card className="rounded-[28px] border border-kira-warmgray/45 p-6" key={request.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                      Builder {request.id.slice(0, 8)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-kira-black">
                      {request.items.length} style{request.items.length === 1 ? "" : "s"} ·{" "}
                      {request.rows.length} row
                      {request.rows.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-2 text-sm text-kira-darkgray">
                      Created {formatDate(request.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${getStatusTone(request.status)}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {request.items.slice(0, 3).map((item) => (
                    <span
                      className="rounded-full bg-kira-warmgray/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-kira-darkgray"
                      key={item.id}
                    >
                      {item.product?.sku || item.product_id.slice(0, 8)}
                    </span>
                  ))}
                  {request.items.length > 3 ? (
                    <span className="rounded-full bg-kira-warmgray/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-kira-darkgray">
                      +{request.items.length - 3} more
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/dashboard/po-builder/${request.id}`}>
                    <Button>
                      {request.status === "ready" || request.status === "generated"
                        ? "Open export"
                        : "Resume builder"}
                    </Button>
                  </Link>
                  <Link href={`/dashboard/po-builder/${request.id}`}>
                    <Button variant="secondary">
                      {request.status === "analyzing" ? "Check AI review" : "View details"}
                    </Button>
                  </Link>
                  <Button
                    disabled={deletingId === request.id}
                    onClick={() => void handleDeleteRequest(request.id)}
                    variant="secondary"
                  >
                    {deletingId === request.id ? "Deleting..." : "Delete workbook"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
