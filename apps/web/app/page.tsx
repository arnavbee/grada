"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

const smartCatalogAnimationSrc = "/marketing/grada-smart-catalog-animated.html";
const marketplaceExportsAnimationSrc = "/marketing/grada-marketplace-exports-animated.html";
const commercialInvoicesAnimationSrc = "/marketing/grada-commercial-invoices-autoplay.html";
const receivedPoProcessingAnimationSrc = "/marketing/grada-received-po-processing-animated.html";

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
      className: "h-[18px] w-auto object-contain",
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
      className: "h-7 w-auto object-contain",
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
      className: "h-10 w-auto origin-center scale-[1.5] object-contain",
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
      className: "h-[18px] w-auto object-contain",
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

function MarketplaceCoverageLogo({
  marketplace,
}: {
  marketplace: MarketplaceCoverageItem;
}): JSX.Element {
  const baseEffects =
    "opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition duration-500";

  if (marketplace.logo.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        aria-hidden="true"
        className={`${marketplace.logo.className ?? "h-7 w-auto object-contain"} ${baseEffects}`}
        height={marketplace.logo.height}
        src={marketplace.logo.src}
        width={marketplace.logo.width}
      />
    );
  }

  if (marketplace.logo.kind === "amazon") {
    return (
      <span
        className={`relative inline-flex h-6 w-[5.5rem] items-start justify-start font-sans text-[1.05rem] font-medium lowercase tracking-[-0.05em] text-[#111] ${baseEffects}`}
      >
        <span>amazon</span>
        <span className="absolute right-0 top-0 text-[0.5rem] font-semibold tracking-normal text-[#111]">
          .in
        </span>
        <svg
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-2.5 w-[4rem]"
          viewBox="0 0 58 12"
        >
          <path
            d="M2 4.5C12 10.5 36 10.5 49 4.5"
            fill="none"
            stroke="#111"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M45.5 2.7L49 4.5L45.2 6.8"
            fill="none"
            stroke="#111"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-40 hover:opacity-100 transition duration-500 text-[#111]">
      {marketplace.logo.text}
    </span>
  );
}

const modules = [
  {
    number: "01",
    title: "Smart Catalog",
    detail: "Extract clean product data from images and lock one reusable record.",
    highlight: "One product record before export or ops work begins.",
    icon: (
      <svg
        className="w-5 h-5 text-kira-brown"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Marketplace Exports",
    detail: "Generate channel-ready exports from the same approved catalog.",
    highlight: "Channel-specific files without spreadsheet drift.",
    icon: (
      <svg
        className="w-5 h-5 text-kira-brown"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Received PO Processing",
    detail: "Review the received PO once before downstream work starts.",
    highlight: "One review step before barcode or invoice generation.",
    icon: (
      <svg
        className="w-5 h-5 text-kira-brown"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Dispatch Documents",
    detail: "Generate barcodes, invoices, packing lists, and stickers from approved data.",
    highlight: "Dispatch-ready outputs from one confirmed source.",
    icon: (
      <svg
        className="w-5 h-5 text-kira-brown"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

const coverageBlocks = [
  {
    title: "One record, reused everywhere",
    detail: "The same SKU-level record drives catalog fields, PO lines, and dispatch documents.",
  },
  {
    title: "Approve once, lock downstream docs",
    detail:
      "After PO approval, barcodes, invoices, and stickers pull from that exact approved data.",
  },
];

const workflowViews = [
  {
    value: "catalog",
    label: "Catalog AI",
    eyebrow: "Phase 01",
    title: "Lock the product record before the business starts improvising.",
    detail:
      "Turn product images and team knowledge into one reusable catalog record. Extract key attributes from product imagery. Keep merchandising and ops in one workspace.",
    animationSrc: smartCatalogAnimationSrc,
  },
  {
    value: "po-review",
    label: "PO Review",
    eyebrow: "Phase 02",
    title: "Review the received PO once, then stop reconciling downstream mistakes.",
    detail:
      "Upload the PO, verify parsed rows, and confirm one operational version. Accept PDF, XLS, and XLSX files. Confirm line items before docs begin.",
    animationSrc: receivedPoProcessingAnimationSrc,
  },
  {
    value: "dispatch",
    label: "Dispatch Docs",
    eyebrow: "Phase 03",
    title: "Generate dispatch-ready outputs from approved data, not from memory.",
    detail:
      "Generate barcodes, invoices, packing lists, and stickers from the confirmed PO. Handle GST logic inside the flow. Store generated files with history.",
    animationSrc: commercialInvoicesAnimationSrc,
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

export default function LandingPage() {
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans selection:bg-black selection:text-white pb-12 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6 sticky top-0 bg-white/40 backdrop-blur-2xl z-50 border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="font-serif text-3xl font-normal tracking-tight pt-1">
          Grada<span className="text-kira-brown text-[1.1em]">.</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
          <Link href="#spine" className="hover:text-gray-500 transition-colors duration-300">
            Operational Spine
          </Link>
          <Link href="#workflow" className="hover:text-gray-500 transition-colors duration-300">
            Workflow
          </Link>
          <Link href="#faq" className="hover:text-gray-500 transition-colors duration-300">
            Ops FAQ
          </Link>
        </nav>
        <Button
          asChild
          className="bg-[#111] text-white hover:bg-black/80 rounded-full px-6 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Link href="/dashboard">See It in Action ↗</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-32 max-w-7xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

        <h1 className="font-serif font-normal text-6xl md:text-[100px] lg:text-[130px] leading-[0.9] tracking-tight mb-8 relative z-10">
          From catalog
          <br />
          to dispatch<span className="text-kira-brown text-[1.1em]">.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 font-light mb-12 max-w-2xl mx-auto relative z-10">
          Grada gives fashion brands one system for catalog, PO review, and dispatch, simplified.
        </p>

        <div className="relative mt-24 max-w-6xl mx-auto z-10">
          {/* Solid Background Tile */}
          <div className="absolute top-[15%] bottom-[-10%] -left-4 -right-4 md:-left-12 md:-right-12 bg-[#8C987A] rounded-[32px] md:rounded-[64px] z-0 shadow-lg" />

          <div className="relative z-10 w-full max-w-5xl mx-auto rounded-2xl md:rounded-[40px] overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-2 md:p-4 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-shadow duration-700">
            <div className="aspect-[21/9] md:aspect-[2/1] lg:aspect-[16/9] relative group rounded-xl md:rounded-[32px] overflow-hidden bg-[#111] ring-1 ring-black/5 shadow-inner">
              <iframe
                src={receivedPoProcessingAnimationSrc}
                className="w-full h-full border-0 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By (Infinite Marquee) */}
      <section className="border-t border-b border-black/5 py-12 bg-white relative z-10 overflow-hidden flex items-center">
        <div className="px-6 md:px-12 pr-12 z-20 bg-white shadow-[20px_0_20px_-10px_rgba(255,255,255,1)]">
          <p className="text-sm text-gray-400 font-medium shrink-0 uppercase tracking-widest">
            Coverage
          </p>
        </div>
        <div
          className="flex w-full overflow-hidden relative"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="flex shrink-0 animate-marquee items-center justify-around gap-20 min-w-full">
            {marketplaceCoverage.map((item, i) => (
              <div key={`logo-1-${i}`} className="flex items-center justify-center">
                <MarketplaceCoverageLogo marketplace={item} />
              </div>
            ))}
          </div>
          <div
            className="flex shrink-0 animate-marquee items-center justify-around gap-20 min-w-full"
            aria-hidden="true"
          >
            {marketplaceCoverage.map((item, i) => (
              <div key={`logo-2-${i}`} className="flex items-center justify-center">
                <MarketplaceCoverageLogo marketplace={item} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Spine (Bento Box) */}
      <section id="spine" className="py-24 md:py-40 px-6 md:px-12 max-w-7xl mx-auto relative">
        {/* Ambient glow for glassmorphism */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(140,152,122,0.15)_0%,rgba(175,138,104,0.05)_40%,transparent_70%)] pointer-events-none -z-10" />

        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6 font-semibold">
          Operational Spine
        </p>
        <h2 className="font-serif font-normal text-5xl md:text-7xl tracking-tight mb-6">
          The handoff is already connected<span className="text-kira-brown text-[1.1em]">.</span>
        </h2>
        <p className="text-lg text-gray-500 font-light max-w-2xl mb-16 md:mb-24">
          Catalog, PO review, and dispatch all live in one flow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod, i) => (
            <div
              key={i}
              className="flex flex-col bg-white/50 backdrop-blur-2xl rounded-[32px] p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out cursor-default relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 origin-top-right mix-blend-multiply">
                {mod.icon}
              </div>
              <div className="w-12 h-12 mb-8 rounded-full bg-[#FAFAFA] ring-1 ring-black/5 flex items-center justify-center shadow-inner text-[#111]">
                {mod.icon}
              </div>
              <h3 className="font-semibold text-lg mb-3 relative z-10">{mod.title}</h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed mb-6 relative z-10">
                {mod.detail}
              </p>
              <div className="mt-auto pt-6 border-t border-black/5">
                <p className="text-xs font-medium text-kira-brown">{mod.highlight}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Impact (ROI Metrics) */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto relative">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6 font-semibold text-center">
          The Impact
        </p>
        <h2 className="font-serif font-normal text-5xl md:text-7xl tracking-tight mb-16 text-center">
          Protect your margins<span className="text-kira-brown">.</span>
          <br className="hidden md:block" /> Scale without headcount
          <span className="text-kira-brown">.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mt-8">
          <div className="relative z-10">
            <div className="absolute top-[5%] bottom-[-5%] -left-3 -right-3 md:-left-4 md:-right-4 bg-[#8C987A] rounded-[32px] z-0 shadow-lg" />
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/40 backdrop-blur-3xl rounded-[32px] p-10 md:p-12 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-500 relative z-10">
              <div className="font-serif text-[100px] md:text-[120px] leading-none mb-4 tracking-tight text-[#111]">
                0
              </div>
              <h4 className="text-lg font-semibold mb-3 text-[#111]">SLA Penalties</h4>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Automated PO processing ensures you never miss a marketplace dispatch window again.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute top-[5%] bottom-[-5%] -left-3 -right-3 md:-left-4 md:-right-4 bg-[#8C987A] rounded-[32px] z-0 shadow-lg" />
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/40 backdrop-blur-3xl rounded-[32px] p-10 md:p-12 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-500 relative z-10 group">
              <div className="font-serif text-[100px] md:text-[120px] leading-none mb-4 tracking-tight text-[#111]">
                3x
              </div>
              <h4 className="text-lg font-semibold mb-3 text-[#111]">Faster Dispatch</h4>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Generate compliant barcodes, packing lists, and GST invoices instantly.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute top-[5%] bottom-[-5%] -left-3 -right-3 md:-left-4 md:-right-4 bg-[#8C987A] rounded-[32px] z-0 shadow-lg" />
            <div className="flex flex-col items-center justify-center h-full text-center bg-white/40 backdrop-blur-3xl rounded-[32px] p-10 md:p-12 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-500 relative z-10">
              <div className="font-serif text-[100px] md:text-[120px] leading-none mb-4 tracking-tight text-[#111]">
                100<span className="text-kira-brown text-[0.8em]">%</span>
              </div>
              <h4 className="text-lg font-semibold mb-3 text-[#111]">Compliance</h4>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                Eliminate costly marketplace returns and rejections due to human formatting errors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow (Interactive Tab Layout) */}
      <section
        id="workflow"
        className="py-24 md:py-40 px-6 md:px-12 max-w-7xl mx-auto border-t border-black/5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="font-serif font-normal text-5xl md:text-7xl tracking-tight mb-6 leading-tight">
              See the connected flow<span className="text-kira-brown text-[1.1em]">.</span>
            </h2>
            <p className="text-lg text-gray-500 font-light mb-12">
              One clean flow from catalog to dispatch, not just a feature list.
            </p>

            <div className="space-y-4">
              {workflowViews.map((view, i) => {
                const isActive = activeWorkflow === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveWorkflow(i)}
                    className={`w-full text-left flex items-start gap-6 border border-black/5 p-6 transition-all duration-300 rounded-2xl ${isActive ? "bg-white shadow-md ring-1 ring-kira-brown/20" : "bg-transparent hover:bg-white/50 hover:shadow-sm"}`}
                  >
                    <span
                      className={`text-sm font-medium mt-0.5 font-mono ${isActive ? "text-kira-brown" : "text-gray-400"}`}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <h4
                        className={`font-semibold mb-2 ${isActive ? "text-[#111]" : "text-gray-600"}`}
                      >
                        {view.label}
                      </h4>
                      <p
                        className={`text-sm font-light leading-relaxed ${isActive ? "text-gray-700" : "text-gray-400"}`}
                      >
                        {view.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              asChild
              className="mt-12 bg-white ring-1 ring-black/5 text-[#111] hover:bg-gray-50 rounded-full px-8 py-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Link href="/dashboard">See It in Action</Link>
            </Button>
          </div>

          <div className="relative z-10">
            {/* Solid Background Tile */}
            <div className="absolute top-[5%] bottom-[-5%] -left-4 -right-4 md:-left-8 md:-right-8 bg-[#8C987A] rounded-[32px] md:rounded-[64px] z-0 shadow-lg" />

            <div className="aspect-[3/4] rounded-[32px] md:rounded-[48px] overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-2 md:p-3 transition-transform duration-700 relative z-10">
              <div className="w-full h-full rounded-[24px] md:rounded-[40px] overflow-hidden bg-[#111] ring-1 ring-black/5 relative shadow-inner">
                {workflowViews.map((view, i) => (
                  <iframe
                    key={i}
                    src={view.animationSrc}
                    className={`absolute inset-0 w-full h-full border-0 pointer-events-none transition-opacity duration-700 ease-in-out ${activeWorkflow === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ops FAQ (Accordion) */}
      <section id="faq" className="py-24 md:py-40 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6 font-semibold">
          Ops FAQ
        </p>
        <h2 className="font-serif font-normal text-5xl md:text-7xl tracking-tight mb-6">
          What Grada is actually replacing<span className="text-kira-brown text-[1.1em]">.</span>
        </h2>
        <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto mb-16">
          Stop operating manually. Start operating at scale.
        </p>

        <div className="text-left bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 md:p-12 space-y-4">
          {playbookQuestions.map((q, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="border-b border-black/5 last:border-0 pb-4 last:pb-0">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left py-4 group"
                >
                  <h3
                    className={`font-semibold text-lg transition-colors duration-300 ${isOpen ? "text-kira-brown" : "text-[#111] group-hover:text-kira-brown"}`}
                  >
                    {q.title}
                  </h3>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#FAFAFA] ring-1 ring-black/5 transition-transform duration-300 ${isOpen ? "rotate-180 bg-kira-brown text-white ring-kira-brown" : ""}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[200px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-sm text-gray-500 font-light leading-relaxed pr-12">
                    {q.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ready to Scale & Checklist */}
      <section className="py-24 md:py-40 px-6 md:px-12 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="relative z-10">
            {/* Solid Background Tile */}
            <div className="absolute top-[5%] bottom-[-5%] -left-4 -right-4 md:-left-8 md:-right-8 bg-[#8C987A] rounded-[32px] md:rounded-[64px] z-0 shadow-lg" />

            <div className="aspect-[4/3] rounded-[32px] md:rounded-[48px] overflow-hidden bg-white/30 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-2 md:p-3 hover:-translate-y-2 transition-transform duration-700 relative z-10">
              <div className="w-full h-full rounded-[24px] md:rounded-[40px] overflow-hidden bg-white ring-1 ring-black/5 shadow-inner">
                <iframe
                  src={commercialInvoicesAnimationSrc}
                  className="w-full h-full border-0 pointer-events-none"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4 font-semibold">
              Ready to Scale
            </p>
            <h2 className="font-serif font-normal text-4xl md:text-5xl lg:text-[64px] leading-[1.05] tracking-tight mb-12">
              Stop operating manually<span className="text-kira-brown text-[1.1em]">.</span> Start
              operating at scale<span className="text-kira-brown text-[1.1em]">.</span>
            </h2>
            <div className="space-y-10">
              {coverageBlocks.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-[#111] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111]">{b.title}</p>
                    <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">
                      {b.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section className="py-32 md:py-48 px-6 md:px-12 max-w-4xl mx-auto text-center border-t border-black/5">
        <h2 className="font-serif font-normal text-5xl md:text-7xl tracking-tight mb-6">
          Start with the product, not a sales deck
          <span className="text-kira-brown text-[1.1em]">.</span>
        </h2>
        <p className="text-lg text-gray-500 font-light mb-12">
          Open the workflow, request access, or reach out directly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            className="bg-[#111] text-white hover:bg-black/80 rounded-full px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <Link href="/dashboard">Open the workflow</Link>
          </Button>
          <Button
            asChild
            className="bg-white ring-1 ring-black/5 text-[#111] hover:bg-gray-50 rounded-full px-8 py-6 text-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <Link href="/signup">Request Access</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/5 bg-white text-center text-sm text-gray-400">
        <p>© 2026 Grada Inc. All rights reserved.</p>
      </footer>
    </main>
  );
}
