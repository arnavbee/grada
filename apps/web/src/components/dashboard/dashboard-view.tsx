"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { apiRequest } from "@/src/lib/api-client";
import { getBrandProfile, listCartonRules } from "@/src/lib/settings";

interface TotalResponse {
  total: number;
}

interface DashboardStats {
  catalogReady: number;
  catalogNeedsReview: number;
  poDrafts: number;
  poAnalyzing: number;
  poReady: number;
  receivedUploaded: number;
  receivedParsed: number;
  receivedConfirmed: number;
  cartonRules: number;
  brandProfileCompletion: number;
}

interface ActionCard {
  title: string;
  detail: string;
  href: string;
  badge: string;
  variant?: "primary" | "secondary";
}

interface ModuleCard {
  title: string;
  detail: string;
  href: string;
  metrics: string[];
  cta: string;
}

interface AttentionItem {
  title: string;
  detail: string;
  href: string;
}

const EMPTY_STATS: DashboardStats = {
  catalogReady: 0,
  catalogNeedsReview: 0,
  poDrafts: 0,
  poAnalyzing: 0,
  poReady: 0,
  receivedUploaded: 0,
  receivedParsed: 0,
  receivedConfirmed: 0,
  cartonRules: 0,
  brandProfileCompletion: 0,
};

function getCompletionPercent(profile: Awaited<ReturnType<typeof getBrandProfile>>): number {
  const fields = [
    profile.supplier_name,
    profile.address,
    profile.gst_number,
    profile.pan_number,
    profile.bill_to_address,
    profile.ship_to_address,
    profile.invoice_prefix,
  ];
  const completed = fields.filter((value) => value.trim().length > 0).length;
  return Math.round((completed / fields.length) * 100);
}

async function fetchTotal(path: string): Promise<number> {
  const response = await apiRequest<TotalResponse>(path, { method: "GET" });
  return response.total ?? 0;
}

function QuickActionCard({
  title,
  detail,
  href,
  badge,
  variant = "secondary",
}: ActionCard): JSX.Element {
  return (
    <Card className="flex h-full flex-col justify-between rounded-[28px] border border-kira-warmgray/50 p-5">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">{badge}</p>
        </div>
        <h2 className="text-xl font-semibold text-kira-black">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-kira-darkgray">{detail}</p>
      </div>
      <Link className="mt-6 inline-block" href={href}>
        <Button className="px-5" variant={variant}>
          Open
        </Button>
      </Link>
    </Card>
  );
}

export function DashboardView(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const [
          catalogReady,
          catalogNeedsReview,
          poDrafts,
          poAnalyzing,
          poReady,
          receivedUploaded,
          receivedParsed,
          receivedConfirmed,
          brandProfile,
          cartonRules,
        ] = await Promise.all([
          fetchTotal("/catalog/products?status=ready&limit=1"),
          fetchTotal("/catalog/products?status=needs_review&limit=1"),
          fetchTotal("/po-requests?status=draft&limit=1"),
          fetchTotal("/po-requests?status=analyzing&limit=1"),
          fetchTotal("/po-requests?status=ready&limit=1"),
          fetchTotal("/received-pos?status=uploaded&limit=1"),
          fetchTotal("/received-pos?status=parsed&limit=1"),
          fetchTotal("/received-pos?status=confirmed&limit=1"),
          getBrandProfile(),
          listCartonRules(),
        ]);

        if (!active) {
          return;
        }

        setStats({
          catalogReady,
          catalogNeedsReview,
          poDrafts,
          poAnalyzing,
          poReady,
          receivedUploaded,
          receivedParsed,
          receivedConfirmed,
          cartonRules: cartonRules.length,
          brandProfileCompletion: getCompletionPercent(brandProfile),
        });
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
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

  const quickActions = useMemo<ActionCard[]>(() => {
    return [
      {
        title: "Start Catalog Setup",
        detail:
          stats.catalogReady > 0 || stats.catalogNeedsReview > 0
            ? `${stats.catalogReady} ready style${stats.catalogReady === 1 ? "" : "s"} in catalog. Add or review items before PO building.`
            : "Add items in catalog first so PO Builder has approved styles to work from.",
        href: "/dashboard/catalog",
        badge: "Start here",
        variant: "primary",
      },
      {
        title: "Continue PO Builder",
        detail:
          stats.poDrafts > 0
            ? `${stats.poDrafts} builder draft${stats.poDrafts === 1 ? "" : "s"} waiting for style setup or review.`
            : "Step 2: build PO workbooks after catalog items are ready.",
        href: stats.poDrafts > 0 ? "/dashboard/po-builder" : "/dashboard/po-builder/new",
        badge:
          stats.poDrafts > 0
            ? `${stats.poDrafts} draft${stats.poDrafts === 1 ? "" : "s"}`
            : "Step 2",
      },
      {
        title: "Review Received POs",
        detail:
          stats.receivedParsed > 0
            ? `${stats.receivedParsed} received PO${stats.receivedParsed === 1 ? "" : "s"} parsed and ready for confirmation.`
            : "Separate function: upload and confirm official marketplace POs independently of PO Builder.",
        href: "/dashboard/received-pos",
        badge:
          stats.receivedParsed > 0 ? `${stats.receivedParsed} awaiting confirm` : "Separate lane",
      },
      {
        title: "Finish Documents",
        detail:
          stats.receivedConfirmed > 0
            ? `${stats.receivedConfirmed} confirmed PO${stats.receivedConfirmed === 1 ? "" : "s"} can move into barcode, invoice, and packing.`
            : "Barcode, invoice, and packing are downstream docs generated after received PO confirmation.",
        href: "/dashboard/received-pos",
        badge: stats.receivedConfirmed > 0 ? `${stats.receivedConfirmed} ready` : "Documents",
      },
      {
        title: "Complete Settings Setup",
        detail:
          stats.brandProfileCompletion < 100 || stats.cartonRules === 0
            ? "Fill out brand identity, invoice defaults, PO builder defaults, and packing rules."
            : "Your operational defaults are set. Review them whenever workflows change.",
        href: "/dashboard/settings",
        badge:
          stats.brandProfileCompletion < 100 || stats.cartonRules === 0
            ? `${stats.brandProfileCompletion}% configured`
            : "Configured",
      },
    ];
  }, [stats]);

  const moduleCards = useMemo<ModuleCard[]>(() => {
    return [
      {
        title: "Catalog",
        detail: "Approved styles and review queues that feed every downstream workflow.",
        href: "/dashboard/catalog",
        metrics: [`${stats.catalogReady} ready styles`, `${stats.catalogNeedsReview} need review`],
        cta: "Open catalog",
      },
      {
        title: "PO Format Builder",
        detail:
          "Build export-ready workbooks from styles, colorways, ratios, and AI-reviewed attributes.",
        href: "/dashboard/po-builder",
        metrics: [
          `${stats.poDrafts} drafts`,
          `${stats.poAnalyzing} in AI review`,
          `${stats.poReady} ready to export`,
        ],
        cta: "Open builder",
      },
      {
        title: "Received POs",
        detail:
          "Separate function: review returned marketplace POs, then generate barcode, invoice, and packing outputs.",
        href: "/dashboard/received-pos",
        metrics: [
          `${stats.receivedUploaded} uploaded`,
          `${stats.receivedParsed} parsed`,
          `${stats.receivedConfirmed} confirmed`,
        ],
        cta: "Open received POs",
      },
      {
        title: "Settings",
        detail: "Control brand identity, builder defaults, invoice defaults, and carton rules.",
        href: "/dashboard/settings",
        metrics: [
          `${stats.brandProfileCompletion}% profile complete`,
          `${stats.cartonRules} carton rules`,
        ],
        cta: "Open settings",
      },
    ];
  }, [stats]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (stats.catalogNeedsReview > 0) {
      items.push({
        title: "Catalog styles need review",
        detail: `${stats.catalogNeedsReview} product${stats.catalogNeedsReview === 1 ? "" : "s"} still need catalog cleanup before they are safe to use downstream.`,
        href: "/dashboard/catalog",
      });
    }
    if (stats.poAnalyzing > 0) {
      items.push({
        title: "PO builders are still in AI review",
        detail: `${stats.poAnalyzing} builder${stats.poAnalyzing === 1 ? "" : "s"} are waiting for AI extraction or manual attribute checks.`,
        href: "/dashboard/po-builder",
      });
    }
    if (stats.poReady > 0) {
      items.push({
        title: "Workbook exports are ready",
        detail: `${stats.poReady} builder${stats.poReady === 1 ? "" : "s"} are ready to download as workbooks.`,
        href: "/dashboard/po-builder",
      });
    }
    if (stats.receivedParsed > 0) {
      items.push({
        title: "Received POs need confirmation",
        detail: `${stats.receivedParsed} parsed PO${stats.receivedParsed === 1 ? "" : "s"} should be reviewed and confirmed before documents can be generated.`,
        href: "/dashboard/received-pos",
      });
    }
    if (stats.brandProfileCompletion < 100 || stats.cartonRules === 0) {
      items.push({
        title: "Operational defaults are incomplete",
        detail:
          "Complete brand, invoice, builder, and packing settings so downstream documents use the right defaults.",
        href: "/dashboard/settings",
      });
    }
    if (items.length === 0) {
      items.push({
        title: "No blockers right now",
        detail:
          "Core workflows are clear. The best next move is usually starting a new PO builder or uploading the next received PO.",
        href: "/dashboard/po-builder/new",
      });
    }
    return items;
  }, [stats]);

  return (
    <DashboardShell
      subtitle="A workflow command center for catalog readiness, PO creation, received PO review, and document generation."
      title="Dashboard"
    >
      <div className="space-y-6">
        {error ? (
          <Card className="border border-kira-warmgray/45 p-4 text-sm text-kira-warmgray">
            {error}
          </Card>
        ) : null}

        <Card className="overflow-hidden rounded-[32px] border border-kira-warmgray/45 bg-[linear-gradient(135deg,rgba(247,242,236,1),rgba(255,255,255,1),rgba(237,227,216,0.78))] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-kira-midgray">
                Operations command center
              </p>
              <h1 className="mt-3 font-sans text-4xl leading-tight text-kira-black">
                Run the real workflows from one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-kira-darkgray">
                This dashboard now reflects the product you actually have: catalog readiness, PO
                workbook creation, received PO processing, and operational defaults that drive
                document generation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard/catalog">
                  <Button>Add items in catalog</Button>
                </Link>
                <Link href="/dashboard/po-builder/new">
                  <Button variant="secondary">Then build PO workbook</Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-[24px] border border-kira-warmgray/45 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                  Catalog ready
                </p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : stats.catalogReady}
                </p>
                <p className="mt-2 text-sm text-kira-darkgray">Styles ready to feed the builder</p>
              </Card>
              <Card className="rounded-[24px] border border-kira-warmgray/45 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                  Builder exports
                </p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : stats.poReady}
                </p>
                <p className="mt-2 text-sm text-kira-darkgray">PO workbooks ready to download</p>
              </Card>
              <Card className="rounded-[24px] border border-kira-warmgray/45 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                  Need confirmation
                </p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : stats.receivedParsed}
                </p>
                <p className="mt-2 text-sm text-kira-darkgray">Received POs waiting for review</p>
              </Card>
              <Card className="rounded-[24px] border border-kira-warmgray/45 bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                  Settings readiness
                </p>
                <p className="mt-2 text-3xl font-semibold text-kira-black">
                  {loading ? "..." : `${stats.brandProfileCompletion}%`}
                </p>
                <p className="mt-2 text-sm text-kira-darkgray">
                  Brand and invoice profile completion
                </p>
              </Card>
            </div>
          </div>
        </Card>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </section>

        <Card className="rounded-[28px] border border-kira-warmgray/45 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                Workflow pipeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-kira-black">
                See where work is moving and where it’s stuck.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Catalog review",
                value: stats.catalogNeedsReview,
                detail: "Styles needing cleanup",
                href: "/dashboard/catalog",
              },
              {
                label: "PO setup",
                value: stats.poDrafts,
                detail: "Builder drafts in progress",
                href: "/dashboard/po-builder",
              },
              {
                label: "AI review",
                value: stats.poAnalyzing,
                detail: "Builders still processing",
                href: "/dashboard/po-builder",
              },
              {
                label: "Received PO confirm",
                value: stats.receivedParsed,
                detail: "Parsed POs awaiting approval",
                href: "/dashboard/received-pos",
              },
              {
                label: "Documents ready",
                value: stats.receivedConfirmed,
                detail: "Confirmed POs ready for docs",
                href: "/dashboard/received-pos",
              },
            ].map((stage) => (
              <Link href={stage.href} key={stage.label}>
                <Card className="h-full rounded-[24px] border border-kira-warmgray/45 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">
                    {stage.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-kira-black">
                    {loading ? "..." : stage.value}
                  </p>
                  <p className="mt-2 text-sm text-kira-darkgray">{stage.detail}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Card>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {moduleCards.map((module) => (
            <Card className="rounded-[28px] border border-kira-warmgray/45 p-6" key={module.title}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-kira-black">{module.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-kira-darkgray">{module.detail}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {module.metrics.map((metric) => (
                  <span
                    className="rounded-full bg-kira-warmgray/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-kira-darkgray"
                    key={metric}
                  >
                    {loading ? "Loading..." : metric}
                  </span>
                ))}
              </div>
              <Link className="mt-6 inline-block" href={module.href}>
                <Button className="px-5" variant="secondary">
                  {module.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </section>

        <Card className="rounded-[28px] border border-kira-warmgray/45 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-kira-midgray">Attention queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-kira-black">
              Work that deserves your eyes next.
            </h2>
          </div>
          <div className="mt-6 space-y-3">
            {attentionItems.map((item) => (
              <Link
                className="block rounded-2xl border border-kira-warmgray/35 p-4 transition-colors hover:bg-kira-warmgray/12"
                href={item.href}
                key={item.title}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-kira-black">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-kira-darkgray">{item.detail}</p>
                  </div>
                  <span className="text-sm font-medium text-kira-brown">Open</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
