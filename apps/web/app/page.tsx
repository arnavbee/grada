import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { GridBackground } from "@/src/components/GridBackground";
import { FooterBrand } from "@/src/components/FooterBrand";

const modules = [
  {
    title: "Catalog System",
    detail:
      "Build clean style records with imagery, measurements, templates, and AI-assisted attributes that feed every downstream workflow.",
  },
  {
    title: "PO Workbook Builder",
    detail:
      "Turn approved catalog styles into channel-ready colorway x size workbooks with reviewed attributes, ratios, and export-ready rows.",
  },
  {
    title: "Received PO Review",
    detail:
      "Upload the returned PO, review extracted line items, and lock the confirmed record before downstream document work starts.",
  },
  {
    title: "Documents + Templates",
    detail:
      "Generate barcode sheets, invoices, and packing lists from the same confirmed PO, with reusable sticker templates, brand defaults, and carton rules.",
  },
];

const metrics = [
  { label: "Operating Layer", value: "Catalog → Builder → Review → Docs" },
  { label: "Current Fit", value: "Apparel marketplace ops" },
  { label: "Outputs", value: "Barcode / Invoice / Packing / Stickers" },
];

const challengeAreas = [
  "Catalog data scattered across chats, folders, and spreadsheets",
  "Marketplace workbook rows still assembled manually in Excel",
  "Colorway, size-ratio, and attribute mistakes slip into submission files",
  "Returned POs get re-keyed before barcode, invoice, and packing work starts",
  "Sticker layouts and barcode formats are rebuilt order by order",
  "Brand defaults, carton rules, and document settings live in team memory",
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
      "Expand approved styles into colorways and sizes, review attributes, and export the submission-ready workbook.",
  },
  {
    title: "Review Received PO",
    detail:
      "Upload the returned PO, review extracted line items, and confirm the approved source of truth.",
  },
  {
    title: "Generate Docs Fast",
    detail:
      "Produce barcode sheets, invoices, packing lists, and sticker outputs from the same confirmed PO record.",
  },
];

const contactChannels = [
  {
    label: "Schedule a Call",
    sublabel: "Book on Calendly",
    href: "https://calendly.com/bsngarnav/discuss-startups",
  },
  {
    label: "Email",
    sublabel: "hello@grada.com",
    href: "mailto:hello@grada.com",
  },
];

const tickerItems = [
  "Catalog Templates",
  "Workbook Export",
  "Received PO Review",
  "Barcode & Sticker Templates",
  "Invoice & Packing Docs",
  "Brand Defaults & Carton Rules",
];

const coverageBlocks = [
  {
    title: "Catalog foundation",
    detail: "Styles, imagery, template controls, and review queues live in one place.",
  },
  {
    title: "Builder workflow",
    detail: "Colorways, size ratios, reviewed attributes, and export-ready rows stay connected.",
  },
  {
    title: "Post-PO operations",
    detail:
      "Confirmed POs drive barcodes, invoices, packing lists, sticker templates, and settings-backed defaults.",
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
              One operating layer for catalog prep, PO workbooks, received-PO review, and downstream
              documents.
            </p>
            <p
              className="mt-6 max-w-2xl text-kira-darkgray md:text-lg animate-fade-in-up"
              style={{ animationDelay: "1000ms" }}
            >
              Grada helps fashion brands move from catalog style setup to workbook prep, then into
              received-PO confirmation, barcode sheets, invoices, packing lists, and reusable
              sticker workflows after the PO comes back.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button className="px-6 py-3">Open Dashboard</Button>
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
              Built for apparel teams running marketplace workflows, not generic back-office
              software.
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
            <h2 className="mt-1 text-2xl">Built for Apparel Supply Workflows</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            Structured around how brands actually work with marketplace buyers and post-PO
            operations
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
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
              Operational Coverage
            </p>
            <h2 className="mt-2 text-3xl">What Runs in Grada Today</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            Current product surface, without filler metrics
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
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Common Challenges</p>
          <h2 className="mt-2 text-3xl">Where Fashion Ops Break Down</h2>
          <p className="mt-2 text-kira-darkgray">
            Grada is designed around the work brands still do manually between catalog setup, PO
            submission prep, and post-PO document generation.
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
          <h2 className="mt-2 text-3xl">See If Grada Fits Your Workflow</h2>
          <p className="mt-2 text-kira-darkgray">
            Walk through your current catalog, workbook, and post-PO process with us and we&apos;ll
            show you where Grada fits fastest.
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
            <h2>See grada in Action</h2>
            <p className="mt-1 text-kira-darkgray">
              Open the live dashboard and move directly through catalog, workbook prep, received-PO
              review, and document workflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button className="px-6">Go to Dashboard</Button>
            </Link>
            <Link href="/signup">
              <Button className="px-6" variant="secondary">
                Get Started
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
              Catalog, PO prep, received-PO review, and downstream docs in one operating layer.
            </p>
          </div>
          <p className="text-sm text-kira-midgray">© 2026 grada. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
