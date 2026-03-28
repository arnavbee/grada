import type { CSSProperties } from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Grada — Fashion Operations, Automated",
  description:
    "AI-powered workflows for catalog, marketplace exports, received POs, barcodes, invoices, and packing lists.",
};

const stats = [
  { value: "6", label: "Marketplace channels supported" },
  { value: "5", label: "Document types generated end-to-end" },
  { value: "0", label: "Manual spreadsheets needed" },
  { value: "AI", label: "Attribute extraction from product images" },
];

const problems = [
  {
    number: "01",
    title: "Catalog data lives in a hundred WhatsApp threads.",
    detail:
      "Style names, fabric compositions, and size breakdowns are scattered, never where you need them.",
  },
  {
    number: "02",
    title: "Every marketplace export is a manual rebuild.",
    detail:
      "Myntra wants one format, Ajio another, Nykaa a third. Your team re-enters the same data again and again.",
  },
  {
    number: "03",
    title: "PO to dispatch takes days of grunt work.",
    detail:
      "Barcodes, GST invoices, and packing lists are created separately, each a fresh source of errors.",
  },
];

const features = [
  {
    icon: "✦",
    title: "Smart Catalog",
    detail:
      "AI analyzes product images and auto-fills category, color, fabric, composition, and style name. Your team reviews, corrects, and the system learns.",
    bullets: [
      "Auto-generated style codes with pattern rules",
      "Confidence-aware AI suggestions",
      "Correction logging for continuous improvement",
      "Product measurements and image attachment",
    ],
  },
  {
    icon: "◈",
    title: "Marketplace Export Engine",
    detail:
      "Build your catalog once and export it to every channel with exact format compliance, without reformatting or re-entry.",
    bullets: [
      "Myntra, Ajio, Amazon IN, Flipkart, Nykaa",
      "Validation before every export",
      "Full export history",
      "Generic format for custom channels",
    ],
  },
  {
    icon: "▣",
    title: "PO Format Builder",
    detail:
      "Create purchase-order request workbooks directly from catalog data. Configure defaults once and generate exact XLSX files instantly.",
    bullets: [
      "Attribute extraction with row review",
      "Default price, OSP, fabric, and size ratios",
      "Exact XLSX format output",
    ],
  },
  {
    icon: "⊞",
    title: "Received PO Processing",
    detail:
      "Upload marketplace POs in PDF, XLS, or XLSX. Grada parses, validates, and routes them into your downstream workflow.",
    bullets: [
      "Durable background parsing",
      "Review and edit before confirmation",
      "Styli and custom vendor format support",
      "Status tracking throughout",
    ],
  },
  {
    icon: "◉",
    title: "Barcode Generation",
    detail:
      "Generate print-ready barcode PDFs directly from confirmed POs using the built-in Styli format or your own sticker template.",
    bullets: [
      "Custom sticker template builder",
      "Visual canvas with dynamic fields",
      "Job tracking and regeneration flows",
      "Full barcode history with direct download",
    ],
  },
  {
    icon: "◻",
    title: "GST Invoices & Packing Lists",
    detail:
      "Auto-generate compliant invoices and packing lists from PO data, with tax handling and carton workflows built in.",
    bullets: [
      "CGST + SGST for intrastate, IGST for interstate",
      "Carton auto-assignment by category",
      "Amount-in-words generation",
      "Durable PDF storage via R2",
    ],
  },
];

const workflow = [
  {
    number: "01",
    title: "Add to Catalog",
    detail: "Upload product images. AI extracts attributes. You review and confirm.",
  },
  {
    number: "02",
    title: "Receive PO",
    detail: "Upload your marketplace PO file. Grada parses and surfaces it for review.",
  },
  {
    number: "03",
    title: "Generate Barcodes",
    detail: "One click. Print-ready barcode PDFs for every SKU in the PO.",
  },
  {
    number: "04",
    title: "Create Invoice",
    detail: "GST-compliant invoice auto-populated from PO data with automatic tax mode handling.",
  },
  {
    number: "05",
    title: "Pack & Dispatch",
    detail:
      "Packing list generated with carton assignment. Everything stays archived and downloadable.",
  },
];

const platforms = ["Myntra", "Ajio", "Amazon IN", "Flipkart", "Nykaa", "Generic"];

const revealStyle = (delayMs: number): CSSProperties => ({
  animationDelay: `${delayMs}ms`,
});

export default function LandingPage(): JSX.Element {
  return (
    <main
      className={`${dmSans.className} min-h-screen bg-[#faf8f4] text-[#0d0c0a]`}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(201, 168, 76, 0.08), transparent 24%), linear-gradient(180deg, #faf8f4 0%, #f5f0e8 100%)",
      }}
    >
      <div className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[rgba(250,248,244,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 pr-20 md:px-10 md:pr-24">
          <Link
            className={`${playfair.className} text-[1.55rem] font-black tracking-[-0.03em] text-[#0d0c0a]`}
            href="/"
          >
            Grad<span className="text-[#c9a84c]">a</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              className="rounded-full border border-black px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#0d0c0a] transition hover:bg-black hover:text-[#faf8f4]"
              href="/login"
            >
              Sign In
            </Link>
            <Link
              className="rounded-full bg-black px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#faf8f4] transition hover:bg-[#2a2820]"
              href="/signup"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden px-5 pb-24 pt-32 md:px-10 md:pb-16 md:pt-40">
        <div className="mx-auto max-w-[1440px]">
          <div
            className={`${playfair.className} pointer-events-none absolute left-1/2 top-[54%] hidden -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(88px,18vw,260px)] font-black tracking-[-0.06em] text-transparent md:block`}
            style={{ WebkitTextStroke: "1px rgba(13,12,10,0.05)" }}
          >
            GRADA
          </div>

          <div className="relative z-10 max-w-5xl">
            <div
              className="animate-[modal-open_700ms_ease-out_both] text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#c9a84c]"
              style={revealStyle(80)}
            >
              <span className="mr-3 inline-block h-px w-9 bg-[#c9a84c] align-middle" />
              Fashion Operations Platform
            </div>

            <h1
              className={`${playfair.className} animate-[modal-open_700ms_ease-out_both] mt-8 max-w-4xl text-[clamp(3rem,6vw,5.7rem)] font-black leading-[0.98] tracking-[-0.04em] text-[#0d0c0a]`}
              style={revealStyle(160)}
            >
              From catalog
              <br />
              to dispatch —
              <br />
              <em className="font-normal italic text-[#c9a84c]">automated.</em>
            </h1>

            <p
              className="animate-[modal-open_700ms_ease-out_both] mt-8 max-w-2xl text-[1.05rem] font-light leading-8 text-[#7a7268] md:text-[1.12rem]"
              style={revealStyle(260)}
            >
              Grada replaces the spreadsheet chaos behind Indian fashion brands with AI-powered
              workflows for catalog, purchase orders, barcodes, invoices, and packing lists.
            </p>

            <div
              className="animate-[modal-open_700ms_ease-out_both] mt-10 flex flex-wrap gap-3"
              style={revealStyle(340)}
            >
              <Link
                className="rounded-full bg-black px-7 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-[#faf8f4] transition hover:bg-[#2a2820]"
                href="/dashboard"
              >
                See It in Action
              </Link>
              <Link
                className="rounded-full border border-black/10 px-7 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-[#0d0c0a] transition hover:border-black"
                href="#features"
              >
                Explore Features
              </Link>
            </div>
          </div>

          <div className="mt-20 hidden items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-[#7a7268] md:flex">
            <span>Scroll to explore</span>
            <span className="inline-block h-px w-16 animate-[kira-pulse-bar_2.2s_ease-in-out_infinite] bg-[#7a7268]" />
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 px-0">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              className="animate-[modal-open_700ms_ease-out_both] border-r border-black/10 px-5 py-10 last:border-r-0 md:px-8"
              key={stat.label}
              style={revealStyle(120 + index * 80)}
            >
              <div className={`${playfair.className} text-4xl font-bold tracking-[-0.04em]`}>
                {stat.value}
              </div>
              <p className="mt-2 max-w-[14rem] text-[0.8rem] leading-5 text-[#7a7268]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0d0c0a] px-5 py-24 text-[#faf8f4] md:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#e8d5a3]">
            <span className="mr-3 inline-block h-px w-6 bg-[#e8d5a3] align-middle" />
            The Problem
          </div>
          <h2
            className={`${playfair.className} mt-6 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#faf8f4]`}
          >
            Fashion ops is still
            <br />
            <em className="font-normal italic text-[#e8d5a3]">running on chaos.</em>
          </h2>

          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">
            {problems.map((problem, index) => (
              <article
                className="animate-[modal-open_700ms_ease-out_both] border border-white/5 bg-white/[0.04] p-8"
                key={problem.number}
                style={revealStyle(160 + index * 100)}
              >
                <div
                  className={`${playfair.className} text-5xl font-black leading-none text-white/10`}
                >
                  {problem.number}
                </div>
                <p className="mt-5 text-[1rem] leading-7 text-white/70">
                  <strong className="font-medium text-[#faf8f4]">{problem.title}</strong>{" "}
                  {problem.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-10" id="features">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-2xl">
            <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#c9a84c]">
              <span className="mr-3 inline-block h-px w-6 bg-[#c9a84c] align-middle" />
              What We&apos;ve Built
            </div>
            <h2
              className={`${playfair.className} mt-6 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0d0c0a]`}
            >
              One platform.
              <br />
              <em className="font-normal italic text-[#c9a84c]">Every operation.</em>
            </h2>
            <p className="mt-5 max-w-xl text-[1.02rem] leading-8 text-[#7a7268]">
              Grada connects the full workflow, from the moment a product is added to catalog to the
              moment a packing list is signed and shipped.
            </p>
          </div>

          <div className="mt-16 grid gap-px border border-black/10 bg-black/10 md:grid-cols-2">
            {features.map((feature, index) => (
              <article
                className="animate-[modal-open_700ms_ease-out_both] bg-[#faf8f4] p-8 transition hover:bg-[#f5f0e8] md:p-12"
                key={feature.title}
                style={revealStyle(120 + index * 70)}
              >
                <div className="flex h-10 w-10 items-center justify-center border border-black/10 text-lg">
                  {feature.icon}
                </div>
                <h3
                  className={`${playfair.className} mt-7 text-[1.5rem] font-bold tracking-[-0.02em] text-[#0d0c0a]`}
                >
                  {feature.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-7 text-[#7a7268]">{feature.detail}</p>
                <ul className="mt-5 space-y-2">
                  {feature.bullets.map((bullet) => (
                    <li
                      className="flex items-start gap-3 text-[0.86rem] leading-6 text-[#7a7268]"
                      key={bullet}
                    >
                      <span className="mt-0.5 text-[#c9a84c]">—</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f0e8] px-5 py-24 md:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#c9a84c]">
            <span className="mr-3 inline-block h-px w-6 bg-[#c9a84c] align-middle" />
            The Workflow
          </div>
          <h2
            className={`${playfair.className} mt-6 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0d0c0a]`}
          >
            From upload to dispatch
            <br />
            in <em className="font-normal italic text-[#c9a84c]">five steps.</em>
          </h2>

          <div className="relative mt-16 grid gap-8 md:grid-cols-5 md:gap-4">
            <div className="absolute left-[2.5%] right-[2.5%] top-2 hidden h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent md:block" />
            {workflow.map((step, index) => (
              <article
                className="animate-[modal-open_700ms_ease-out_both] relative px-0 md:px-4"
                key={step.number}
                style={revealStyle(120 + index * 80)}
              >
                <div className="relative z-10 h-3.5 w-3.5 rounded-full bg-[#c9a84c]" />
                <div className="mt-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-[#c9a84c]">
                  {step.number}
                </div>
                <h3
                  className={`${playfair.className} mt-2 text-[1.08rem] font-bold tracking-[-0.02em] text-[#0d0c0a]`}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.84rem] leading-6 text-[#7a7268]">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[1fr_1fr] md:items-center md:gap-20">
          <div>
            <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#c9a84c]">
              <span className="mr-3 inline-block h-px w-6 bg-[#c9a84c] align-middle" />
              Integrations
            </div>
            <h2
              className={`${playfair.className} mt-6 text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0d0c0a]`}
            >
              Built for where
              <br />
              <em className="font-normal italic text-[#c9a84c]">India sells fashion.</em>
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] leading-8 text-[#7a7268]">
              Grada&apos;s export engine supports every major Indian fashion marketplace out of the
              box, with the exact formats each platform requires.
            </p>
          </div>

          <div className="grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 md:grid-cols-3">
            {platforms.map((platform, index) => (
              <div
                className="animate-[modal-open_700ms_ease-out_both] bg-[#faf8f4] px-5 py-7 text-center text-[0.82rem] font-medium tracking-[0.04em] text-[#0d0c0a] transition hover:bg-[#f5f0e8]"
                key={platform}
                style={revealStyle(100 + index * 60)}
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0d0c0a] px-5 py-24 text-center md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className={`${playfair.className} text-8xl leading-[0.6] text-[#c9a84c]`}>"</div>
          <blockquote
            className={`${playfair.className} mx-auto mt-4 max-w-3xl text-[clamp(1.6rem,3vw,2.4rem)] font-normal italic leading-[1.45] tracking-[-0.02em] text-[#faf8f4]`}
          >
            Brands don&apos;t fail because the product isn&apos;t good. They fail because operations{" "}
            <em className="not-italic text-[#e8d5a3]">eat the team alive</em> before the product can
            scale.
          </blockquote>
          <p className="mt-8 text-[0.78rem] uppercase tracking-[0.18em] text-white/35">
            — Why we built Grada
          </p>
        </div>
      </section>

      <section className="px-5 py-24 text-center md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#c9a84c]">
            Get Started
          </div>
          <h2
            className={`${playfair.className} mx-auto mt-6 max-w-3xl text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0d0c0a]`}
          >
            Stop operating manually.
            <br />
            <em className="font-normal italic text-[#c9a84c]">Start operating at scale.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[0.98rem] leading-8 text-[#7a7268]">
            Grada is built for Indian wholesale and D2C fashion brands ready to automate the
            operations layer.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-full bg-black px-7 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-[#faf8f4] transition hover:bg-[#2a2820]"
              href="/signup"
            >
              Request Access
            </Link>
            <a
              className="rounded-full border border-black/10 px-7 py-4 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-[#0d0c0a] transition hover:border-black"
              href="mailto:hello@arnavb.xyz"
            >
              Talk to the Founder
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <Link
            className={`${playfair.className} text-[1.15rem] font-black tracking-[-0.03em] text-[#0d0c0a]`}
            href="/"
          >
            Grad<span className="text-[#c9a84c]">a</span>
          </Link>
          <p className="text-[0.78rem] text-[#7a7268]">
            Fashion operations, automated. Built in India.
          </p>
          <p className="text-[0.74rem] text-[#7a7268]">© 2026 Grada</p>
        </div>
      </footer>
    </main>
  );
}
