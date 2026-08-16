"use client";

import Link from "next/link";

import { ExploreDemoButton } from "@/src/components/demo/explore-demo-button";

export default function DemoPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-kira-offwhite text-kira-black">
      {/* Top Navbar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          className="flex items-center gap-2 text-xl font-serif font-bold tracking-tight"
          href="/"
        >
          <span className="text-kira-brown">✦</span> GRADA
        </Link>

        <Link
          className="kira-focus-ring rounded-full border border-kira-warmgray/40 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-kira-darkgray hover:bg-kira-warmgray/20 transition-colors"
          href="/"
        >
          ← Back to Main Site
        </Link>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          <span>✦</span> Portfolio Demo Workspace
        </div>

        <h1 className="mt-6 font-serif text-4xl sm:text-6xl font-normal leading-[1.1] text-kira-black">
          See the operational flow in action — <br className="hidden sm:inline" />
          <span className="italic text-kira-brown">not an empty dashboard.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-kira-darkgray">
          Launch a fully pre-populated Nivara Studio workspace. Test live AI vision analysis, review
          parsed marketplace purchase orders, and generate compliance documents instantly.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ExploreDemoButton
            className="h-12 rounded-full px-8 text-base shadow-md hover:shadow-lg transition-all"
            label="Launch Interactive Demo"
          />
        </div>

        <p className="mt-4 text-xs text-kira-midgray">
          No sign up, credit card, or file uploads required • Instant setup with synthetic demo data
        </p>
      </section>

      {/* Features Grid */}
      <section className="border-t border-kira-warmgray/30 bg-white/50 dark:bg-zinc-900/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-kira-black">What you can test in the demo</h2>
            <p className="mt-2 text-sm text-kira-midgray">
              Experience end-to-end wholesale apparel automation features
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="surface-card rounded-2xl p-6 border border-kira-warmgray/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 text-lg">
                ✦
              </div>
              <h3 className="mt-4 font-serif text-xl text-kira-black">AI Vision Cataloging</h3>
              <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
                Run live GPT-4 Vision analysis on preloaded garment images to extract colors,
                fabrics, weave types, and confidence scores.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="surface-card rounded-2xl p-6 border border-kira-warmgray/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 text-lg">
                📄
              </div>
              <h3 className="mt-4 font-serif text-xl text-kira-black">Marketplace PO Parsing</h3>
              <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
                Review parsed distributor POs (e.g. Styli), resolve line item discrepancies, and
                match SKU colors automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="surface-card rounded-2xl p-6 border border-kira-warmgray/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 text-lg">
                🏷️
              </div>
              <h3 className="mt-4 font-serif text-xl text-kira-black">Document Generation</h3>
              <p className="mt-2 text-sm leading-relaxed text-kira-darkgray">
                Generate barcode sticker sheets, commercial invoices, and packing lists ready for
                warehouse execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Contents Box */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="surface-card rounded-3xl border border-amber-500/30 p-8 sm:p-12 text-center bg-gradient-to-b from-amber-500/5 to-transparent">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kira-brown">
            Included in your session
          </span>
          <h2 className="mt-3 font-serif text-3xl text-kira-black">Pre-populated Demo Assets</h2>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 p-4 border border-kira-warmgray/30">
              <span className="text-xl">👗</span>
              <div>
                <h4 className="font-semibold text-sm text-kira-black">3 Apparel Products</h4>
                <p className="text-xs text-kira-darkgray">Midi Dress, Maxi Dress, Linen Cord Set</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 p-4 border border-kira-warmgray/30">
              <span className="text-xl">📋</span>
              <div>
                <h4 className="font-semibold text-sm text-kira-black">1 Draft Purchase Order</h4>
                <p className="text-xs text-kira-darkgray">
                  Pre-filled size ratios, OSP prices, and line item rows
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 p-4 border border-kira-warmgray/30">
              <span className="text-xl">🚚</span>
              <div>
                <h4 className="font-semibold text-sm text-kira-black">2 Distributor POs</h4>
                <p className="text-xs text-kira-darkgray">
                  Styli distributor POs with exception handling
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 p-4 border border-kira-warmgray/30">
              <span className="text-xl">✦</span>
              <div>
                <h4 className="font-semibold text-sm text-kira-black">Guided Walkthrough</h4>
                <p className="text-xs text-kira-darkgray">
                  Interactive overlay explaining features step-by-step
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <ExploreDemoButton
              className="h-12 rounded-full px-8 text-base"
              label="Explore Nivara Studio Demo →"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
