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
    <div className="ppt-anim-item mt-6 relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-black/60 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.15)] group" style={{ "--ppt-delay": "0.40s" }}>
      {/* Decorative gradient orbs */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-600/30 transition-colors duration-700" />

      <div className="flex items-center justify-between mb-5 border-b border-indigo-500/20 pb-4 relative z-10">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3 sm:gap-4">
           <span className="bg-gradient-to-r from-teal-400/20 to-purple-500/20 border border-teal-500/30 text-teal-300 py-1 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(45,212,191,0.2)]">{subSlides[activeIdx].type}</span>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{subSlides[activeIdx].title}</span>
        </h3>
        <div className="flex gap-2 sm:gap-3 items-center">
           <button onClick={() => setActiveIdx(i => Math.max(0, i-1))} disabled={activeIdx === 0} className="p-2 sm:p-2.5 bg-white/5 hover:bg-teal-500/20 hover:text-teal-300 rounded-xl text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white transition-all duration-300 backdrop-blur-sm"><ArrowLeft size={16}/></button>
           <span className="text-sm text-indigo-300 font-mono py-2 font-bold px-1 sm:px-2">{activeIdx + 1} <span className="opacity-50">/</span> {subSlides.length}</span>
           <button onClick={() => setActiveIdx(i => Math.min(subSlides.length-1, i+1))} disabled={activeIdx === subSlides.length - 1} className="p-2 sm:p-2.5 bg-white/5 hover:bg-teal-500/20 hover:text-teal-300 rounded-xl text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white transition-all duration-300 backdrop-blur-sm"><ArrowRight size={16}/></button>
        </div>
      </div>
      
      <div className="relative z-10" style={{ minHeight: "360px", perspective: "1000px" }}>
        {subSlides.map((sub, idx) => {
          const isActive = activeIdx === idx;
          const isPast = idx < activeIdx;
          
          return (
            <div 
              key={sub.id} 
              className="absolute inset-x-0 top-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col h-full"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive 
                  ? "translate3d(0, 0, 0) rotateX(0) scale(1)" 
                  : isPast 
                    ? "translate3d(-80px, 0, -50px) rotateY(-8deg) scale(0.92)" 
                    : "translate3d(80px, 0, -50px) rotateY(8deg) scale(0.92)",
                pointerEvents: isActive ? "auto" : "none",
                zIndex: isActive ? 10 : 0
              }}
            >
              <p className="text-indigo-100/90 text-[15px] sm:text-[16px] mb-5 leading-relaxed font-medium bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/20 backdrop-blur-md shadow-inner">{sub.description}</p>
              <div className="ppt-code-block w-full flex-grow overflow-auto rounded-xl" style={{ margin: 0, padding: '1.25rem', background: 'rgba(5, 5, 15, 0.7)', border: '1px solid rgba(99, 102, 241, 0.2)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                <pre><code className="text-[13px] sm:text-[14px] text-teal-400 font-mono" style={{ textShadow: "0 0 10px rgba(45,212,191,0.3)" }}>{sub.code}</code></pre>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center gap-3 mt-6 pt-5 border-t border-indigo-500/20 relative z-20">
        {subSlides.map((_, idx) => (
           <button 
             key={idx} 
             onClick={() => setActiveIdx(idx)}
             className={`h-2 rounded-full transition-all duration-500 ease-out ${activeIdx === idx ? 'w-12 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.7)]' : 'w-2.5 bg-indigo-900/80 hover:bg-teal-500/50 hover:shadow-[0_0_10px_rgba(45,212,191,0.3)]'}`}
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






