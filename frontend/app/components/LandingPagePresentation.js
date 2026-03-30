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
    title: "Fraud Signals Hide in Graph Structure",
    mainIdea:
      "Row-level transaction views miss multi-hop behavior, making fast fraud triage difficult.",
    bullets: [
      "Layering patterns span chains, not single rows.",
      "Manual tracing slows investigations and misses context.",
      "Analysts need explainable, relationship-first views.",
    ],
    metrics: [
      { label: "Primary Gap", value: "No topology context" },
      { label: "Review Pain", value: "Manual tracing" },
      { label: "Needed", value: "Graph evidence" },
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
    title: "DBMS Workflow in Four Steps",
    mainIdea:
      "Upload, detect, score, and investigate in one connected operational flow.",
    bullets: [
      "Ingest CSV or JSON and normalize fields.",
      "Run detector queries and compute risk.",
      "Inspect wallets, paths, and clusters in context.",
    ],
    metrics: [
      { label: "Backend", value: "Fastify" },
      { label: "Graph Store", value: "Neo4j" },
      { label: "UI", value: "Next.js" },
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
    title: "Schema Built for Traceable Fund Flow",
    mainIdea:
      "A compact graph model keeps ingestion idempotent and investigations queryable.",
    bullets: [
      "Wallet, Coin, and User nodes model the core entities.",
      "TRANSFER and USES edges capture movement and asset context.",
      "Unique constraints prevent duplicate identities.",
    ],
    metrics: [
      { label: "Node Types", value: "3" },
      { label: "Edge Types", value: "2" },
      { label: "Batch Size", value: "1,000 tx" },
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
    title: "Detection Targets Real Fraud Motifs",
    mainIdea:
      "Cypher-based detectors surface motifs investigators already recognize in laundering behavior.",
    bullets: [
      "Circular, fan-out, fan-in, rapid relay, and dense cluster checks.",
      "Defaults are tuned for practical first-pass triage.",
      "Each flag is explainable and query-backed.",
    ],
    metrics: [
      { label: "Detector Count", value: "5" },
      { label: "Rapid Window", value: "60s" },
      { label: "Output", value: "Flagged wallets" },
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
    title: "One Score for Fast Investigation Priority",
    mainIdea:
      "A 0-100 composite score turns graph complexity into an actionable investigation queue.",
    bullets: [
      "Blend fan-out, fan-in, cycles, and total degree.",
      "Cycle contribution is weighted highest.",
      "Bulk scoring uses one database pass via UNWIND.",
    ],
    metrics: [
      { label: "Score Range", value: "0 to 100" },
      { label: "Top Factor", value: "Cycle signal" },
      { label: "Use", value: "Triage order" },
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
    title: "Visual Layer Keeps Signal Readable",
    mainIdea:
      "Graph rendering emphasizes meaningful contrast so both small and large behaviors stay visible.",
    bullets: [
      "Log scaling prevents high-volume wallets from flattening the view.",
      "Community mode and risk mode answer different questions.",
      "Path tracing supports explainable movement analysis.",
    ],
    metrics: [
      { label: "View Modes", value: "Risk and Cluster" },
      { label: "Z Mapping", value: "Volume based" },
      { label: "Goal", value: "Readable context" },
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
    title: "Role-Based Access Keeps Operations Safe",
    mainIdea:
      "Permissions separate analyst work from administrative actions without slowing investigations.",
    bullets: [
      "Users investigate graph, suspicious patterns, and wallets.",
      "Admins upload data, manage users, and adjust system settings.",
      "JWT access control is enforced across protected routes.",
    ],
    metrics: [
      { label: "Roles", value: "Admin and User" },
      { label: "Token TTL", value: "24h" },
      { label: "Access Model", value: "Route guards" },
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
    title: "Demo Sequence for Stakeholders",
    mainIdea:
      "Follow one concise run: load data, flag risk, inspect wallet, explain decision.",
    bullets: [
      "Upload sample file and confirm graph growth.",
      "Run one detector and review suspicious results.",
      "Open a wallet profile and justify the risk score.",
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

                  <p className="ppt-audience-heading ppt-anim-item" style={{ "--ppt-delay": "0.2s" }}>
                    Audience takeaway
                  </p>

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