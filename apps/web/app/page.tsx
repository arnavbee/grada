import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FooterBrand } from "@/src/components/FooterBrand";
import { GridBackground } from "@/src/components/GridBackground";
import { DispatchDocumentsModuleCard } from "@/src/components/marketing/dispatch-documents-module-card";
import { MarketplaceExportsModuleCard } from "@/src/components/marketing/marketplace-exports-module-card";
import { ReceivedPoProcessingModuleCard } from "@/src/components/marketing/received-po-processing-module-card";
import { SectionEyebrow } from "@/src/components/marketing/section-eyebrow";
import { SmartCatalogModuleCard } from "@/src/components/marketing/smart-catalog-module-card";
import { WorkflowTabs } from "@/src/components/marketing/workflow-tabs";
import { Card } from "@/src/components/ui/card";

const smartCatalogAnimationSrc = "/marketing/grada-smart-catalog-animated.html";
const marketplaceExportsAnimationSrc = "/marketing/grada-marketplace-exports-animated.html";
const barcodeAnimationSrc = "/marketing/grada-barcode-animated.html";
const commercialInvoicesAnimationSrc = "/marketing/grada-commercial-invoices-autoplay.html";
const receivedPoProcessingAnimationSrc = "/marketing/grada-received-po-processing-animated.html";

const modules = [
  {
    number: "01",
    title: "Smart Catalog",
    detail: "Extract clean product data from images and lock one reusable record.",
    highlight: "One product record before export or ops work begins.",
  },
  {
    number: "02",
    title: "Marketplace Exports",
    detail: "Generate channel-ready exports from the same approved catalog.",
    highlight: "Channel-specific files without spreadsheet drift.",
  },
  {
    number: "03",
    title: "Received PO Processing",
    detail: "Review the received PO once before downstream work starts.",
    highlight: "One review step before barcode or invoice generation.",
  },
  {
    number: "04",
    title: "Dispatch Documents",
    detail: "Generate barcodes, invoices, packing lists, and stickers from approved data.",
    highlight: "Dispatch-ready outputs from one confirmed source.",
  },
];

const heroBadges = ["Catalog -> PO -> dispatch"];

const coverageBlocks = [
  {
    title: "One source of truth",
    detail: "Product, PO, and dispatch data stay connected.",
  },
  {
    title: "One workflow",
    detail: "Catalog, PO review, and dispatch outputs live in one flow.",
  },
  {
    title: "One review",
    detail: "Approve once, then reuse that data downstream.",
  },
];

const modulePrinciples = [
  "Approve data once.",
  "Review PO before docs.",
  "Keep every output tied to the same record.",
];

type MarketplaceCoverageItem = {
  detail: string;
  label: string;
  logo:
    | {
        className?: string;
        height: number;
        kind: "image";
        src: string;
        width: number;
      }
    | {
        kind: "amazon";
      }
    | {
        kind: "text";
        text: string;
      };
};

const marketplaceCoverage: MarketplaceCoverageItem[] = [
  {
    label: "Myntra",
    detail: "Structured exports tied to the same SKU logic.",
    logo: {
      height: 28,
      kind: "image",
      src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png",
      width: 90,
    },
  },
  {
    label: "Ajio",
    detail: "Channel-ready exports without manual remapping.",
    logo: {
      height: 26,
      kind: "image",
      src: "https://images.seeklogo.com/logo-png/34/1/ajio-logo-png_seeklogo-348946.png",
      width: 100,
    },
  },
  {
    label: "Amazon IN",
    detail: "Reuse the same catalog data instead of rebuilding it.",
    logo: {
      kind: "amazon",
    },
  },
  {
    label: "Flipkart",
    detail: "Marketplace-specific formats from one source.",
    logo: {
      className: "h-6 w-auto object-contain",
      height: 26,
      kind: "image",
      src: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Flipkart_logo_%282026%29.svg",
      width: 90,
    },
  },
  {
    label: "Nykaa",
    detail: "Keep rich attribute structure intact across teams.",
    logo: {
      height: 26,
      kind: "image",
      src: "https://upload.wikimedia.org/wikipedia/commons/0/00/Nykaa_New_Logo.svg",
      width: 85,
    },
  },
  {
    label: "Generic Exports",
    detail: "Support custom retailer and internal templates.",
    logo: {
      kind: "text",
      text: "Generic Exports",
    },
  },
];

const workflowViews = [
  {
    value: "catalog",
    label: "Catalog AI",
    eyebrow: "Phase 01",
    title: "Lock the product record before the business starts improvising.",
    panelTone: "kira-tint-warm",
    carryTone: "kira-tint-mixed",
    bulletTone: "bg-kira-brown",
    detail: "Turn product images and team knowledge into one reusable catalog record.",
    bullets: [
      "Extract key attributes from product imagery.",
      "Keep merchandising and ops in one workspace.",
      "Reuse approved catalog data later.",
    ],
    carryTitle: "What carries forward",
    carryDetail: "Approved catalog attributes become the base layer for exports and PO handling.",
  },
  {
    value: "po-review",
    label: "PO Review",
    eyebrow: "Phase 02",
    title: "Review the received PO once, then stop reconciling downstream mistakes.",
    panelTone: "kira-tint-sage",
    carryTone: "kira-tint-sage",
    bulletTone: "bg-kira-brown dark:bg-[#8E9B87]",
    detail: "Upload the PO, verify parsed rows, and confirm one operational version.",
    bullets: [
      "Accept PDF, XLS, and XLSX files.",
      "Confirm line items before docs begin.",
      "Keep one approved PO state.",
    ],
    carryTitle: "Why it matters",
    carryDetail: "One review step keeps barcode sheets, invoices, and packing outputs aligned.",
  },
  {
    value: "dispatch",
    label: "Dispatch Docs",
    eyebrow: "Phase 03",
    title: "Generate dispatch-ready outputs from approved data, not from memory.",
    panelTone: "kira-tint-mixed",
    carryTone: "kira-tint-warm",
    bulletTone: "bg-[#C47F56]",
    detail: "Generate barcodes, invoices, packing lists, and stickers from the confirmed PO.",
    bullets: [
      "Create barcode sheets and sticker templates.",
      "Handle GST logic inside the flow.",
      "Store generated files with history.",
    ],
    carryTitle: "Operational result",
    carryDetail:
      "Dispatch teams move faster because every output comes from approved upstream data.",
  },
];

const playbookQuestions = [
  {
    value: "manual-rebuilds",
    title: "What problem does Grada remove first?",
    detail: "It stops teams from rebuilding the same product and order context in separate tools.",
  },
  {
    value: "marketplace-exports",
    title: "How do marketplace exports fit into the system?",
    detail:
      "Exports sit on top of approved catalog records instead of becoming separate spreadsheets.",
  },
  {
    value: "po-confirmation",
    title: "Why make PO review a dedicated step?",
    detail:
      "Because the received PO drives every downstream document and needs one clean approval step.",
  },
  {
    value: "dispatch-docs",
    title: "What happens after the PO is approved?",
    detail:
      "The same confirmed data powers barcode generation, GST handling, packing outputs, and stored documents.",
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

function MarketplaceCoverageLogo({
  marketplace,
}: {
  marketplace: MarketplaceCoverageItem;
}): JSX.Element {
  if (marketplace.logo.kind === "image") {
    return (
      <Image
        alt=""
        aria-hidden="true"
        className={marketplace.logo.className ?? "h-5 w-auto object-contain"}
        height={marketplace.logo.height}
        src={marketplace.logo.src}
        unoptimized
        width={marketplace.logo.width}
      />
    );
  }

  if (marketplace.logo.kind === "amazon") {
    return (
      <span className="relative inline-flex h-5 w-[4.9rem] items-start justify-start font-sans text-[0.95rem] font-medium lowercase tracking-[-0.05em] text-[#171717]">
        <span>amazon</span>
        <span className="absolute -right-0.5 top-0 text-[0.5rem] font-semibold tracking-normal text-[#f59e0b]">
          .in
        </span>
        <svg
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-2 w-[3.7rem]"
          viewBox="0 0 58 12"
        >
          <path
            d="M2 4.5C12 10.5 36 10.5 49 4.5"
            fill="none"
            stroke="#f59e0b"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M45.5 2.7L49 4.5L45.2 6.8"
            fill="none"
            stroke="#f59e0b"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold uppercase tracking-[0.08em]">
      {marketplace.logo.text}
    </span>
  );
}

export default function LandingPage(): JSX.Element {
  return (
    <main className="relative w-full max-w-none space-y-6 p-4 md:space-y-8 md:p-8">
      <GridBackground />

      <section className="surface-card kira-tint-mixed animate-enter relative overflow-hidden p-6 md:p-10">
        <div className="kira-float-slow absolute -right-24 top-0 h-72 w-72 rounded-full bg-kira-brown/16 blur-3xl" />
        <div className="kira-float-fast absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-kira-brown/14 blur-3xl dark:bg-[#A6B09B]/24" />
        <div className="absolute right-24 top-28 h-36 w-36 rounded-full bg-[#D7B08B]/14 blur-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="relative z-10 flex h-full flex-col md:col-span-7">
            <div className="flex flex-wrap gap-y-2">
              {heroBadges.map((badge) => (
                <SectionEyebrow className="tracking-[0.22em]" key={badge} linePosition="before">
                  {badge}
                </SectionEyebrow>
              ))}
            </div>

            <h1 className="max-w-3xl text-[4.5rem] font-bold leading-none tracking-tighter md:text-[7.5rem] lg:text-[9rem] animate-fade-in-up">
              Grada
              <span
                className="mb-1 ml-0 inline-block h-3 w-3 animate-cube-dot rounded-[2px] bg-kira-brown md:mb-3 md:ml-1 md:h-6 md:w-6"
                style={{ animationDelay: "400ms" }}
              />
            </h1>

            <p
              className="mt-6 max-w-3xl text-3xl leading-tight md:text-5xl animate-fade-in-up"
              style={{ animationDelay: "800ms" }}
            >
              From catalog to dispatch, <span className="text-kira-brown">simplified.</span>
            </p>
            <p
              className="mt-6 max-w-2xl text-kira-darkgray md:text-lg animate-fade-in-up"
              style={{ animationDelay: "1000ms" }}
            >
              Grada gives Indian fashion brands one system for catalog, PO review, and dispatch.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3 md:mt-auto md:pt-8">
              <Button asChild className="rounded-full px-6" size="lg">
                <Link href="/dashboard">See It in Action</Link>
              </Button>
              <Button asChild className="rounded-full px-6" size="lg" variant="outline">
                <Link href="/signup">Request Access</Link>
              </Button>
              <Button asChild className="rounded-full px-4" size="lg" variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="relative z-10 md:col-span-5">
            <Card
              className="animate-enter kira-tint-warm h-full overflow-hidden border-kira-darkgray/15 p-6 md:p-7"
              style={{ animationDelay: "120ms" }}
            >
              <SectionEyebrow linePosition="after">Operational Spine</SectionEyebrow>
              <h2 className="mt-4 text-3xl">The handoff is already connected.</h2>
              <p className="mt-3 text-kira-darkgray">
                Catalog, PO review, and dispatch all live in one flow.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {marketplaceCoverage.map((marketplace) => (
                  <div className="group relative" key={marketplace.label}>
                    <div className="relative">
                      <button
                        className="kira-focus-ring flex min-h-11 items-center justify-center rounded-full border border-kira-warmgray/45 bg-white/85 px-4 py-2 text-kira-darkgray transition-colors hover:border-kira-brown/45 hover:text-kira-black dark:border-white/10 dark:bg-kira-offwhite/95 dark:text-kira-black"
                        type="button"
                      >
                        <MarketplaceCoverageLogo marketplace={marketplace} />
                        <span className="sr-only">{marketplace.label}</span>
                      </button>
                      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-72 -translate-x-1/2 translate-y-1 rounded-2xl border border-kira-warmgray/40 bg-kira-offwhite/95 p-4 text-sm text-kira-black opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-white/10 dark:bg-[rgba(24,31,27,0.98)]">
                        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                          Coverage
                        </p>
                        <p className="mt-2 text-base font-semibold text-kira-black">
                          {marketplace.label}
                        </p>
                        <p className="mt-2 leading-6 text-kira-darkgray">{marketplace.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                {coverageBlocks.map((block) => (
                  <div key={block.title}>
                    <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                      {block.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-kira-darkgray">{block.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="animate-enter" style={{ animationDelay: "180ms" }}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionEyebrow linePosition="before">Modules</SectionEyebrow>
            <h2 className="mt-3 text-3xl">
              The product is already shaped around the real ops flow.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-kira-darkgray">
            Four modules. One connected operating flow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {modules.map((module, index) => {
              if (module.title === "Smart Catalog") {
                return (
                  <SmartCatalogModuleCard
                    animationSrc={smartCatalogAnimationSrc}
                    detail={module.detail}
                    index={index}
                    key={module.title}
                    title={module.title}
                  />
                );
              }

              if (module.title === "Marketplace Exports") {
                return (
                  <MarketplaceExportsModuleCard
                    animationSrc={marketplaceExportsAnimationSrc}
                    detail={module.detail}
                    index={index}
                    key={module.title}
                    title={module.title}
                  />
                );
              }

              if (module.title === "Received PO Processing") {
                return (
                  <ReceivedPoProcessingModuleCard
                    animationSrc={receivedPoProcessingAnimationSrc}
                    index={index}
                    key={module.title}
                    title={module.title}
                  />
                );
              }

              return (
                <DispatchDocumentsModuleCard
                  barcodeAnimationSrc={barcodeAnimationSrc}
                  index={index}
                  invoiceAnimationSrc={commercialInvoicesAnimationSrc}
                  key={module.title}
                  title={module.title}
                />
              );
            })}
          </div>

          <Card
            className="animate-enter kira-tint-mixed rounded-[32px] border-kira-darkgray/15 p-6 md:p-7"
            style={{ animationDelay: "240ms" }}
          >
            <SectionEyebrow linePosition="after">Why This Feels Different</SectionEyebrow>
            <h3 className="mt-4 text-3xl leading-tight">Built like one operating system.</h3>
            <div className="mt-6 space-y-3">
              {modulePrinciples.map((principle, index) => (
                <div
                  className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/55 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                  key={principle}
                >
                  <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                    Principle {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-kira-darkgray">{principle}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section
        className="surface-card kira-tint-sage animate-enter overflow-hidden p-5 md:p-7"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionEyebrow linePosition="before">Workflow</SectionEyebrow>
            <h2 className="mt-3 text-3xl">See the connected flow, not just the feature list.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-kira-darkgray">
            One clean flow from catalog to dispatch.
          </p>
        </div>

        <WorkflowTabs views={workflowViews} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="animate-enter kira-tint-warm p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "320ms" }}
        >
          <SectionEyebrow linePosition="before">Ops FAQ</SectionEyebrow>
          <h2 className="mt-3 text-3xl">What Grada is actually replacing.</h2>

          <div className="mt-5">
            {playbookQuestions.map((question) => (
              <details
                className="group border-b border-kira-warmgray/30 last:border-b-0"
                key={question.value}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-left text-sm font-semibold text-kira-black marker:content-none hover:text-kira-brown">
                  <span>{question.title}</span>
                  <span className="shrink-0 text-kira-midgray group-open:hidden">+</span>
                  <span className="hidden shrink-0 text-kira-midgray group-open:inline">-</span>
                </summary>
                <div className="pb-4 text-sm leading-6 text-kira-darkgray">{question.detail}</div>
              </details>
            ))}
          </div>
        </Card>

        <Card
          className="animate-enter kira-tint-sage p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "380ms" }}
        >
          <SectionEyebrow linePosition="after">Get Started</SectionEyebrow>
          <h2 className="mt-3 text-3xl">Start with the product, not a sales deck.</h2>
          <p className="mt-3 text-kira-darkgray">
            Open the workflow, request access, or reach out directly.
          </p>

          <div className="mt-6 space-y-3">
            {contactChannels.map((channel) => (
              <a
                className="kira-surface-elevated kira-focus-ring flex items-center justify-between rounded-2xl border border-kira-warmgray/45 px-4 py-4 text-kira-black transition-colors hover:bg-kira-warmgray/20 dark:border-white/10 dark:text-kira-offwhite dark:hover:bg-white/8"
                href={channel.href}
                key={channel.label}
                rel="noreferrer"
                target={channel.href.startsWith("http") ? "_blank" : undefined}
              >
                <span className="text-sm font-semibold">{channel.label}</span>
                <span className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                  {channel.sublabel}
                </span>
              </a>
            ))}
          </div>
        </Card>
      </section>

      <section
        className="kira-tint-deep animate-enter overflow-hidden rounded-2xl border border-kira-warmgray/35"
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

      <Card
        className="animate-enter kira-tint-mixed p-5 md:p-7"
        style={{ animationDelay: "560ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <SectionEyebrow linePosition="before">Ready to Scale</SectionEyebrow>
            <h2 className="mt-3">Stop operating manually. Start operating at scale.</h2>
            <p className="mt-2 max-w-2xl text-kira-darkgray">
              Move from catalog to dispatch inside one workflow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-6" size="lg">
              <Link href="/dashboard">See It in Action</Link>
            </Button>
            <Button asChild className="rounded-full px-6" size="lg" variant="outline">
              <Link href="/signup">Request Access</Link>
            </Button>
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
