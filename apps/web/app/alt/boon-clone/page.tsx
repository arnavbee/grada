import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { SyntheticEvent } from "react";
import { Manrope } from "next/font/google";

import styles from "./boon-clone.module.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-grada-alt",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "grada | Alternate Landing",
  description: "Grada predictive ops system landing page.",
};

const receivedPoProcessingAnimationSrc = "/marketing/grada-received-po-processing-animated.html";
const commercialInvoicesAnimationSrc = "/marketing/grada-commercial-invoices-autoplay.html";
const smartCatalogInfographicSrc = "/marketing/grada-smart-catalog-infographic.svg";
const onePipelineAnimationSrc = "/marketing/grada_one_pipeline.html";
const returnRiskAnimationSrc = "/marketing/grada_return_risk.html";
const demandSignalsAnimationSrc = "/marketing/grada_demand_signals.html";
const complianceDriftAnimationSrc = "/marketing/grada_compliance_drift.html";

const stats = [
  { value: "You know what sold last month.", text: "You don't know what's coming back." },
  {
    value: "You don't know which SKU Myntra penalizes next.",
    text: "You don't know if your packing spec is already outdated.",
  },
  {
    value: "ERPs tell you what happened.",
    text: "None of them tell you what's next.",
  },
];

const operationsFeatures = [
  {
    title: "Return Risk, Before It Hits",
    text: "Grada flags SKUs with high return probability before dispatch, using size curve, fabric type, listing quality, and historical return patterns.",
  },
  {
    title: "Demand Signals",
    text: "See reorder signals before stockouts happen. Grada reads PO history and sell-through data to surface what to move on next.",
  },
  {
    title: "Compliance Drift Detection",
    text: "Marketplace specs change without warning. Grada monitors drift and alerts you before non-compliant shipments trigger penalties or takedowns.",
  },
];

const marketplaceLogos = [
  {
    alt: "Myntra",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png",
    w: 90,
    h: 28,
  },
  {
    alt: "Ajio",
    src: "https://images.seeklogo.com/logo-png/34/1/ajio-logo-png_seeklogo-348946.png",
    w: 100,
    h: 26,
  },
  {
    alt: "Flipkart",
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Flipkart_logo_%282026%29.svg",
    w: 90,
    h: 26,
  },
  {
    alt: "Nykaa",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/00/Nykaa_New_Logo.svg",
    w: 85,
    h: 26,
  },
];

export default function GradaBoonStructuredPage() {
  const disableIframeScroll = (event: SyntheticEvent<HTMLIFrameElement>) => {
    const frame = event.currentTarget;
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.documentElement.style.overflow = "hidden";
    doc.documentElement.style.margin = "0";
    if (doc.body) {
      doc.body.style.overflow = "hidden";
      doc.body.style.margin = "0";
    }
  };

  return (
    <main className={`${styles.page} ${manrope.variable}`}>
      <header className={styles.navWrap}>
        <div className={styles.nav}>
          <div className={styles.logo}>grada</div>
          <nav className={styles.links}>
            <a href="#platform">Platform ▾</a>
            <a href="#products">Products ▾</a>
            <a href="#company">Company ▾</a>
          </nav>
          <div className={styles.actions}>
            <Link href="/login" className={styles.loginBtn}>
              Login
            </Link>
            <a href="#demo" className={styles.primaryBtn}>
              See grada
            </a>
          </div>
        </div>
      </header>

      {/* 1. Hero */}
      <section className={styles.heroSection} id="platform">
        <div className={styles.heroInner}>
          <h1>
            The ops layer
            <br />
            that
            <br />
            <span>thinks.</span>
          </h1>
          <p>
            Indian fashion brands run on five marketplaces, three ERPs, and one overworked ops
            person. Grada replaces the chaos with one pipeline and tells you what is going to happen
            before it does.
          </p>
          <div className={styles.heroActions}>
            <a href="#demo" className={styles.primaryBtn}>
              Request early access
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <iframe
            title="Grada one pipeline animation"
            src={onePipelineAnimationSrc}
            className={styles.visualFrame}
            loading="lazy"
            onLoad={disableIframeScroll}
            scrolling="no"
          />
          <div className={styles.heroOverlayRow}>
            <div className={styles.glassCard}>
              <h3>PO Batch A</h3>
              <p>₹23.8L</p>
              <small>Scope 95% • Timeline 16 weeks</small>
              <button type="button">Select Batch</button>
            </div>
            <div className={styles.glassCard}>
              <h3>PO Batch B</h3>
              <p>₹24.5L</p>
              <small>Scope 88% • Timeline 14 weeks</small>
              <button type="button">Select Batch</button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hidden costs + stats + section heading */}
      <section className={styles.costSection}>
        <div className={styles.sectionHeadingLeft}>
          <h2>
            Every ERP in the market tells you what happened. None of them tell you what is next.
          </h2>
          <p>
            You know what sold last month. You do not know what is coming back. You do not know
            which SKU will get penalized next week. You do not know if your packing spec is already
            outdated.
          </p>
        </div>
        <div className={styles.statsGrid}>
          {stats.map((stat) => (
            <article key={stat.value} className={styles.statCard}>
              <h3>{stat.value}</h3>
              <p>{stat.text}</p>
            </article>
          ))}
        </div>
        <div className={styles.solutionsCenter} id="products">
          <h2>One pipeline. Every marketplace.</h2>
          <p>
            Catalog uploads, PO review, barcodes, GST invoices, packing lists across Myntra, Ajio,
            Amazon IN, Flipkart, Nykaa. One place. No reformatting. No WhatsApp threads.
            <br />
            That is the foundation. Here is what it unlocks.
          </p>
        </div>
      </section>

      <section className={styles.valueGridSection}>
        <div className={styles.sectionHeadingLeft}>
          <h2>The Intelligence Layer</h2>
        </div>
        <div className={styles.valueGrid}>
          <article className={styles.valueCardLight}>
            <h3>Return Risk, Before It Hits</h3>
            <p>
              Flag return-prone SKUs before dispatch using size curve, fabric type, listing quality,
              and historical return behavior.
            </p>
            <div className={styles.valueAnimWrap}>
              <iframe
                title="Grada return risk animation"
                src={returnRiskAnimationSrc}
                className={styles.valueAnimFrame}
                loading="lazy"
                onLoad={disableIframeScroll}
                scrolling="no"
              />
            </div>
          </article>

          <article className={styles.valueCardDark}>
            <h3>Demand Signals</h3>
            <p>
              Surface reorder signals before stockouts by reading PO history and sell-through
              patterns across your catalogue.
            </p>
            <div className={styles.valueAnimWrapDark}>
              <iframe
                title="Grada demand signals animation"
                src={demandSignalsAnimationSrc}
                className={styles.valueAnimFrame}
                loading="lazy"
                onLoad={disableIframeScroll}
                scrolling="no"
              />
            </div>
          </article>

          <article className={styles.valueCardBeige}>
            <div className={styles.valueCardContent}>
              <h3>Compliance Drift Detection</h3>
              <p>
                Detect marketplace spec drift before non-compliant shipments cost penalties or
                listing takedowns.
              </p>
            </div>
            <div className={styles.valueVisualWrap}>
              <iframe
                title="Grada compliance drift animation"
                src={complianceDriftAnimationSrc}
                className={styles.valueAnimFrame}
                loading="lazy"
                onLoad={disableIframeScroll}
                scrolling="no"
              />
            </div>
          </article>

          <article className={styles.valueCardLight}>
            <h3>Why this works</h3>
            <p>
              We built the plumbing first: every PO, dispatch, and return event passes through one
              schema, so intelligence can run reliably on top.
            </p>
            <div className={styles.valueIconGrid} aria-hidden />
          </article>
        </div>
      </section>

      {/* 3. Solutions split section */}
      <section className={styles.solutionSplit}>
        <article className={styles.solutionLeft}>
          <h2>Why It Is Different</h2>
          <p>
            Every ERP sees your data after the fact. Marketplace dashboards tell you what sold.
            Grada tells you what is going to happen.
          </p>
          <ul>
            {operationsFeatures.map((feature) => (
              <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
          <a href="#demo" className={styles.primaryBtn}>
            Request early access
          </a>
        </article>
        <article className={styles.solutionRight}>
          <div className={styles.solutionImageWrap}>
            <iframe
              title="Grada received PO processing animation"
              src={receivedPoProcessingAnimationSrc}
              className={styles.visualFrame}
              loading="lazy"
              onLoad={disableIframeScroll}
              scrolling="no"
            />
            <div className={styles.solutionOverlay}>
              <p>Automatic PO Validation</p>
              <div>
                <span>Mismatch Flagged</span>
                <span>15 incidents</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 4. Trusted logos */}
      <section className={styles.trustedSection} id="company">
        <div className={styles.sectionHeadingLeft}>
          <h2>Who It Is For</h2>
          <p>
            D2C and wholesale fashion brands selling on two or more Indian marketplaces. 50 to 5,000
            SKUs. One ops person trying to hold it together, or a small team doing the same work
            five times over.
            <br />
            If you are still reformatting catalog sheets for each platform, Grada is built for you.
          </p>
        </div>
        <div className={styles.logoRail}>
          {[...marketplaceLogos, ...marketplaceLogos].map((logo, idx) => (
            <div key={`${logo.alt}-${idx}`} className={styles.logoChip}>
              <Image alt={logo.alt} src={logo.src} width={logo.w} height={logo.h} unoptimized />
            </div>
          ))}
        </div>
      </section>

      {/* 5. Testimonial */}
      <section className={styles.storySection} id="story">
        <div className={styles.storyHeader}>
          <h2>No other tool has this schema.</h2>
          <a href="#demo">Why it matters ↗</a>
        </div>
        <div className={styles.storyCard}>
          <div className={styles.storyImage}>
            <Image
              src={smartCatalogInfographicSrc}
              alt="Grada smart catalog infographic"
              fill
              className={styles.storyImg}
              sizes="(max-width: 1200px) 100vw, 360px"
            />
            <div className={styles.storyBrand}>grada customer story</div>
          </div>
          <div className={styles.storyText}>
            <p className={styles.quoteMark}>“</p>
            <blockquote>
              This is not a pivot away from your workflow engine. This is a positioning pivot on top
              of existing capabilities: the ops pipeline first, intelligence layer as premium.
            </blockquote>
            <h3>Core Wedge</h3>
            <p>One pipeline, then predictive decisions.</p>
          </div>
        </div>
      </section>

      {/* 6. Final CTA + footer */}
      <section className={styles.footerZone} id="demo">
        <div className={styles.ctaPanel}>
          <h2>
            Your ops team should not be reformatting spreadsheets.
            <br />
            They should be making decisions.
          </h2>
          <p>Get early access.</p>
          <a href="#" className={styles.whiteBtn}>
            Get early access
          </a>
          <div className={styles.ctaVisual}>
            <iframe
              title="Grada commercial invoices animation"
              src={commercialInvoicesAnimationSrc}
              className={styles.visualFrame}
              loading="lazy"
              onLoad={disableIframeScroll}
              scrolling="no"
            />
          </div>
        </div>

        <footer className={styles.footer}>
          <div>
            <h4>Platform</h4>
            <a href="#">Smart Catalog</a>
            <a href="#">PO Processing</a>
            <a href="#">Dispatch Docs</a>
            <a href="#">Audit Trail</a>
          </div>
          <div>
            <h4>Products</h4>
            <a href="#">Marketplace Exports</a>
            <a href="#">Barcodes</a>
            <a href="#">Invoices</a>
            <a href="#">Packing Lists</a>
            <a href="#">Stickers</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
          </div>
        </footer>

        <div className={styles.footerBottom}>
          <div>
            <p className={styles.footerBrand}>grada</p>
            <p>© 2026 grada.ai • Terms & Conditions • Privacy Policy</p>
          </div>
          <div className={styles.footerSocial}>f x in</div>
        </div>
      </section>
    </main>
  );
}
