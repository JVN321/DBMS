"use client";

import { useEffect, useMemo, useState } from "react";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  GitBranch,
  Layers,
  Lock,
  Network,
  Pause,
  Play,
  Search,
  ShieldAlert,
} from "lucide-react";

import CyberNetworkCanvas from "./CyberNetworkCanvas";

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-ppt-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ppt-mono",
  weight: ["400", "500", "600"],
});

const SLIDES = [
  {
    id: "opening",
    navLabel: "Opening",
    kicker: "Slide 01  Opening",
    title: "DBMS Presentation Mode",
    summary:
      "Structured storytelling for demonstrations while the classic page stays concise and easy to scan.",
    detailPairs: [
      {
        term: "Presentation-first",
        value: "10 curated slides with speaker-focused pacing",
      },
      {
        term: "Dual experience",
        value: "Classic page for quick reading, deck for guided demos",
      },
      {
        term: "Flexible control",
        value: "Keyboard navigation plus optional autoplay mode",
      },
    ],
    bullets: [
      "Use Arrow Up/Down, PageUp/PageDown, or Space to navigate.",
      "Each section combines audience content with a presenter note panel.",
      "Autoplay supports hands-free classroom or stakeholder walkthroughs.",
    ],
    metrics: [
      { label: "Deck Format", value: "10 slides" },
      { label: "Demo Control", value: "Keyboard + Auto" },
      { label: "Audience Mode", value: "Story-first" },
    ],
    highlights: [
      "Reader-friendly classic page",
      "Deep technical material moved here",
      "Live demo and narration aligned",
    ],
    panelTitle: "Presenter Cues",
    panelItems: [
      "Open with the core problem: blockchain flows are hard to inspect manually.",
      "Set expectation: this deck carries the full technical depth from schema to API.",
      "Tell the audience each slide maps to one speaking segment.",
    ],
    icon: ShieldAlert,
  },
  {
    id: "challenge",
    navLabel: "Challenge",
    kicker: "Slide 02  Problem",
    title: "Why Traditional Monitoring Fails",
    summary:
      "Fraud patterns hide in topology, timing, and degree relationships that flat tables do not expose.",
    detailPairs: [
      {
        term: "Row-level blind spot",
        value: "Isolated transactions hide multi-hop laundering behavior",
      },
      {
        term: "Scale pressure",
        value: "Investigators cannot manually trace thousands of edges quickly",
      },
      {
        term: "Need",
        value: "Graph-native visibility with explainable prioritization",
      },
    ],
    bullets: [
      "Layering patterns span multiple wallets and multiple hops.",
      "High fan-out and fan-in behavior can look normal in isolated transactions.",
      "Manual review does not scale to thousands of edges per investigation.",
    ],
    metrics: [
      { label: "Typical Dataset", value: "1,800+ wallets" },
      { label: "Signal Type", value: "Graph structure" },
      { label: "Investigator Need", value: "Fast context" },
    ],
    panelTitle: "Speaker Notes",
    panelItems: [
      "Contrast row-level reports vs relationship-level reasoning.",
      "Mention that suspicious behavior is often emergent, not explicit.",
      "Transition to architecture by asking: how do we model this naturally?",
    ],
    icon: Search,
  },
  {
    id: "pipeline",
    navLabel: "Pipeline",
    kicker: "Slide 03  Architecture",
    title: "From Upload to Investigation Evidence",
    summary:
      "The backend pipeline parses files, builds an idempotent Neo4j graph, and serves enriched investigation views.",
    detailPairs: [
      {
        term: "Batch ingestion",
        value: "UNWIND + MERGE writes transactions in batches of 1,000",
      },
      {
        term: "Input support",
        value: "Internal CSV/JSON and auto-detected BigQuery Ethereum exports",
      },
      {
        term: "Operational guardrail",
        value: "50 MB default upload limit in admin settings",
      },
      {
        term: "Serving layer",
        value: "Fastify APIs expose graph, suspicious, wallet, stats, and admin routes",
      },
    ],
    bullets: [
      "Ingest CSV or JSON and normalize transaction fields.",
      "Map wallets and transfers into Neo4j nodes and edges.",
      "Run detection, scoring, and clustering before visualization.",
    ],
    metrics: [
      { label: "Storage", value: "Neo4j graph" },
      { label: "API Layer", value: "Fastify" },
      { label: "Frontend", value: "Next.js" },
    ],
    snippetLabel: "Ingestion core (schema.md)",
    snippet: `UNWIND $transactions AS tx
MERGE (from:Wallet {address: tx.wallet_from})
MERGE (to:Wallet   {address: tx.wallet_to})
MERGE (from)-[t:TRANSFER {txid: tx.transaction_id}]->(to)
ON CREATE SET t.amount = toFloat(tx.amount), t.timestamp = tx.timestamp`,
    panelTitle: "Live Demo Script",
    panelItems: [
      "Show one upload example and explain idempotent merge behavior.",
      "Call out that transactions become first-class graph edges.",
      "Set up next slide: now we can detect risk patterns automatically.",
    ],
    icon: Database,
  },
  {
    id: "model",
    navLabel: "Data Model",
    kicker: "Slide 04  Schema",
    title: "Neo4j Data Model for Forensic Work",
    summary:
      "Core entities and constraints are optimized for consistent ingestion, fast lookup, and traceable transfer relationships.",
    detailPairs: [
      {
        term: "Node labels",
        value: "Wallet(address), Coin(name), User(username/email/role)",
      },
      {
        term: "Relationship types",
        value: "TRANSFER carries txid, amount, value_lossless, timestamp, coin_type",
      },
      {
        term: "Uniqueness",
        value: "Wallet.address, Coin.name, User.username, and User.email",
      },
      {
        term: "Indexes",
        value: "TRANSFER.timestamp and TRANSFER.txid for time and hash lookup",
      },
    ],
    bullets: [
      "MERGE-based writes keep uploads idempotent and safe to replay.",
      "USES edges connect wallets to coin context for cross-asset analysis.",
      "User nodes keep role and account state in the same graph environment.",
    ],
    metrics: [
      { label: "Node Types", value: "3" },
      { label: "Relationship Types", value: "2" },
      { label: "Unique Constraints", value: "4" },
    ],
    highlights: [
      "Directed multigraph structure",
      "Coin-aware relationships",
      "Index-backed retrieval",
    ],
    snippetLabel: "Entity relationship map",
    snippet: `(Wallet)-[:TRANSFER {txid, amount, timestamp, coin_type}]->(Wallet)
(Wallet)-[:USES]->(Coin)
(User {role, is_banned, preferences})`,
    panelTitle: "Schema Notes",
    panelItems: [
      "Explain why txid is embedded on TRANSFER for direct traceability.",
      "Mention value_lossless preservation for precision-safe Ethereum imports.",
      "Transition to detectors that operate on this graph topology.",
    ],
    icon: Layers,
  },
  {
    id: "detection",
    navLabel: "Detection",
    kicker: "Slide 05  Threat Engine",
    title: "Pattern Detection with Query-Level Explainability",
    summary:
      "Detection logic in backend/services/detection.js uses Cypher patterns tailored to laundering and relay behaviors.",
    detailPairs: [
      {
        term: "Circular detector",
        value: "MATCH path = (w)-[:TRANSFER*2..6]->(w) for looped flows",
      },
      {
        term: "Fan-out / fan-in",
        value: "Default threshold 5 for unusual distribution or aggregation hubs",
      },
      {
        term: "Rapid relay",
        value: "A->B->C forwarding window defaults to 60 seconds",
      },
      {
        term: "Dense cluster",
        value: "Both in-degree and out-degree must pass threshold (default 3)",
      },
    ],
    bullets: [
      "Circular transfer chains reveal layering attempts.",
      "Fan-out and fan-in identify distribution and aggregation hubs.",
      "Rapid relay windows highlight automation and mule behavior.",
    ],
    metrics: [
      { label: "Detectors", value: "5 core rules" },
      { label: "Default Window", value: "60 seconds" },
      { label: "Output", value: "Explainable flags" },
    ],
    snippetLabel: "Rapid transfer excerpt (queries.md)",
    snippet: `MATCH (a:Wallet)-[t1:TRANSFER]->(b:Wallet)-[t2:TRANSFER]->(c:Wallet)
WHERE a <> c
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) >= 0
  AND toInteger(t2.timestamp) - toInteger(t1.timestamp) <= toInteger($windowSeconds)
RETURN a.address AS from, b.address AS via, c.address AS to`,
    panelTitle: "Narration Tips",
    panelItems: [
      "Explain one detector deeply instead of reading all five.",
      "Tie every flagged pattern back to a real investigation scenario.",
      "Bridge to scoring: how should analysts prioritize what to inspect first?",
    ],
    icon: Activity,
  },
  {
    id: "scoring",
    navLabel: "Scoring",
    kicker: "Slide 06  Prioritization",
    title: "Composite Risk Scoring (0 to 100)",
    summary:
      "A four-factor scoring model converts graph structure into ranked investigation priority without per-wallet query overhead.",
    detailPairs: [
      { term: "Fan-out", value: "min(25, outDeg * 5)" },
      { term: "Fan-in", value: "min(25, inDeg * 5)" },
      { term: "Cycle involvement", value: "min(30, cycles * 15)" },
      { term: "Total degree", value: "min(20, (outDeg + inDeg) * 2)" },
    ],
    bullets: [
      "Score blends fan-out, fan-in, cycles, and overall connectivity.",
      "Bulk scoring uses UNWIND to avoid N+1 database round trips.",
      "Color-coded thresholds speed analyst decisions in graph view.",
    ],
    metrics: [
      { label: "Scoring Model", value: "4-factor blend" },
      { label: "Range", value: "0-100" },
      { label: "Top Weight", value: "Cycles (30)" },
    ],
    highlights: [
      "Single-query bulk scoring",
      "Cycle-heavy weighting for obfuscation",
      "Risk bands: low, medium, high",
    ],
    snippetLabel: "Bulk risk scoring pattern",
    snippet: `UNWIND $addresses AS addr
MATCH (w:Wallet {address: addr})
... compute outDeg, inDeg, cycles ...
WITH addr,
  CASE WHEN rawScore < 100 THEN rawScore ELSE 100 END AS score
RETURN addr, score`,
    panelTitle: "Talking Track",
    panelItems: [
      "Mention why cycle involvement gets strong weight in many cases.",
      "Show how this converts a visual graph into a ranked action list.",
      "Transition to graph intelligence and explain visual encoding choices.",
    ],
    icon: BarChart3,
  },
  {
    id: "graph-intel",
    navLabel: "Graph Intelligence",
    kicker: "Slide 07  Graph Math",
    title: "3D Mapping, Louvain Communities, and Visual Signals",
    summary:
      "Graph rendering uses log scaling and force simulation so both small and large transaction behaviors remain visible.",
    detailPairs: [
      { term: "Volume transform", value: "logVolume = log10(totalVolume + 1)" },
      { term: "Z-axis mapping", value: "z = normalizedVolume * 300 - 150" },
      { term: "Risk color", value: "hue = 120 * (1 - riskScore / 100)" },
      { term: "Cluster color", value: "hue = (clusterId * 137.508) % 360" },
    ],
    bullets: [
      "Log scaling prevents whale wallets from visually flattening the graph.",
      "Louvain runs in-memory on fetched subgraphs, no GDS plugin required.",
      "Edge width uses log amount scaling for readable flow magnitude.",
    ],
    metrics: [
      { label: "Z Range", value: "-150 to +150" },
      { label: "Edge Width Cap", value: "approx 4 units" },
      { label: "Community Cost", value: "O(E * iterations)" },
    ],
    snippetLabel: "Visual mapping excerpt (details.md)",
    snippet: `normalizedVol = (logVol - logMin) / (logMax - logMin)
zPosition      = normalizedVol * 300 - 150
edge.logAmount = Math.log10(amount + 1)
edgeWidth      = Math.max(0.3, edge.logAmount * edgeWidthScale)`,
    panelTitle: "Explainer Notes",
    panelItems: [
      "Call out why log scaling is essential for heavy-tailed blockchain values.",
      "Mention that cluster view and risk view answer different questions.",
      "Transition to governance: who can do what in production.",
    ],
    icon: GitBranch,
  },
  {
    id: "ops",
    navLabel: "Ops and API",
    kicker: "Slide 08  Platform Controls",
    title: "Roles, Security, and Endpoint Surface",
    summary:
      "JWT authentication and role-based controls separate analyst workflows from admin operations.",
    detailPairs: [
      { term: "Role model", value: "admin and user permissions applied across routes" },
      { term: "Token policy", value: "JWT tokens with 24-hour expiry" },
      { term: "Admin scope", value: "upload data, manage users, review logs, adjust settings" },
      { term: "Analyst scope", value: "graph, suspicious checks, path analysis, wallet inspection" },
    ],
    bullets: [
      "Authentication is enforced on protected REST endpoints.",
      "Core APIs include /graph, /wallet/:address, /suspicious, /stats, and admin routes.",
      "Role-aware UI keeps non-admin users away from destructive actions.",
    ],
    metrics: [
      { label: "User Roles", value: "2" },
      { label: "Token TTL", value: "24h" },
      { label: "Core Endpoints", value: "10" },
    ],
    highlights: [
      "Least-privilege workflow",
      "Admin-only data ingestion",
      "Audit and settings controls",
    ],
    snippetLabel: "Endpoint reference",
    snippet: `GET  /graph
GET  /wallet/:address
GET  /suspicious?type=circular|fanout|fanin|rapid|cluster
POST /upload-transactions    (admin)
PATCH /admin/users/:id       (admin)`,
    panelTitle: "Governance Notes",
    panelItems: [
      "Clarify that upload and user management stay admin-only.",
      "Mention how role guards appear in both API and frontend navigation.",
      "Transition to an end-to-end demonstration sequence.",
    ],
    icon: Lock,
  },
  {
    id: "walkthrough",
    navLabel: "Walkthrough",
    kicker: "Slide 09  Demonstration",
    title: "Recommended Live Walkthrough",
    summary:
      "Use this sequence during presentations to keep technical depth and audience clarity in balance.",
    detailPairs: [
      { term: "Step 1", value: "Upload sample data and confirm ingestion count" },
      { term: "Step 2", value: "Run one detector and inspect suspicious list output" },
      { term: "Step 3", value: "Open wallet detail and interpret risk contributors" },
      { term: "Step 4", value: "Trace path and community context in graph view" },
    ],
    bullets: [
      "Step 1: Upload sample data and verify graph growth.",
      "Step 2: Open suspicious view and trigger one detector.",
      "Step 3: Jump into a wallet profile and explain the score.",
    ],
    metrics: [
      { label: "Demo Time", value: "6-10 min" },
      { label: "Best Audience", value: "Tech + non-tech" },
      { label: "Outcome", value: "Visible insight" },
    ],
    panelTitle: "Timing Guide",
    panelItems: [
      "Spend 2 min on setup and architecture.",
      "Spend 4 min on detection and graph interpretation.",
      "Close with risk-based decision making and next actions.",
    ],
    icon: Clock,
  },
  {
    id: "close",
    navLabel: "Close",
    kicker: "Slide 10  Launch",
    title: "Ready for a Full Demonstration",
    summary:
      "Switch from presentation mode to the live application and run the workflow against your own dataset.",
    detailPairs: [
      { term: "Deck outcome", value: "Shared language for technical and non-technical audiences" },
      { term: "Live transition", value: "Move directly into login and run the same storyline hands-on" },
      { term: "Operational focus", value: "Faster fraud triage with explainable graph evidence" },
    ],
    bullets: [
      "Presentation flow keeps communication structured.",
      "Live console validates every point with real interactions.",
      "Security and role-based access stay aligned with deployment needs.",
    ],
    metrics: [
      { label: "Transition", value: "Deck -> App" },
      { label: "Access", value: "JWT login" },
      { label: "Focus", value: "Investigation speed" },
    ],
    panelTitle: "Closing Script",
    panelItems: [
      "Invite questions while opening the login screen.",
      "Offer to replay the deck for another audience type.",
      "End with one concrete value statement: faster, clearer fraud triage.",
    ],
    icon: Cpu,
  },
];

export default function LandingPagePresentation() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  const currentSlide = useMemo(() => SLIDES[activeSlide], [activeSlide]);
  const progressPct = ((activeSlide + 1) / SLIDES.length) * 100;

  const scrollToSlide = (index) => {
    const safeIndex = Math.max(0, Math.min(index, SLIDES.length - 1));
    const target = document.getElementById(SLIDES[safeIndex].id);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let candidate = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!candidate || entry.intersectionRatio > candidate.intersectionRatio) {
            candidate = entry;
          }
        }

        if (!candidate) return;

        const idx = SLIDES.findIndex((slide) => slide.id === candidate.target.id);
        if (idx >= 0) {
          setActiveSlide(idx);
        }
      },
      {
        threshold: [0.4, 0.6, 0.8],
      }
    );

    for (const slide of SLIDES) {
      const section = document.getElementById(slide.id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tagName = event.target?.tagName;
      const isTypingContext =
        tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";

      if (isTypingContext) return;

      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        scrollToSlide(activeSlide + 1);
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        scrollToSlide(activeSlide - 1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        scrollToSlide(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        scrollToSlide(SLIDES.length - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSlide]);

  useEffect(() => {
    if (!autoplay) return undefined;

    const timer = setInterval(() => {
      setActiveSlide((currentIndex) => {
        const nextIndex = currentIndex >= SLIDES.length - 1 ? 0 : currentIndex + 1;
        const target = document.getElementById(SLIDES[nextIndex].id);

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        return nextIndex;
      });
    }, 6500);

    return () => clearInterval(timer);
  }, [autoplay]);

  return (
    <div className={`ppt-root ${headingFont.variable} ${monoFont.variable}`}>
      <div className="ppt-network-bg" aria-hidden="true">
        <CyberNetworkCanvas />
      </div>
      <div className="ppt-atmosphere" aria-hidden="true" />

      <header className="ppt-topbar">
        <div className="ppt-brand">
          <div className="ppt-brand-icon">
            <ShieldAlert size={14} />
          </div>
          <div>
            <p className="ppt-brand-title">DBMS</p>
            <p className="ppt-brand-sub">Presentation and Demonstration Mode</p>
          </div>
        </div>

        <div className="ppt-progress-wrap" aria-label="Slide progress">
          <p className="ppt-progress-label">
            {currentSlide.kicker} - {activeSlide + 1}/{SLIDES.length}
          </p>
          <div className="ppt-progress-track">
            <div className="ppt-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="ppt-top-actions">
          <button
            className="ppt-icon-btn"
            onClick={() => scrollToSlide(activeSlide - 1)}
            disabled={activeSlide === 0}
            aria-label="Previous slide"
          >
            <ArrowLeft size={14} />
          </button>

          <button
            className="ppt-icon-btn"
            onClick={() => scrollToSlide(activeSlide + 1)}
            disabled={activeSlide === SLIDES.length - 1}
            aria-label="Next slide"
          >
            <ArrowRight size={14} />
          </button>

          <button
            className="ppt-icon-btn"
            onClick={() => setAutoplay((state) => !state)}
            aria-label={autoplay ? "Pause autoplay" : "Start autoplay"}
          >
            {autoplay ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button className="ppt-launch-btn" onClick={() => router.push("/login")}>
            <Lock size={13} />
            Open Console
          </button>
        </div>
      </header>

      <aside className="ppt-rail" aria-label="Slide navigation">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            className={`ppt-rail-item ${index === activeSlide ? "is-active" : ""}`}
            onClick={() => scrollToSlide(index)}
          >
            <span className="ppt-rail-dot" />
            <span className="ppt-rail-text">{slide.navLabel}</span>
          </button>
        ))}
      </aside>

      <main className="ppt-deck" aria-live="polite">
        {SLIDES.map((slide, index) => {
          const Icon = slide.icon;

          return (
            <section
              key={slide.id}
              id={slide.id}
              className={`ppt-slide ${index === activeSlide ? "is-active" : ""}`}
            >
              <div className="ppt-slide-grid">
                <article className="ppt-card">
                  <span className="ppt-kicker ppt-anim-item" style={{ "--ppt-delay": "0.04s" }}>
                    <Icon size={14} />
                    {slide.kicker}
                  </span>

                  <h1 className="ppt-title ppt-anim-item" style={{ "--ppt-delay": "0.09s" }}>
                    {slide.title}
                  </h1>
                  <p className="ppt-summary ppt-anim-item" style={{ "--ppt-delay": "0.14s" }}>
                    {slide.summary}
                  </p>

                  {slide.detailPairs?.length > 0 && (
                    <dl className="ppt-detail-grid">
                      {slide.detailPairs.map((detail, detailIdx) => (
                        <div
                          key={`${slide.id}-detail-${detail.term}`}
                          className="ppt-detail-card ppt-anim-item"
                          style={{ "--ppt-delay": `${0.18 + detailIdx * 0.045}s` }}
                        >
                          <dt className="ppt-detail-term">{detail.term}</dt>
                          <dd className="ppt-detail-value">{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <ul className="ppt-bullet-list">
                    {slide.bullets.map((bullet, bulletIdx) => (
                      <li
                        key={`${slide.id}-bullet-${bulletIdx}`}
                        className="ppt-anim-item"
                        style={{ "--ppt-delay": `${0.26 + bulletIdx * 0.055}s` }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="ppt-metrics-grid">
                    {slide.metrics.map((metric, metricIdx) => (
                      <div
                        key={`${slide.id}-metric-${metric.label}`}
                        className="ppt-metric-card ppt-anim-item"
                        style={{ "--ppt-delay": `${0.36 + metricIdx * 0.05}s` }}
                      >
                        <span className="ppt-metric-value">{metric.value}</span>
                        <span className="ppt-metric-label">{metric.label}</span>
                      </div>
                    ))}
                  </div>

                  {slide.highlights?.length > 0 && (
                    <div className="ppt-chip-row">
                      {slide.highlights.map((chip, chipIdx) => (
                        <span
                          key={`${slide.id}-chip-${chip}`}
                          className="ppt-chip ppt-anim-item"
                          style={{ "--ppt-delay": `${0.43 + chipIdx * 0.04}s` }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}

                  {slide.snippet && (
                    <div className="ppt-code-wrap ppt-anim-item" style={{ "--ppt-delay": "0.52s" }}>
                      <p className="ppt-code-label">{slide.snippetLabel || "Reference Snippet"}</p>
                      <pre className="ppt-code-block">{slide.snippet}</pre>
                    </div>
                  )}

                  {index === 0 && (
                    <div className="ppt-inline-actions ppt-anim-item" style={{ "--ppt-delay": "0.58s" }}>
                      <button className="ppt-primary-btn" onClick={() => scrollToSlide(1)}>
                        <Eye size={14} />
                        Start Walkthrough
                      </button>
                      <button className="ppt-secondary-btn" onClick={() => router.push("/login")}>
                        <ChevronRight size={14} />
                        Jump to Login
                      </button>
                    </div>
                  )}

                  {index === SLIDES.length - 1 && (
                    <div className="ppt-inline-actions ppt-anim-item" style={{ "--ppt-delay": "0.58s" }}>
                      <button className="ppt-primary-btn" onClick={() => router.push("/login")}>
                        <Lock size={14} />
                        Launch Live Console
                      </button>
                      <button className="ppt-secondary-btn" onClick={() => scrollToSlide(0)}>
                        <ArrowLeft size={14} />
                        Replay Deck
                      </button>
                    </div>
                  )}
                </article>

                <aside className="ppt-notes-card">
                  <div className="ppt-notes-header ppt-note-item" style={{ "--ppt-delay": "0.08s" }}>
                    <Network size={14} />
                    {slide.panelTitle}
                  </div>

                  <ol className="ppt-notes-list">
                    {slide.panelItems.map((item, noteIdx) => (
                      <li
                        key={`${slide.id}-note-${noteIdx}`}
                        className="ppt-note-item"
                        style={{ "--ppt-delay": `${0.16 + noteIdx * 0.06}s` }}
                      >
                        {item}
                      </li>
                    ))}
                  </ol>

                  <div className="ppt-notes-footer ppt-note-item" style={{ "--ppt-delay": "0.38s" }}>
                    <span>Demo anchor</span>
                    <span>{slide.navLabel}</span>
                  </div>
                </aside>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}