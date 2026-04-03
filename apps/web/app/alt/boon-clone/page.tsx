import type { Metadata } from "next";
import Link from "next/link";
import { Sora } from "next/font/google";

import styles from "./boon-clone.module.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-boon",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "grada | Alternate Landing (Boon-style)",
  description: "Standalone Boon-inspired landing page concept for grada.",
};

const stats = [
  { value: "32%", label: "fewer estimating errors from structured reviews" },
  { value: "20+ hrs", label: "saved weekly by automating repetitive workflows" },
  { value: "52%", label: "faster dispatch readiness from a single data source" },
];

const solutions = [
  {
    title: "Brands & Manufacturers",
    text: "Automate catalog ingestion, PO checks, and dispatch paperwork from one shared record.",
    points: ["Smart Catalog", "PO Validation", "Invoice + Barcode Sync"],
  },
  {
    title: "3PL & Distribution Teams",
    text: "Run receiving, reconciliation, and document generation without spreadsheet drift.",
    points: ["Order Intake", "Exception Detection", "Dispatch Documents"],
  },
];

export default function BoonCloneLandingPage() {
  return (
    <main className={`${styles.page} ${sora.variable}`}>
      <div className={styles.gridBackdrop} aria-hidden />
      <header className={styles.navWrap}>
        <div className={styles.nav}>
          <div className={styles.logo}>grada</div>
          <nav className={styles.links}>
            <a href="#platform">Platform</a>
            <a href="#solutions">Solutions</a>
            <a href="#customers">Customers</a>
          </nav>
          <div className={styles.actions}>
            <Link href="/login" className={styles.ghostBtn}>
              Login
            </Link>
            <a href="#cta" className={styles.primaryBtn}>
              See grada
            </a>
          </div>
        </div>
      </header>

      <section className={styles.hero} id="platform">
        <p className={styles.kicker}>Warehouse & wholesale operations</p>
        <h1>
          The Intelligence Layer for <span>grada operations</span>
        </h1>
        <p className={styles.lede}>
          AI agents that run catalog, PO, and dispatch workflows from product intake to final
          shipment docs, so teams can focus on scale.
        </p>
        <div className={styles.heroCtas}>
          <a href="#cta" className={styles.primaryBtn}>
            Get a demo
          </a>
          <a href="#solutions" className={styles.secondaryBtn}>
            Explore workflows
          </a>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.pill}>Live Agent Run</div>
            <p>PO #GRA-14098 synced from inbound file</p>
          </div>
          <div className={styles.panelGrid}>
            <article>
              <h3>Smart Catalog</h3>
              <p>Images parsed and structured into one reusable product record.</p>
            </article>
            <article>
              <h3>PO Review</h3>
              <p>Line-level exceptions surfaced before invoice and barcode generation.</p>
            </article>
            <article>
              <h3>Dispatch Docs</h3>
              <p>Invoices, packing lists, and labels generated from approved source data.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        {stats.map((item) => (
          <article key={item.value}>
            <h2>{item.value}</h2>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <section className={styles.solutions} id="solutions">
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Solutions built for teams like yours</p>
          <h2>AI workflows purpose-built for high-volume ops</h2>
        </div>
        <div className={styles.solutionGrid}>
          {solutions.map((solution) => (
            <article key={solution.title} className={styles.solutionCard}>
              <h3>{solution.title}</h3>
              <p>{solution.text}</p>
              <ul>
                {solution.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <a href="#cta">Try this flow</a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.customers} id="customers">
        <p className={styles.kicker}>Trusted by modern operations teams</p>
        <div className={styles.logoRow}>
          <span>RAELI</span>
          <span>NOVA SUPPLY</span>
          <span>ARROW DISTRIBUTION</span>
          <span>ORBIT RETAIL</span>
          <span>BAYLINE LOGISTICS</span>
        </div>
        <blockquote>
          “grada feels like adding an operations co-pilot. We ship faster with fewer manual fixes
          every week.”
        </blockquote>
      </section>

      <section className={styles.finalCta} id="cta">
        <h2>Ready to transform wholesale operations?</h2>
        <p>
          The platform where your team, AI agents, and structured data work together from intake to
          dispatch.
        </p>
        <a href="#" className={styles.primaryBtn}>
          Book my demo
        </a>
      </section>
    </main>
  );
}
