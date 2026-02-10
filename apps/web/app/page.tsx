import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";

const modules = [
  {
    title: "Smart Catalog",
    detail: "AI-assisted image attributes, editable catalog tables, and marketplace-ready exports.",
  },
  {
    title: "PO Automation",
    detail: "Capture, parse, validate, and confirm purchase orders in one pipeline.",
  },
  {
    title: "Invoice & Packing",
    detail: "GST-ready invoice flows with barcode and print-ready packing templates.",
  },
];

const metrics = [
  { label: "Manual Hours Saved", value: "70+ / week" },
  { label: "PO Processing Speed", value: "< 1 min" },
  { label: "Catalog Export Time", value: "< 30 sec" },
];

const challengeAreas = [
  "Order management chaos",
  "Inventory blind spots",
  "Outdated technology",
  "Can't scale operations",
  "High error rates",
  "Customer complaints",
];

const workflowSteps = [
  {
    title: "Capture",
    detail: "Ingest product, order, and document inputs from your operations flow.",
  },
  {
    title: "Automate",
    detail: "Use AI-assisted workflows for catalog enrichment, PO handling, and document prep.",
  },
  {
    title: "Validate",
    detail: "Review confidence, checks, and exceptions before finalizing operational outputs.",
  },
  {
    title: "Ship",
    detail: "Move faster from data to execution with clean, auditable, team-ready handoffs.",
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
  "Catalog Intelligence",
  "PO Automation",
  "Invoice & Packing",
  "Unified Dashboard",
  "Wholesale Operations Audit",
];

const pulseBlocks = [
  { label: "Catalog readiness", value: 92 },
  { label: "Order processing speed", value: 84 },
  { label: "Operational visibility", value: 88 },
];

const fashionMotifPrimary = [
  "Dresses",
  "Cord Sets",
  "Fabric Library",
  "Colorways",
  "Tech Pack",
  "Sampling",
];

const fashionMotifSecondary = [
  "Pattern Blocks",
  "Fit Review",
  "Grading",
  "Trim Mapping",
  "Line Sheet",
  "Production Ready",
];

export default function LandingPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-[1440px] space-y-6 p-4 md:space-y-8 md:p-8">
      <section className="surface-card animate-enter relative overflow-hidden p-6 md:p-10">
        <div className="kira-float-slow absolute -right-24 top-0 h-72 w-72 rounded-full bg-kira-brown/10 blur-3xl" />
        <div className="kira-float-fast absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-kira-warmgray/15 blur-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.12em] text-kira-midgray">grada</p>
            <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">
              Stop losing margin to wholesale operations chaos.
            </h1>
            <p className="mt-4 max-w-2xl text-kira-darkgray md:text-lg">
              Empowering Every Step of Wholesale. grada is a focused operating layer for fashion teams handling
              inventory, marketplace orders, documents, and reporting.
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
            <p className="mt-4 text-sm text-kira-midgray">Start today, stay efficient forever.</p>
          </div>

          <Card
            className="animate-enter kira-soft-glow !border-kira-darkgray/20 !bg-kira-black !text-kira-offwhite md:col-span-4 md:p-5"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-xs uppercase tracking-[0.1em] text-kira-warmgray">Snapshot</p>
            <div className="mt-4 space-y-4">
              {metrics.map((metric) => (
                <div className="border-b border-kira-midgray/35 pb-3 last:border-0" key={metric.label}>
                  <p className="text-xs text-kira-warmgray">{metric.label}</p>
                  <p className="text-2xl font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modules.map((module, index) => (
          <Card
            className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1"
            key={module.title}
            style={{ animationDelay: `${120 + index * 80}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Module {index + 1}</p>
            <h2 className="mt-2 text-2xl">{module.title}</h2>
            <p className="mt-2 text-kira-darkgray">{module.detail}</p>
          </Card>
        ))}
      </section>

      <section
        className="animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/95 p-5 md:p-6"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Fashion Ops Focus</p>
            <h2 className="mt-1 text-2xl">Built for Apparel Teams</h2>
          </div>
          <p className="text-sm text-kira-midgray">Season-ready operational context with visual motifs</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-xl border border-kira-warmgray/35 bg-kira-offwhite">
            <div className="kira-marquee flex min-w-max items-center gap-3 px-3 py-2">
              {[...fashionMotifPrimary, ...fashionMotifPrimary].map((tag, index) => (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-kira-warmgray/45 bg-kira-offwhite px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray"
                  key={`${tag}-${index}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-kira-brown/80" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-kira-warmgray/35 bg-kira-offwhite/80">
            <div className="kira-marquee-reverse flex min-w-max items-center gap-3 px-3 py-2">
              {[...fashionMotifSecondary, ...fashionMotifSecondary].map((tag, index) => (
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-kira-warmgray/45 bg-kira-offwhite px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-kira-darkgray"
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

      <Card className="animate-enter overflow-hidden p-5 md:p-7" style={{ animationDelay: "220ms" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Operational Pulse</p>
            <h2 className="mt-2 text-3xl">Performance Momentum</h2>
          </div>
          <p className="text-sm text-kira-midgray">Live visual benchmark</p>
        </div>
        <div className="mt-5 space-y-4">
          {pulseBlocks.map((block, index) => (
            <div key={block.label}>
              <div className="mb-1 flex items-center justify-between text-sm text-kira-darkgray">
                <span>{block.label}</span>
                <span>{block.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-kira-warmgray/35">
                <div
                  className="kira-pulse-bar h-full rounded-full bg-kira-brown"
                  style={{ width: `${block.value}%`, animationDelay: `${index * 120}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7" style={{ animationDelay: "260ms" }}>
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Common Challenges</p>
          <h2 className="mt-2 text-3xl">Where Teams Lose Time</h2>
          <p className="mt-2 text-kira-darkgray">
            We designed grada around the exact pain points found in wholesale operations teams.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {challengeAreas.map((challenge) => (
              <div className="rounded-none border border-kira-warmgray/45 px-3 py-2 text-sm text-kira-darkgray" key={challenge}>
                {challenge}
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7" style={{ animationDelay: "320ms" }}>
          <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Get Started</p>
          <h2 className="mt-2 text-3xl">Let&apos;s Talk About Your Operations</h2>
          <p className="mt-2 text-kira-darkgray">
            Book your free wholesale operations audit. We&apos;ll analyze your current systems and identify your biggest automation opportunities.
          </p>
          <div className="mt-5 space-y-2">
            {contactChannels.map((channel) => (
              <a
                className="kira-focus-ring flex items-center justify-between rounded-none border border-kira-warmgray/50 bg-kira-offwhite px-4 py-3 text-kira-black hover:bg-kira-warmgray/20"
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
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">Step {index + 1}</p>
            <h3 className="mt-2 text-2xl">{step.title}</h3>
            <p className="mt-2 text-sm text-kira-darkgray">{step.detail}</p>
          </Card>
        ))}
      </section>

      <section className="animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/95" style={{ animationDelay: "520ms" }}>
        <div className="kira-marquee flex min-w-max items-center gap-6 py-3">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span className="inline-flex items-center gap-4 text-sm uppercase tracking-[0.08em] text-kira-midgray" key={`${item}-${index}`}>
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
              Open the live dashboard and move directly into catalog and operations workflows.
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

      <footer className="surface-card animate-enter p-5 md:p-7" style={{ animationDelay: "640ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">grada</p>
            <p className="mt-1 text-kira-darkgray">Empowering Every Step of Wholesale!</p>
          </div>
          <p className="text-sm text-kira-midgray">© 2025 grada. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
