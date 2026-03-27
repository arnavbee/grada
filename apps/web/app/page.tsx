import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { GridBackground } from "@/src/components/GridBackground";
import { FooterBrand } from "@/src/components/FooterBrand";

const modules = [
  {
    title: "Build Your Catalog",
    detail:
      "Keep style data, imagery, measurements, and defaults in one place so your team stops rebuilding the same product details in every file.",
  },
  {
    title: "Create Buyer-Ready POs",
    detail:
      "Turn approved styles into clean colorway x size workbooks faster, with less manual cleanup before you send them out.",
  },
  {
    title: "Received PO Review",
    detail:
      "Upload the PO you get back, review extracted line items once, and lock a clean source of truth before the rest of ops starts.",
  },
  {
    title: "Generate Shipping Docs",
    detail:
      "Create barcode sheets, invoices, packing lists, and sticker outputs from the same confirmed PO instead of retyping order data again.",
  },
];

const metrics = [
  { label: "Built For", value: "Apparel ops teams" },
  { label: "Core Flow", value: "Catalog → PO → Docs" },
  { label: "Try It", value: "Open the real product" },
];

const challengeAreas = [
  "Catalog styles, imagery, and defaults in one workspace",
  "PO workbook builder with colorways, size ratios, and AI review",
  "Received PO review before barcode, invoice, and packing",
  "Reusable sticker templates and document settings",
  "Brand defaults and carton rules stored in-product",
  "Live workflow screens your team can actually click through",
];

const workflowSteps = [
  {
    title: "Build Catalog",
    detail:
      "Create clean style records with imagery, measurements, templates, and AI-assisted product enrichment.",
  },
  {
    title: "Build PO Workbook",
    detail:
      "Expand approved styles into colorways and sizes, review key attributes, and get to a clean workbook faster.",
  },
  {
    title: "Review Received PO",
    detail:
      "Upload the returned PO, review the extracted lines, and confirm the version your team will use everywhere else.",
  },
  {
    title: "Generate Docs Fast",
    detail:
      "Turn the same confirmed PO into barcode sheets, invoices, packing lists, and sticker outputs without duplicate work.",
  },
];

const contactChannels = [
  {
    label: "Create Account",
    sublabel: "Start in the product",
    href: "/signup",
  },
  {
    label: "Open Dashboard",
    sublabel: "Explore the workflow",
    href: "/dashboard",
  },
  {
    label: "Email",
    sublabel: "Ask a question",
    href: "mailto:hello@grada.com",
  },
];

const tickerItems = [
  "Less Spreadsheet Rework",
  "Cleaner PO Submission",
  "Received PO Review",
  "Barcode & Sticker Output",
  "Invoice & Packing Docs",
  "Shared Defaults & Templates",
];

const coverageBlocks = [
  {
    title: "Not just a database",
    detail:
      "Catalog styles become workbook rows, and confirmed PO data becomes documents. That handoff is already built in.",
  },
  {
    title: "Not just a template",
    detail:
      "Colorways, ratios, sticker layouts, carton rules, and brand defaults stay connected instead of living in separate files.",
  },
  {
    title: "Not just another ops tool",
    detail:
      "You review once, confirm once, and reuse approved data everywhere downstream instead of reconciling it again later.",
  },
];

const fashionMotifPrimary = [
  "Dresses",
  "Coord Sets",
  "Fabric Library",
  "Colorways",
  "Tech Pack",
  "Received POs",
];

const fashionMotifSecondary = [
  "Pattern Blocks",
  "Fit Review",
  "Size Ratios",
  "Barcode Sheets",
  "Sticker Templates",
  "Packing Ready",
];

export default function LandingPage(): JSX.Element {
  return (
    <main className="relative w-full max-w-none space-y-6 p-4 md:space-y-8 md:p-8">
      <GridBackground />
      <section className="surface-card animate-enter relative overflow-hidden p-6 md:p-10">
        <div className="kira-float-slow absolute -right-24 top-0 h-72 w-72 rounded-full bg-kira-brown/10 blur-3xl" />
        <div className="kira-float-fast absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#A6B09B]/18 blur-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-8 relative z-10">
            <h1 className="max-w-3xl text-[4.5rem] font-bold leading-none tracking-tighter md:text-[7.5rem] lg:text-[9rem] animate-letter-spacing">
              Grada
              <span
                className="inline-block md:ml-1 mb-1 md:mb-3 h-3 w-3 md:h-6 md:w-6 bg-kira-brown animate-pulse-dot"
                style={{ animationDelay: "400ms" }}
              />
            </h1>
            <p
              className="mt-6 max-w-3xl text-3xl leading-tight md:text-5xl animate-fade-in-up"
              style={{ animationDelay: "800ms" }}
            >
              Turn style data into buyer-ready POs and shipping docs, without rebuilding the same
              spreadsheet twice.
            </p>
            <p
              className="mt-6 max-w-2xl text-kira-darkgray md:text-lg animate-fade-in-up"
              style={{ animationDelay: "1000ms" }}
            >
              Grada helps apparel teams move from catalog styles to clean PO workbooks, then from
              returned POs to barcodes, invoices, packing lists, and sticker outputs from one
              confirmed source.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button className="px-6 py-3">Explore Product</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-6 py-3" variant="secondary">
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button className="px-6 py-3" variant="text">
                  Sign In
                </Button>
              </Link>
              <Link
                className="kira-focus-ring rounded-md px-3 py-2 text-sm text-kira-darkgray hover:bg-kira-warmgray/20"
                href="/design-system"
              >
                View Design System
              </Link>
            </div>
            <p
              className="mt-6 text-sm text-kira-midgray animate-fade-in-up"
              style={{ animationDelay: "1200ms" }}
            >
              No static mockups. Open the actual workflow and see how the product handles catalog,
              PO prep, received-PO review, and shipping docs.
            </p>
          </div>

          <Card
            className="animate-enter kira-soft-glow !border-kira-darkgray/20 !text-kira-offwhite p-6 md:col-span-4 md:p-6"
            style={{
              animationDelay: "120ms",
              background:
                "linear-gradient(180deg, rgba(25, 31, 28, 0.98) 0%, rgba(13, 18, 16, 0.98) 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.1em] text-kira-warmgray">Snapshot</p>
            <div className="mt-4 space-y-4">
              {metrics.map((metric) => (
                <div
                  className="border-b border-kira-midgray/35 pb-3 last:border-0"
                  key={metric.label}
                >
                  <p className="text-xs text-kira-warmgray">{metric.label}</p>
                  <p className="text-2xl font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module, index) => (
          <Card
            className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1"
            key={module.title}
            style={{ animationDelay: `${120 + index * 80}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
              Module {index + 1}
            </p>
            <h2 className="mt-2 text-2xl">{module.title}</h2>
            <p className="mt-2 text-kira-darkgray">{module.detail}</p>
          </Card>
        ))}
      </section>

      <section
        className="kira-surface-elevated animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35 p-5 md:p-6"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
              Fashion Ops Focus
            </p>
            <h2 className="mt-1 text-2xl">Made for the Messy Middle</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            The part between product setup and shipping docs is where most teams still lose time
          </p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="kira-surface-soft overflow-hidden rounded-xl border border-kira-warmgray/35">
            <div className="kira-marquee flex min-w-max items-center gap-3 px-3 py-2">
              {[...fashionMotifPrimary, ...fashionMotifPrimary].map((tag, index) => (
                <span
                  className="kira-surface-chip inline-flex items-center gap-2 rounded-full border border-kira-warmgray/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray"
                  key={`${tag}-${index}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-kira-brown/80" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="kira-surface-soft overflow-hidden rounded-xl border border-kira-warmgray/35">
            <div className="kira-marquee-reverse flex min-w-max items-center gap-3 px-3 py-2">
              {[...fashionMotifSecondary, ...fashionMotifSecondary].map((tag, index) => (
                <span
                  className="kira-surface-chip inline-flex items-center gap-2 rounded-full border border-kira-warmgray/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray"
                  key={`${tag}-${index}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-kira-midgray/80" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Card
        className="animate-enter overflow-hidden p-5 md:p-7"
        style={{ animationDelay: "220ms" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Why Grada Wins</p>
            <h2 className="mt-2 text-3xl">Why Not Just Use Airtable, Notion, or Excel?</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            Because the handoff from catalog to PO to shipping docs is the product, not a workflow
            you still have to build yourself
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {coverageBlocks.map((block) => (
            <div
              className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/50 p-4"
              key={block.title}
            >
              <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">{block.title}</p>
              <p className="mt-2 text-sm leading-6 text-kira-darkgray">{block.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "260ms" }}
        >
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Proof</p>
          <h2 className="mt-2 text-3xl">See the Actual Workflow</h2>
          <p className="mt-2 text-kira-darkgray">
            If you&apos;re comparing Grada to a generic stack, the real question is whether the
            workflow is already here. These are the parts you can explore in the product today.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {challengeAreas.map((challenge) => (
              <div
                className="rounded-none border border-kira-warmgray/45 px-3 py-2 text-sm text-kira-darkgray"
                key={challenge}
              >
                {challenge}
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "320ms" }}
        >
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Get Started</p>
          <h2 className="mt-2 text-3xl">Start with the Product</h2>
          <p className="mt-2 text-kira-darkgray">
            Don&apos;t start with a sales call unless you need one. Open the product, create an
            account, or send us a question if you want to understand the fit first.
          </p>
          <div className="mt-5 space-y-2">
            {contactChannels.map((channel) => (
              <a
                className="kira-surface-elevated kira-focus-ring flex items-center justify-between rounded-none border border-kira-warmgray/50 px-4 py-3 text-kira-black hover:bg-kira-warmgray/20"
                href={channel.href}
                key={channel.label}
                rel="noreferrer"
                target={channel.href.startsWith("http") ? "_blank" : undefined}
              >
                <span className="text-sm font-semibold">{channel.label}</span>
                <span className="text-xs text-kira-midgray">{channel.sublabel}</span>
              </a>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <Card
            className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1"
            key={step.title}
            style={{ animationDelay: `${360 + index * 60}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
              Step {index + 1}
            </p>
            <h3 className="mt-2 text-2xl">{step.title}</h3>
            <p className="mt-2 text-sm text-kira-darkgray">{step.detail}</p>
          </Card>
        ))}
      </section>

      <section
        className="kira-surface-elevated animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35"
        style={{ animationDelay: "520ms" }}
      >
        <div className="kira-marquee flex min-w-max items-center gap-6 py-3">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span
              className="inline-flex items-center gap-4 text-sm uppercase tracking-[0.08em] text-kira-midgray"
              key={`${item}-${index}`}
            >
              {item}
              <span className="h-1.5 w-1.5 rounded-full bg-kira-brown/80" />
            </span>
          ))}
        </div>
      </section>

      <Card className="animate-enter p-5 md:p-7" style={{ animationDelay: "560ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2>Start Exploring Grada</h2>
            <p className="mt-1 text-kira-darkgray">
              See the live workflow, not a pitch deck. Move from style setup to PO prep to final
              documents in the real product.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button className="px-6">Explore Product</Button>
            </Link>
            <Link href="/signup">
              <Button className="px-6" variant="secondary">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <FooterBrand />

      <footer
        className="surface-card animate-enter relative z-10 p-5 md:p-7"
        style={{ animationDelay: "640ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">grada</p>
            <p className="mt-1 text-kira-darkgray">
              A purpose-built workflow for catalog, PO prep, and shipping docs.
            </p>
          </div>
          <p className="text-sm text-kira-midgray">© 2026 grada. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
