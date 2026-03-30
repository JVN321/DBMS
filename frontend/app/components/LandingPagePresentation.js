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

import VideoBackground from "./VideoBackground";

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

import { SLIDES } from "./slidesData";

const SubSlider = ({ subSlides }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="ppt-anim-item mt-6 relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 backdrop-blur-md shadow-2xl" style={{ "--ppt-delay": "0.40s" }}>
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
           <span className="bg-blue-600/20 text-blue-400 py-1 px-3 rounded-md text-sm uppercase tracking-wider">{subSlides[activeIdx].type}</span>
           {subSlides[activeIdx].title}
        </h3>
        <div className="flex gap-2 items-center">
           <button onClick={() => setActiveIdx(i => Math.max(0, i-1))} disabled={activeIdx === 0} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-30 transition-all"><ArrowLeft size={16}/></button>
           <span className="text-sm text-slate-400 font-mono py-2">{activeIdx + 1} / {subSlides.length}</span>
           <button onClick={() => setActiveIdx(i => Math.min(subSlides.length-1, i+1))} disabled={activeIdx === subSlides.length - 1} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-30 transition-all"><ArrowRight size={16}/></button>
        </div>
      </div>
      
      <div className="relative" style={{ minHeight: "340px" }}>
        {subSlides.map((sub, idx) => (
          <div 
            key={sub.id} 
            className="absolute inset-x-0 top-0 transition-all duration-500 ease-in-out flex flex-col"
            style={{
              opacity: activeIdx === idx ? 1 : 0,
              transform: activeIdx === idx ? "translateY(0) scale(1)" : activeIdx > idx ? "translateY(-40px) scale(0.95)" : "translateY(40px) scale(0.95)",
              pointerEvents: activeIdx === idx ? "auto" : "none",
              zIndex: activeIdx === idx ? 10 : 0
            }}
          >
            <p className="text-slate-300 text-[15px] mb-4 leading-relaxed">{sub.description}</p>
            <div className="ppt-code-block w-full flex-grow overflow-auto" style={{ margin: 0, padding: '1rem', background: '#0f172a', border: '1px solid #1e293b' }}>
              <pre><code className="text-sm text-blue-300">{sub.code}</code></pre>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-white/10 relative z-20">
        {subSlides.map((_, idx) => (
           <button 
             key={idx} 
             onClick={() => setActiveIdx(idx)}
             className={`h-1.5 rounded-full transition-all duration-300 ${activeIdx === idx ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-slate-600 hover:bg-slate-400'}`}
             aria-label={`Go to subslide ${idx + 1}`}
           />
        ))}
      </div>
    </div>
  )
}

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
        {/* Basic subtle gradient for demo mode, bypassing heavy MP4 parsing */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black opacity-90" />
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
              <div className="ppt-slide-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '1100px', margin: '0 auto' }}>
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
                      </li>                      ))}
                    </ul>

                    {slide.code && (
                      <div className="ppt-code-block ppt-anim-item" style={{ "--ppt-delay": "0.45s" }}>
                        <pre><code>{slide.code}</code></pre>
                      </div>
                    )}

                    {slide.subSlides && (
                      <SubSlider subSlides={slide.subSlides} />
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
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}






