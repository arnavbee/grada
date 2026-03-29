import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FooterBrand } from "@/src/components/FooterBrand";
import { GridBackground } from "@/src/components/GridBackground";
import { DispatchDocumentsModuleCard } from "@/src/components/marketing/dispatch-documents-module-card";
import { MarketplaceExportsModuleCard } from "@/src/components/marketing/marketplace-exports-module-card";
import { ReceivedPoProcessingModuleCard } from "@/src/components/marketing/received-po-processing-module-card";
import { SmartCatalogModuleCard } from "@/src/components/marketing/smart-catalog-module-card";
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
    detail:
      "AI analyzes product images and helps your team lock category, color, fabric, composition, and style data in one shared workspace.",
    highlight: "Build one reusable product record before export or ops work begins.",
  },
  {
    number: "02",
    title: "Marketplace Exports",
    detail:
      "Build the catalog once, then generate channel-ready exports for Myntra, Ajio, Amazon IN, Flipkart, Nykaa, and generic workflows.",
    highlight: "Channel-specific files without channel-specific spreadsheet drift.",
  },
  {
    number: "03",
    title: "Received PO Processing",
    detail:
      "Upload marketplace POs in PDF, XLS, or XLSX, review parsed rows, and confirm one clean source of truth before ops moves downstream.",
    highlight: "One review step before barcode, invoice, and packing work begins.",
  },
  {
    number: "04",
    title: "Dispatch Documents",
    detail:
      "Generate barcodes, GST invoices, packing lists, and sticker outputs from the same confirmed PO instead of rebuilding each document by hand.",
    highlight: "Dispatch-ready outputs generated from approved upstream data.",
  },
];

const heroBadges = ["AI ops system", "Indian fashion brands", "Catalog -> PO -> dispatch"];

const metrics = [
  { label: "Built For", value: "Indian fashion brands" },
  { label: "Core Flow", value: "Catalog -> PO -> Dispatch" },
  { label: "Coverage", value: "6 marketplaces live" },
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

const modulePrinciples = [
  "Catalog data is approved once and reused everywhere.",
  "Received PO review happens before downstream document generation.",
  "Marketplace exports and dispatch docs stay tied to the same operational record.",
];

const marketplaceCoverage = [
  {
    label: "Myntra",
    detail:
      "Export structured catalog data and keep downstream PO handling tied to the same SKU logic.",
  },
  {
    label: "Ajio",
    detail:
      "Channel-ready exports reduce manual remapping when teams publish or revise seasonal assortments.",
  },
  {
    label: "Amazon IN",
    detail: "Carry forward catalog data so marketplaces do not become separate spreadsheet silos.",
  },
  {
    label: "Flipkart",
    detail: "Push marketplace-specific formats without rebuilding product attributes from scratch.",
  },
  {
    label: "Nykaa",
    detail:
      "Preserve rich attribute structure for beauty and fashion operations teams working side by side.",
  },
  {
    label: "Generic Exports",
    detail:
      "Handle custom retailer and internal templates from the same approved catalog foundation.",
  },
];

const workflowViews = [
  {
    value: "catalog",
    label: "Catalog AI",
    eyebrow: "Phase 01",
    title: "Lock the product record before the business starts improvising.",
    detail:
      "Grada turns scattered product images and team knowledge into reusable catalog records that feed every workflow after it.",
    bullets: [
      "Extract category, color, fabric, composition, and style attributes from product imagery.",
      "Keep one shared workspace for merchandising, operations, and marketplace teams.",
      "Reuse the same approved catalog data when exports or purchase orders arrive later.",
    ],
    carryTitle: "What carries forward",
    carryDetail:
      "Approved catalog attributes become the base layer for marketplace exports and downstream PO handling.",
  },
  {
    value: "po-review",
    label: "PO Review",
    eyebrow: "Phase 02",
    title: "Review the received PO once, then stop reconciling downstream mistakes.",
    detail:
      "Upload the marketplace PO, verify parsed rows, and confirm a clean operational version before the team creates any shipping documents.",
    bullets: [
      "Accept PDF, XLS, and XLSX purchase orders in the same workflow.",
      "Let ops confirm parsed line items before barcode, invoice, or packing steps begin.",
      "Keep one approved PO state instead of retyping rows into separate tools.",
    ],
    carryTitle: "Why it matters",
    carryDetail:
      "A single review step prevents barcode sheets, GST invoices, and packing outputs from diverging later.",
  },
  {
    value: "dispatch",
    label: "Dispatch Docs",
    eyebrow: "Phase 03",
    title: "Generate dispatch-ready outputs from approved data, not from memory.",
    detail:
      "Once the PO is confirmed, Grada generates barcodes, invoices, packing lists, and stickers from the same source of truth.",
    bullets: [
      "Create barcode sheets and sticker templates without rebuilding SKU details.",
      "Handle intrastate versus interstate GST logic inside the document flow.",
      "Store generated files with durable history so teams can download and recheck them later.",
    ],
    carryTitle: "Operational result",
    carryDetail:
      "Dispatch teams move faster because every output is derived from the already-approved catalog and PO state.",
  },
];

const playbookQuestions = [
  {
    value: "manual-rebuilds",
    title: "What problem does Grada remove first?",
    detail:
      "The first win is stopping teams from rebuilding the same product and order context in separate spreadsheets, chats, and document generators. Grada creates one operational chain from product setup to dispatch outputs.",
  },
  {
    value: "marketplace-exports",
    title: "How do marketplace exports fit into the system?",
    detail:
      "Exports are not treated as one-off files. They sit on top of the same approved catalog records, so channel formatting can change without forcing your team to re-enter core product data each time.",
  },
  {
    value: "po-confirmation",
    title: "Why make PO review a dedicated step?",
    detail:
      "Because the received PO becomes the source for barcode sheets, GST invoices, stickers, and packing lists. A deliberate confirmation step upstream is much cheaper than reconciling multiple incorrect outputs downstream.",
  },
  {
    value: "dispatch-docs",
    title: "What happens after the PO is approved?",
    detail:
      "The same confirmed data powers barcode generation, GST handling, packing outputs, and archived downloadable documents. Teams get continuity instead of copy-paste handoffs between tools.",
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

export default function LandingPage(): JSX.Element {
  return (
    <main className="relative w-full max-w-none space-y-6 p-4 md:space-y-8 md:p-8">
      <GridBackground />

      <section className="surface-card animate-enter relative overflow-hidden p-6 md:p-10">
        <div className="kira-float-slow absolute -right-24 top-0 h-72 w-72 rounded-full bg-kira-brown/10 blur-3xl" />
        <div className="kira-float-fast absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#A6B09B]/18 blur-3xl" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="relative z-10 md:col-span-7">
            <div className="flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <Badge className="bg-white/75 text-kira-black" key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>

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

            <div className="mt-8 flex flex-wrap items-center gap-3">
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

            <p
              className="mt-6 text-sm text-kira-midgray animate-fade-in-up"
              style={{ animationDelay: "1200ms" }}
            >
              Built for wholesale and D2C fashion teams that want one connected system for catalog,
              PO review, and dispatch documents.
            </p>

            <Separator className="mt-8" />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  className="rounded-2xl border border-kira-warmgray/35 bg-white/45 p-4 backdrop-blur-sm"
                  key={metric.label}
                >
                  <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-kira-black">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 md:col-span-5">
            <Card
              className="animate-enter h-full overflow-hidden border-kira-darkgray/15 p-6 md:p-7"
              style={{ animationDelay: "120ms" }}
            >
              <Badge variant="outline">Operational Spine</Badge>
              <h2 className="mt-4 text-3xl">
                The handoff that usually breaks is already connected.
              </h2>
              <p className="mt-3 text-kira-darkgray">
                Catalog setup, marketplace exports, received PO review, and dispatch documents all
                sit inside the same workflow instead of being rebuilt in separate tools.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {marketplaceCoverage.map((marketplace) => (
                  <HoverCard key={marketplace.label}>
                    <HoverCardTrigger asChild>
                      <button
                        className="kira-focus-ring rounded-full border border-kira-warmgray/45 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-kira-darkgray transition-colors hover:border-kira-brown/45 hover:text-kira-black"
                        type="button"
                      >
                        {marketplace.label}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="border-kira-warmgray/40 bg-kira-offwhite/95">
                      <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                        Coverage
                      </p>
                      <p className="mt-2 text-base font-semibold text-kira-black">
                        {marketplace.label}
                      </p>
                      <p className="mt-2 leading-6 text-kira-darkgray">{marketplace.detail}</p>
                    </HoverCardContent>
                  </HoverCard>
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
            <Badge variant="outline">Modules</Badge>
            <h2 className="mt-3 text-3xl">
              The product is already shaped around the real ops flow.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-kira-darkgray">
            Each module handles a painful handoff, but the bigger win is that they all reuse the
            same approved data instead of forcing teams to rebuild context at every step.
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
            className="animate-enter rounded-[32px] border-kira-darkgray/15 p-6 md:p-7"
            style={{ animationDelay: "240ms" }}
          >
            <Badge variant="secondary">Why This Feels Different</Badge>
            <h3 className="mt-4 text-3xl leading-tight">
              Grada is organized like one operating system, not a box of tools.
            </h3>
            <p className="mt-3 text-kira-darkgray">
              Most teams patch together catalog sheets, export templates, PO review, and dispatch
              files across separate flows. Grada keeps those steps in sequence so approved data can
              move forward instead of being retyped.
            </p>
            <div className="mt-6 space-y-3">
              {modulePrinciples.map((principle, index) => (
                <div
                  className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/55 px-4 py-4"
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
        className="surface-card animate-enter overflow-hidden p-5 md:p-7"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline">Workflow</Badge>
            <h2 className="mt-3 text-3xl">See the connected flow, not just the feature list.</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-kira-darkgray">
            Start with a reusable catalog record, confirm the received PO once, and let dispatch
            outputs inherit approved data instead of restarting from zero.
          </p>
        </div>

        <Tabs className="mt-6 gap-6" defaultValue="catalog">
          <TabsList className="w-full flex-wrap justify-start gap-2 rounded-none border-0 bg-transparent p-0">
            {workflowViews.map((view) => (
              <TabsTrigger
                className="min-w-[10rem] justify-start rounded-full border border-kira-warmgray/40 bg-white/55 px-5 py-3 text-left data-[state=active]:border-kira-black/10 data-[state=active]:bg-kira-black data-[state=active]:text-kira-offwhite data-[state=active]:shadow-none"
                key={view.value}
                value={view.value}
              >
                {view.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {workflowViews.map((view) => (
            <TabsContent className="mt-0" key={view.value} value={view.value}>
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_22rem]">
                <div className="rounded-[28px] border border-kira-warmgray/35 bg-white/60 p-6 md:p-7">
                  <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                    {view.eyebrow}
                  </p>
                  <h3 className="mt-3 max-w-3xl text-[2rem] leading-tight text-kira-black md:text-[2.6rem]">
                    {view.title}
                  </h3>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-kira-darkgray">
                    {view.detail}
                  </p>

                  <Separator className="my-5" />

                  <div className="grid gap-3 md:grid-cols-3">
                    {view.bullets.map((bullet) => (
                      <div
                        className="flex h-full items-start gap-3 rounded-2xl border border-kira-warmgray/30 bg-kira-offwhite/70 px-4 py-4"
                        key={bullet}
                      >
                        <span className="mt-2 h-2 w-2 rounded-full bg-kira-brown" />
                        <p className="text-sm leading-6 text-kira-darkgray">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="h-full rounded-[28px] border-kira-darkgray/15 p-5 md:p-6">
                  <Badge variant="secondary">{view.label}</Badge>
                  <h4 className="mt-4 text-2xl leading-tight">{view.carryTitle}</h4>
                  <p className="mt-3 text-sm leading-7 text-kira-darkgray">{view.carryDetail}</p>

                  <Separator className="my-5" />

                  <div className="space-y-3">
                    {coverageBlocks.map((block) => (
                      <div
                        className="rounded-2xl border border-kira-warmgray/35 bg-kira-offwhite/55 p-4"
                        key={block.title}
                      >
                        <p className="text-xs uppercase tracking-[0.08em] text-kira-midgray">
                          {block.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-kira-darkgray">{block.detail}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "320ms" }}
        >
          <Badge variant="outline">Ops FAQ</Badge>
          <h2 className="mt-3 text-3xl">What Grada is actually replacing.</h2>
          <p className="mt-3 max-w-2xl text-kira-darkgray">
            The operational pain is not just manual typing. It is the repeated handoff between
            catalog data, received POs, and dispatch documents that never stay in sync.
          </p>

          <Accordion className="mt-6" collapsible defaultValue="manual-rebuilds" type="single">
            {playbookQuestions.map((question) => (
              <AccordionItem key={question.value} value={question.value}>
                <AccordionTrigger>{question.title}</AccordionTrigger>
                <AccordionContent>{question.detail}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card
          className="animate-enter p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7"
          style={{ animationDelay: "380ms" }}
        >
          <Badge variant="secondary">Get Started</Badge>
          <h2 className="mt-3 text-3xl">Start with the product, not a sales deck.</h2>
          <p className="mt-3 text-kira-darkgray">
            Grada is built for Indian wholesale and D2C fashion brands ready to automate the
            operations layer. Open the workflow, request access, or reach out directly.
          </p>

          <div className="mt-6 space-y-3">
            {contactChannels.map((channel) => (
              <a
                className="kira-surface-elevated kira-focus-ring flex items-center justify-between rounded-2xl border border-kira-warmgray/45 px-4 py-4 text-kira-black transition-colors hover:bg-kira-warmgray/20"
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
            <Badge variant="outline">Ready to Scale</Badge>
            <h2 className="mt-3">Stop operating manually. Start operating at scale.</h2>
            <p className="mt-2 max-w-2xl text-kira-darkgray">
              Move from catalog to PO review to barcode, invoice, and packing outputs inside one
              workflow built for fashion operations.
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
