import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { FooterBrand } from "@/src/components/FooterBrand";
import { GridBackground } from "@/src/components/GridBackground";

const smartCatalogAnimationSrc = "/marketing/grada-smart-catalog-animated.html";

const modules = [
  {
    title: "Smart Catalog",
    detail:
      "AI analyzes product images and helps your team lock category, color, fabric, composition, and style data in one shared workspace.",
  },
  {
    title: "Marketplace Exports",
    detail:
      "Build the catalog once, then generate channel-ready exports for Myntra, Ajio, Amazon IN, Flipkart, Nykaa, and generic workflows.",
  },
  {
    title: "Received PO Processing",
    detail:
      "Upload marketplace POs in PDF, XLS, or XLSX, review parsed rows, and confirm one clean source of truth before ops moves downstream.",
  },
  {
    title: "Dispatch Documents",
    detail:
      "Generate barcodes, GST invoices, packing lists, and sticker outputs from the same confirmed PO instead of rebuilding each document by hand.",
  },
];

const metrics = [
  { label: "Built For", value: "Indian fashion brands" },
  { label: "Core Flow", value: "Catalog → PO → Dispatch" },
  { label: "Coverage", value: "6 marketplaces live" },
];

const challengeAreas = [
  "Catalog data centralized instead of scattered across chats and sheets",
  "Marketplace exports generated in exact channel formats",
  "Received PO review before barcode, invoice, and packing workflows",
  "Custom sticker templates plus built-in barcode generation",
  "Automatic intrastate vs interstate GST handling",
  "Durable document storage and downloadable history",
];

const workflowSteps = [
  {
    title: "Add to Catalog",
    detail:
      "Upload product images, let AI extract attributes, and turn scattered product knowledge into reusable catalog records.",
  },
  {
    title: "Receive and Review PO",
    detail:
      "Upload the marketplace PO, review parsed line items, and confirm a clean operational version before the rest of the workflow starts.",
  },
  {
    title: "Generate Docs",
    detail:
      "Create barcode sheets, invoices, and packing lists directly from the confirmed PO with no duplicate entry.",
  },
  {
    title: "Pack and Dispatch",
    detail:
      "Use carton assignment, packing outputs, and archived PDFs to move from ops prep to dispatch faster and with fewer errors.",
  },
];

const contactChannels = [
  {
    label: "Request Access",
    sublabel: "Create your account",
    href: "/signup",
  },
  {
    label: "See It in Action",
    sublabel: "Open the live product",
    href: "/dashboard",
  },
  {
    label: "Talk to the Founder",
    sublabel: "hello@arnavb.xyz",
    href: "mailto:hello@arnavb.xyz",
  },
];

const tickerItems = [
  "AI Catalog Extraction",
  "Marketplace Export Engine",
  "Received PO Review",
  "Barcode Generation",
  "GST Invoices",
  "Packing Lists",
  "R2 Document Storage",
];

const coverageBlocks = [
  {
    title: "One source of truth",
    detail:
      "Product data, PO data, and downstream documents stay connected instead of being rebuilt in separate spreadsheets.",
  },
  {
    title: "One workflow, not five tools",
    detail:
      "Catalog, exports, received PO review, barcodes, invoices, and packing lists are already connected inside the product.",
  },
  {
    title: "One review before dispatch",
    detail:
      "Your team reviews once, confirms once, and reuses approved data everywhere downstream instead of reconciling it later.",
  },
];

const fashionMotifPrimary = ["Myntra", "Ajio", "Amazon IN", "Flipkart", "Nykaa", "Generic Exports"];

const fashionMotifSecondary = [
  "Catalog AI",
  "PO Parsing",
  "Barcode Sheets",
  "Sticker Templates",
  "GST Invoices",
  "Packing Lists",
];

export default function LandingPage(): JSX.Element {
  return (
    <main className="relative w-full max-w-none space-y-6 p-4 md:space-y-8 md:p-8">
      <GridBackground />
      <section className="surface-card animate-enter relative overflow-hidden p-6 md:p-10">
        <div className="kira-float-slow absolute -right-24 top-0 h-72 w-72 rounded-full bg-kira-brown/10 blur-3xl" />
        <div className="kira-float-fast absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#A6B09B]/18 blur-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="relative z-10 md:col-span-8">
            <h1 className="max-w-3xl text-[4.5rem] font-bold leading-none tracking-tighter md:text-[7.5rem] lg:text-[9rem] animate-letter-spacing">
              Grada
              <span
                className="mb-1 ml-0 inline-block h-3 w-3 bg-kira-brown animate-pulse-dot md:mb-3 md:ml-1 md:h-6 md:w-6"
                style={{ animationDelay: "400ms" }}
              />
            </h1>
            <p
              className="mt-6 max-w-3xl text-3xl leading-tight md:text-5xl animate-fade-in-up"
              style={{ animationDelay: "800ms" }}
            >
              From catalog to dispatch, automated.
            </p>
            <p
              className="mt-6 max-w-2xl text-kira-darkgray md:text-lg animate-fade-in-up"
              style={{ animationDelay: "1000ms" }}
            >
              Grada replaces the spreadsheet chaos behind Indian fashion brands with AI-powered
              workflows for catalog, purchase orders, barcodes, invoices, and packing lists.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button className="px-6 py-3">See It in Action</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-6 py-3" variant="secondary">
                  Request Access
                </Button>
              </Link>
              <Link href="/login">
                <Button className="px-6 py-3" variant="text">
                  Sign In
                </Button>
              </Link>
            </div>
            <p
              className="mt-6 text-sm text-kira-midgray animate-fade-in-up"
              style={{ animationDelay: "1200ms" }}
            >
              Built for wholesale and D2C fashion teams that want one connected system for catalog,
              PO review, and dispatch documents.
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

      <section className="grid grid-cols-1 gap-4 overflow-visible md:grid-cols-2 xl:grid-cols-6">
        {modules.map((module, index) => {
          const isSmartCatalog = module.title === "Smart Catalog";

          return (
            <Card
              aria-label={
                isSmartCatalog ? "Smart Catalog module with infographic preview" : undefined
              }
              className={`animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 ${
                isSmartCatalog ? "group relative overflow-visible" : "xl:col-span-1"
              }`}
              key={module.title}
              style={{ animationDelay: `${120 + index * 80}ms` }}
              tabIndex={isSmartCatalog ? 0 : undefined}
            >
              <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                Module {index + 1}
              </p>
              <h2 className="mt-2 text-2xl">{module.title}</h2>
              <p className="mt-2 text-kira-darkgray">{module.detail}</p>
              {isSmartCatalog ? (
                <>
                  <p className="mt-4 text-xs uppercase tracking-[0.08em] text-kira-midgray">
                    Hover or focus to preview the AI extraction visual
                  </p>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-kira-warmgray/35 bg-[#fbf7f0] md:absolute md:left-0 md:top-[calc(100%+1rem)] md:z-20 md:mt-0 md:w-[calc(200%+1rem)] md:max-h-[0] md:translate-y-3 md:opacity-0 md:shadow-2xl md:transition-all md:duration-500 md:ease-out md:group-hover:max-h-[46rem] md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:max-h-[46rem] md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 xl:left-[calc(100%+1rem)] xl:top-0 xl:w-[30rem]">
                    <div className="border-b border-kira-warmgray/35 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                        Inside Smart Catalog
                      </p>
                      <p className="mt-1 text-sm text-kira-darkgray">
                        From one product image to AI suggestions, human review, and export-ready
                        catalog data.
                      </p>
                    </div>
                    <div className="p-3 md:p-4">
                      <div className="kira-infographic-stage">
                        <div className="kira-infographic-chip">Live workflow preview</div>
                        <div className="kira-infographic-frame">
                          <iframe
                            aria-label="Animated Smart Catalog workflow preview"
                            className="kira-infographic-embed"
                            loading="lazy"
                            src={smartCatalogAnimationSrc}
                            title="Animated Smart Catalog workflow preview"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </Card>
          );
        })}
      </section>

      <section
        className="kira-surface-elevated animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35 p-5 md:p-6"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">The Problem</p>
            <h2 className="mt-1 text-2xl">Fashion ops is still running on chaos</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            Catalog data, marketplace exports, and PO-to-dispatch documents still get rebuilt more
            than they should
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
            <h2 className="mt-2 text-3xl">Not another generic ops stack</h2>
          </div>
          <p className="text-sm text-kira-midgray">
            The real value is the handoff from catalog to PO to dispatch documents already being
            built into the product
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
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
            What We&apos;ve Built
          </p>
          <h2 className="mt-2 text-3xl">One platform. Every operation.</h2>
          <p className="mt-2 text-kira-darkgray">
            Grada connects the full workflow, from AI-assisted catalog setup to marketplace-ready
            exports, received PO review, and final dispatch documents.
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
          <h2 className="mt-2 text-3xl">Start with the product</h2>
          <p className="mt-2 text-kira-darkgray">
            Grada is built for Indian wholesale and D2C fashion brands ready to automate the
            operations layer. Open the workflow, request access, or reach out directly.
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
            <h2>Stop operating manually. Start operating at scale.</h2>
            <p className="mt-1 text-kira-darkgray">
              Move from catalog to PO review to barcode, invoice, and packing outputs inside one
              workflow built for fashion operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button className="px-6">See It in Action</Button>
            </Link>
            <Link href="/signup">
              <Button className="px-6" variant="secondary">
                Request Access
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
              Fashion operations, automated. Built for Indian fashion brands.
            </p>
          </div>
          <p className="text-sm text-kira-midgray">© 2026 grada. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
