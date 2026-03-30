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
  Database,
  Eye,
  Layers,
  Lock,
  Network,
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
    id: "problem",
    navLabel: "Problem",
    kicker: "Slide 01  Problem",
    title: "Flat Transaction Logs Miss Multi-Hop Risk",
    mainIdea:
      "Critical fraud signals emerge from topology and timing, not isolated rows.",
    bullets: [
      "Circular and relay behavior is hard to see in tabular views.",
      "Manual tracing is slow and inconsistent across analysts.",
      "Investigations need graph evidence plus ranked priority.",
    ],
    metrics: [
      { label: "Signal Type", value: "Topology + Time" },
      { label: "Current State", value: "Manual tracing" },
      { label: "Target", value: "Fast triage" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Start with the investigation bottleneck.",
      "Explain why rows hide laundering signals.",
      "Set up DBMS as a graph-first answer.",
    ],
    icon: ShieldAlert,
  },
  {
    id: "flow",
    navLabel: "Flow",
    kicker: "Slide 02  Workflow",
    title: "Pipeline Produces Evidence in Minutes",
    mainIdea:
      "DBMS ingests raw transactions, builds a Neo4j graph, and serves scored investigation views.",
    bullets: [
      "Ingestion uses UNWIND + MERGE for idempotent writes.",
      "Graph model stores wallets, transfers, and coin usage.",
      "Fastify endpoints power graph, suspicious, and wallet views.",
    ],
    metrics: [
      { label: "Backend", value: "Fastify" },
      { label: "Database", value: "Neo4j" },
      { label: "Batch Ingest", value: "1,000 tx" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Keep this slide as the mental map.",
      "Do not go deep on internals yet.",
      "Transition into data model next.",
    ],
    icon: Database,
  },
  {
    id: "schema",
    navLabel: "Model",
    kicker: "Slide 03  Data Model",
    title: "Schema Preserves Identity and Traceability",
    mainIdea:
      "A compact schema keeps data clean, deduplicated, and query-ready for forensics.",
    bullets: [
      "Nodes: Wallet(address), Coin(name), User(username,email).",
      "Edges: TRANSFER(txid, amount, timestamp, coin_type), USES.",
      "Constraints + indexes support fast hash and time lookup.",
    ],
    metrics: [
      { label: "Node Labels", value: "3" },
      { label: "Relationship Types", value: "2" },
      { label: "Unique Constraints", value: "4" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Mention idempotent MERGE behavior.",
      "Keep schema explanation to 30-40 seconds.",
      "Bridge into detector logic.",
    ],
    icon: Layers,
  },
  {
    id: "detection",
    navLabel: "Detect",
    kicker: "Slide 04  Detection",
    title: "Cypher Queries Detect Five Fraud Motifs",
    mainIdea:
      "Each detector maps to a known laundering behavior and returns explainable wallet flags.",
    bullets: [
      "Circular: MATCH path=(w)-[:TRANSFER*2..6]->(w).",
      "Fan-out/fan-in/cluster: degree thresholds on TRANSFER edges.",
      "Rapid: A->B->C within windowSeconds (default 60).",
    ],
    metrics: [
      { label: "API Route", value: "GET /suspicious" },
      { label: "Detector Types", value: "5" },
      { label: "Default Window", value: "60s" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Use one detector example only.",
      "Avoid reading all rule names aloud.",
      "Transition to risk prioritization.",
    ],
    icon: Activity,
  },
  {
    id: "scoring",
    navLabel: "Score",
    kicker: "Slide 05  Risk Scoring",
    title: "Risk Score Ranks Investigation Priority",
    mainIdea:
      "A 0-100 composite score converts graph complexity into a triage queue.",
    bullets: [
      "Formula blends fan-out, fan-in, cycles, and total degree.",
      "Cycle term has highest cap (30) for obfuscation risk.",
      "UNWIND bulk scoring avoids N+1 wallet queries.",
    ],
    metrics: [
      { label: "Score Range", value: "0-100" },
      { label: "Factors", value: "4" },
      { label: "Execution", value: "Single query" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Explain score as a prioritization tool.",
      "Do not present it as final verdict.",
      "Bridge to graph interpretation.",
    ],
    icon: BarChart3,
  },
  {
    id: "visual",
    navLabel: "Visualize",
    kicker: "Slide 06  Graph View",
    title: "Visualization Encodes Risk and Volume Clearly",
    mainIdea:
      "Rendering choices preserve weak and strong signals in the same investigation view.",
    bullets: [
      "Risk mode colors by score; cluster mode colors by Louvain ID.",
      "Z-axis maps log-normalized transaction volume.",
      "Edge width uses log(amount+1) for readable magnitude.",
    ],
    metrics: [
      { label: "View Modes", value: "2" },
      { label: "Layout", value: "2D + 3D" },
      { label: "Community", value: "Louvain" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Frame visual choices as analyst aids.",
      "Mention why log scaling matters.",
      "Transition to access and operations.",
    ],
    icon: Network,
  },
  {
    id: "ops",
    navLabel: "Operate",
    kicker: "Slide 07  Security",
    title: "Role-Based Access Protects Operations",
    mainIdea:
      "Permissions separate analyst work from administrative actions without slowing investigations.",
    bullets: [
      "User role: graph, suspicious analysis, wallet inspection.",
      "Admin role: uploads, user management, logs, settings.",
      "JWT guards all protected endpoints.",
    ],
    metrics: [
      { label: "Roles", value: "Admin and User" },
      { label: "Token TTL", value: "24h" },
      { label: "Endpoint Guard", value: "JWT middleware" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "Keep this governance-focused.",
      "Mention admin-only upload flow.",
      "Transition to live demo steps.",
    ],
    icon: Lock,
  },
  {
    id: "close",
    navLabel: "Demo",
    kicker: "Slide 08  Demonstration",
    title: "Demo: From Query to Decision",
    mainIdea:
      "Follow one concise run: load data, flag risk, inspect wallet, explain decision.",
    bullets: [
      "Upload sample data and confirm ingestion count.",
      "Run /suspicious?type=circular and inspect flagged wallets.",
      "Open /wallet/:address and explain score contributors.",
    ],
    metrics: [
      { label: "Slide Count", value: "8" },
      { label: "Demo Time", value: "6-8 min" },
      { label: "Outcome", value: "Actionable insight" },
    ],
    panelTitle: "Speaker Cues",
    panelItems: [
      "End on decision speed and clarity.",
      "Invite questions before launching console.",
      "Replay from slide one if needed.",
    ],
    icon: Clock,
  },
];

export default function LandingPagePresentation() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

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

  return (
    <div className={`ppt-root ${headingFont.variable} ${monoFont.variable}`}>
      <div className="ppt-network-bg" aria-hidden="true">
        <CyberNetworkCanvas />
      </div>
      <div className="ppt-atmosphere" aria-hidden="true" />

      <header className="ppt-topbar">
        <div className="ppt-brand">
          <div>
            <p className="ppt-brand-title">DBMS</p>
            <p className="ppt-brand-sub">Presentation and Demonstration Mode</p>
          </div>
        </div>

        <div className="ppt-progress-wrap" aria-label="Slide progress">
          <p className="ppt-progress-label">
            {activeSlide + 1}/{SLIDES.length} - {currentSlide.navLabel}
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
            <span className="ppt-rail-index">{String(index + 1).padStart(2, "0")}</span>
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

                  <div className="ppt-main-idea ppt-anim-item" style={{ "--ppt-delay": "0.14s" }}>
                    <p className="ppt-main-idea-label">Main idea</p>
                    <p className="ppt-main-idea-text">{slide.mainIdea}</p>
                  </div>

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