import type { Metadata } from "next";
import Image from "next/image";
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
  description: "Standalone Boon-inspired page concept for grada.",
};

const features = [
  {
    icon: "◔",
    title: "Takeoff",
    description: "Reduce takeoff time by 90% with instant volume calculations from blueprints.",
  },
  {
    icon: "△",
    title: "Clash Detection",
    description: "Streamline workflows with flags that surface conflicts in specs early.",
  },
  {
    icon: "◫",
    title: "Bid Tracker",
    description: "Compare and analyze subcontractor proposals in seconds, not days.",
  },
  {
    icon: "▣",
    title: "Bid Leveling",
    description: "Choose the best bids with side-by-side vendor comparison.",
  },
];

const stats = [
  {
    value: "32%",
    text: "of construction cost overruns are due to estimating errors",
  },
  {
    value: "20+ hours",
    text: "a week are spent on repetitive tasks easily automated by A.I",
  },
  {
    value: "52%",
    text: "of project delays are caused by inaccurate takeoffs",
  },
];

export default function BoonCloneLandingPage() {
  return (
    <main className={`${styles.page} ${sora.variable}`}>
      <header className={styles.navWrap}>
        <div className={styles.nav}>
          <div className={styles.logo}>boon</div>
          <nav className={styles.links}>
            <a href="#">Platform ▾</a>
            <a href="#">Products ▾</a>
            <a href="#">Company ▾</a>
          </nav>
          <div className={styles.actions}>
            <Link href="/login" className={styles.loginBtn}>
              Login
            </Link>
            <a href="#" className={styles.primaryBtn}>
              See Boon
            </a>
          </div>
        </div>
      </header>

      <section className={styles.stats}>
        {stats.map((stat) => (
          <article key={stat.value} className={styles.statCard}>
            <h2>{stat.value}</h2>
            <p>{stat.text}</p>
          </article>
        ))}
      </section>

      <section className={styles.intro}>
        <h1>Solutions built for you</h1>
        <p>
          AI agents purpose-built for preconstruction
          <br />
          from takeoff to bid management.
        </p>
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${styles.tabActive}`}>
            General Contractors
          </button>
          <button type="button" className={styles.tab}>
            Subcontractors
          </button>
        </div>
      </section>

      <section className={styles.content}>
        <article className={styles.leftCol}>
          <h2>General Contractors</h2>
          <p className={styles.subhead}>
            Streamline your workflow, bid faster and drive more revenue.
          </p>
          <ul className={styles.featureList}>
            {features.map((item) => (
              <li key={item.title}>
                <h3>
                  <span className={styles.featureIcon}>{item.icon}</span>
                  {item.title}
                </h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
          <a href="#" className={styles.cta}>
            Try Boon on your drawings
          </a>
        </article>

        <article className={styles.rightCol}>
          <div className={styles.imageFrame}>
            <Image
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80"
              alt="Construction site framing"
              fill
              className={styles.heroImage}
              sizes="(max-width: 1100px) 100vw, 50vw"
            />
            <div className={styles.overlay}>
              <p className={styles.overlayTitle}>Automatic Clash Detection</p>
              <div className={styles.overlayRow}>
                <span>Conflict Flagged</span>
                <span>15 incidents</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
