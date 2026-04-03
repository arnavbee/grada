import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";

import styles from "./boon-clone.module.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-grada-alt",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "grada | Alternate Landing",
  description: "Boon-style structure tailored to grada content.",
};

const stats = [
  { value: "32%", text: "fewer data errors after a single PO review checkpoint" },
  { value: "20+ hours", text: "saved weekly by automating repetitive dispatch workflows" },
  { value: "52%", text: "faster dispatch readiness from one approved source of truth" },
];

const operationsFeatures = [
  {
    title: "Smart Catalog",
    text: "Extract and standardize product attributes from images and spreadsheets in one pass.",
  },
  {
    title: "Received PO Processing",
    text: "Detect mismatches early and lock one approved PO before downstream generation starts.",
  },
  {
    title: "Marketplace Exports",
    text: "Generate channel-ready export files from the same approved product record.",
  },
  {
    title: "Dispatch Documents",
    text: "Generate barcodes, invoices, packing lists, and stickers from approved data.",
  },
];

const logoItems = ["RAELI", "MYNTRA EXPORT TEAM", "AJIO OPS", "NYKAA SUPPLY", "FLIPKART OPS"];

export default function GradaBoonStructuredPage() {
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
            The Intelligence
            <br />
            layer for
            <br />
            <span>Wholesale Operations</span>
          </h1>
          <p>
            AI agents that run catalog, PO, and dispatch workflows from intake to outbound docs, so
            your team can focus on growth.
          </p>
          <div className={styles.heroActions}>
            <a href="#demo" className={styles.primaryBtn}>
              Get a demo
            </a>
            <a href="#products" className={styles.primaryBtn}>
              Try grada workflows
            </a>
          </div>
          <a href="#story" className={styles.primaryBtn}>
            See grada AI in action
          </a>
        </div>
        <div className={styles.heroVisual}>
          <Image
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80"
            alt="Warehouse operations"
            fill
            className={styles.heroImage}
            sizes="(max-width: 1200px) 100vw, 900px"
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
          <h2>The Hidden Costs of Manual Processes</h2>
          <p>Disconnected spreadsheets are costing operations teams speed and margin.</p>
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
          <h2>Solutions built for you</h2>
          <p>
            AI agents purpose-built for wholesale operations
            <br />
            from catalog to dispatch.
          </p>
          <div className={styles.tabs}>
            <button type="button" className={`${styles.tab} ${styles.tabActive}`}>
              Brands & Manufacturers
            </button>
            <button type="button" className={styles.tab}>
              Operations Teams
            </button>
          </div>
        </div>
      </section>

      {/* 3. Solutions split section */}
      <section className={styles.solutionSplit}>
        <article className={styles.solutionLeft}>
          <h2>Brands & Manufacturers</h2>
          <p>Streamline catalog-to-dispatch workflows and reduce downstream rework.</p>
          <ul>
            {operationsFeatures.map((feature) => (
              <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
          <a href="#demo" className={styles.primaryBtn}>
            Try grada on your workflow
          </a>
        </article>
        <article className={styles.solutionRight}>
          <div className={styles.solutionImageWrap}>
            <Image
              src="https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=1400&q=80"
              alt="Operations team in warehouse"
              fill
              className={styles.solutionImage}
              sizes="(max-width: 1200px) 100vw, 50vw"
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
          <h2>Built by operations experts and trusted by scaling teams</h2>
          <p>
            Purpose-built for catalog-heavy and dispatch-heavy businesses.
            <br />
            Trusted by teams who ship fast and stay accurate.
          </p>
        </div>
        <div className={styles.logoRail}>
          {[...logoItems, ...logoItems].map((logo, idx) => (
            <div key={`${logo}-${idx}`} className={styles.logoChip}>
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Testimonial */}
      <section className={styles.storySection} id="story">
        <div className={styles.storyHeader}>
          <h2>Hear from our customers</h2>
          <a href="#">See more ↗</a>
        </div>
        <div className={styles.storyCard}>
          <div className={styles.storyImage}>
            <Image
              src="https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=900&q=80"
              alt="Warehouse story"
              fill
              className={styles.storyImg}
              sizes="(max-width: 1200px) 100vw, 360px"
            />
            <div className={styles.storyBrand}>grada customer story</div>
          </div>
          <div className={styles.storyText}>
            <p className={styles.quoteMark}>“</p>
            <blockquote>
              grada acts as an operational co-pilot and helped us move from scattered spreadsheets
              to one reliable dispatch workflow.
            </blockquote>
            <h3>Operations Lead</h3>
            <p>House Of Raeli</p>
          </div>
        </div>
      </section>

      {/* 6. Final CTA + footer */}
      <section className={styles.footerZone} id="demo">
        <div className={styles.ctaPanel}>
          <h2>
            Ready to Transform
            <br />
            Wholesale Operations?
          </h2>
          <p>
            The platform where operators, agents, and structured data work together so your team
            ships faster, with fewer corrections.
          </p>
          <a href="#" className={styles.whiteBtn}>
            Get my Demo
          </a>
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
