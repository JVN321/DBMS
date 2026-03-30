"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Network,
  Search,
  Zap,
  Eye,
  Activity,
  ArrowRight,
  ChevronRight,
  Terminal,
  Lock,
  GitBranch,
  Cpu,
  Database,
  BarChart3,
  AlertTriangle,
  Globe,
} from "lucide-react";

import VideoBackground from "./VideoBackground";
import { ShaderAnimation } from "./ShaderLines";

// Legacy NetworkCanvas replaced by VideoBackground
/*
function NetworkCanvas({ className }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Initialize nodes
    const NODE_COUNT = 65;
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const suspicious = Math.random() < 0.12;
      nodes.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: suspicious ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2.5,
        suspicious,
        pulsePhase: Math.random() * Math.PI * 2,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
    nodesRef.current = nodes;

    // Edges (fixed topology)
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      const conns = 1 + Math.floor(Math.random() * 2);
      for (let c = 0; c < conns; c++) {
        const j = (i + 1 + Math.floor(Math.random() * 8)) % nodes.length;
        if (i !== j) edges.push([i, j]);
      }
    }

    // Particles along edges
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      particles.push({
        edge,
        t: Math.random(),
        speed: 0.001 + Math.random() * 0.003,
        suspicious: nodes[edge[0]].suspicious || nodes[edge[1]].suspicious,
      });
    }

    const animate = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      const time = performance.now() * 0.001;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));

        // Gentle mouse repulsion
        const ddx = node.x - mx;
        const ddy = node.y - my;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.3;
          node.vx += (ddx / dist) * force;
          node.vy += (ddy / dist) * force;
        }

        // Speed damping
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 0.6) {
          node.vx *= 0.6 / speed;
          node.vy *= 0.6 / speed;
        }
      }

      // Draw edges
      for (const [i, j] of edges) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 220) continue;
        const alpha = (1 - d / 220) * 0.12;
        const isSusp = a.suspicious || b.suspicious;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isSusp
          ? `rgba(239, 68, 68, ${alpha * 1.5})`
          : `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = isSusp ? 0.8 : 0.5;
        ctx.stroke();
      }

      // Draw particles
      for (const p of particles) {
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          const newEdge = edges[Math.floor(Math.random() * edges.length)];
          p.edge = newEdge;
          p.suspicious = nodes[newEdge[0]].suspicious || nodes[newEdge[1]].suspicious;
        }
        const a = nodes[p.edge[0]];
        const b = nodes[p.edge[1]];
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        ctx.beginPath();
        ctx.arc(px, py, p.suspicious ? 1.5 : 1, 0, Math.PI * 2);
        ctx.fillStyle = p.suspicious
          ? `rgba(245, 158, 11, 0.8)`
          : `rgba(99, 102, 241, 0.6)`;
        ctx.fill();
      }

      // Draw nodes
      for (const node of nodes) {
        const pulse = 1 + Math.sin(time * 2 + node.pulsePhase) * 0.3;

        // Glow
        if (node.suspicious) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r * 3 * pulse, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.r * 3 * pulse
          );
          grad.addColorStop(0, "rgba(239, 68, 68, 0.15)");
          grad.addColorStop(1, "rgba(239, 68, 68, 0)");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = node.suspicious
          ? `rgba(239, 68, 68, ${node.opacity})`
          : `rgba(99, 102, 241, ${node.opacity * 0.7})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMouse);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouse);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
*/

// ═══════════════════════════════════════════════════════════════════════
// Terminal typing animation
// ═══════════════════════════════════════════════════════════════════════

const TERMINAL_LINES = [
  { text: "$ dbms --init blockchain-analysis-engine", delay: 0 },
  { text: "[OK] Connecting to Neo4j graph database...", delay: 1200, color: "text-green-400" },
  { text: "[OK] Loading wallet network topology (1,847 nodes)...", delay: 2400, color: "text-green-400" },
  { text: "[>>] Running Louvain community detection...", delay: 3600, color: "text-cyan-400" },
  { text: "[!!] 12 communities identified — 3 flagged suspicious", delay: 4800, color: "text-amber-400" },
  { text: "[!!] Circular transfer pattern detected: depth=4, wallets=6", delay: 6000, color: "text-red-400" },
  { text: "[>>] Computing risk scores via fan-out/fan-in analysis...", delay: 7200, color: "text-cyan-400" },
  { text: "[OK] 23 wallets scored HIGH risk (>60/100)", delay: 8400, color: "text-red-400" },
  { text: "[OK] Visualization engine ready — 3D force graph loaded", delay: 9600, color: "text-green-400" },
  { text: "$ _", delay: 10800, blink: true },
];

function TerminalAnimation({ onComplete }) {
  // Each entry: { text, color, blink, typed }
  const [lines, setLines] = useState([]);
  const timersRef = useRef([]);
  // Keep onComplete in a ref so the effect never re-runs when the parent re-renders
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const timers = timersRef.current;

    TERMINAL_LINES.forEach((line, lineIdx) => {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { ...line, typed: line.blink ? line.text : "" }]);

        if (line.blink) {
          onCompleteRef.current?.();
          return;
        }

        // Type each character individually into stable slot [lineIdx]
        const typeChar = (ci) => {
          if (ci >= line.text.length) return;
          const id = setTimeout(() => {
            setLines((prev) => {
              const copy = [...prev];
              if (copy[lineIdx]) {
                copy[lineIdx] = { ...copy[lineIdx], typed: line.text.slice(0, ci + 1) };
              }
              return copy;
            });
            typeChar(ci + 1);
          }, 14 + Math.random() * 18);
          timers.push(id);
        };
        typeChar(0);
      }, line.delay);

      timers.push(t);
    });

    // run once on mount only
  }, []);

  return (
    <div className="landing-terminal">
      <div className="landing-terminal-header">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">dbms@blockchain:~</span>
      </div>
      <div className="landing-terminal-body">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`font-mono text-xs leading-relaxed ${line.color || "text-zinc-400"} ${
              line.blink ? "landing-blink" : ""
            }`}
          >
            {line.blink ? line.text : line.typed}
            {i === lines.length - 1 && !line.blink && (
              <span className="landing-cursor">▎</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Scan-line / matrix-rain decorative overlay
// ═══════════════════════════════════════════════════════════════════════

function ScanlineOverlay() {
  return <div className="landing-scanlines" aria-hidden="true" />;
}

// ═══════════════════════════════════════════════════════════════════════
// Live log feed (decorative)
// ═══════════════════════════════════════════════════════════════════════

const LOG_ENTRIES = [
  { ts: "14:32:07.213", msg: "Wallet 0x3f…8a2d flagged: fan-out=12", level: "WARN" },
  { ts: "14:32:07.415", msg: "Circular path detected: 4 hops", level: "ALERT" },
  { ts: "14:32:08.001", msg: "Community #7 modularity gain: +0.034", level: "INFO" },
  { ts: "14:32:08.192", msg: "Risk score updated: 0x9b…1fc7 → 78/100", level: "WARN" },
  { ts: "14:32:08.534", msg: "New TRANSFER edge: 2.41 ETH", level: "INFO" },
  { ts: "14:32:09.117", msg: "Rapid transfer chain: A→B→C in 14s", level: "ALERT" },
  { ts: "14:32:09.302", msg: "Cluster gravity recalculated (13 centroids)", level: "INFO" },
  { ts: "14:32:09.788", msg: "Dense cluster detected: in=8, out=11", level: "WARN" },
  { ts: "14:32:10.044", msg: "Graph snapshot: 1,847 nodes, 3,214 edges", level: "INFO" },
  { ts: "14:32:10.331", msg: "Wallet 0xab…ef12 risk escalated to HIGH", level: "ALERT" },
];

function LiveLogFeed() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setEntries((prev) => {
        const next = [...prev, LOG_ENTRIES[idx % LOG_ENTRIES.length]];
        if (next.length > 6) next.shift();
        return next;
      });
      idx++;
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const levelColor = (l) =>
    l === "ALERT" ? "text-red-400" : l === "WARN" ? "text-amber-400" : "text-zinc-500";

  return (
    <div className="landing-log-feed">
      <div className="landing-log-header">
        <Activity size={12} className="text-green-400" />
        <span>LIVE ANALYSIS FEED</span>
        <span className="landing-log-dot" />
      </div>
      <div className="landing-log-body">
        {entries.map((e, i) => (
          <div key={i} className="landing-log-entry">
            <span className="text-zinc-600">{e.ts}</span>
            <span className={`font-semibold ${levelColor(e.level)}`}>[{e.level}]</span>
            <span className="text-zinc-400">{e.msg}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-zinc-600 text-xs font-mono">Awaiting data stream...</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Stats counter
// ═══════════════════════════════════════════════════════════════════════

function AnimatedCounter({ target, duration = 2000, suffix = "" }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Feature card
// ═══════════════════════════════════════════════════════════════════════

function FeatureCard({ icon: Icon, title, description, accent }) {
  return (
    <div className="landing-feature-card group">
      <div className={`landing-feature-icon ${accent}`}>
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-bold text-zinc-100 mt-4 mb-2 tracking-wide uppercase">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      <div className={`landing-feature-glow ${accent}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Demo section — terminal + live feed → video reveal
// ═══════════════════════════════════════════════════════════════════════

function DemoSection() {
  const [terminalDone, setTerminalDone] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const videoRef = useRef(null);
  const handleComplete = useCallback(() => setTerminalDone(true), []);

  useEffect(() => {
    if (!terminalDone) return;
    // Double-rAF: mount the element first, then trigger the CSS transition
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVideoVisible(true))
    );
    return () => cancelAnimationFrame(id);
  }, [terminalDone]);

  useEffect(() => {
    if (videoVisible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoVisible]);

  return (
    <section id="demo" className="landing-section">
      <div className="landing-section-inner">
        <div className="text-center mb-12">
          <span className="landing-section-tag">
            <Cpu size={12} /> INTERACTIVE CONSOLE
          </span>
          <h2 className="landing-section-title">See It In Action</h2>
          <p className="landing-section-sub">
            A real-time terminal console analyzing blockchain transaction graphs.
          </p>
        </div>

        {/* Terminal + side panel grid */}
        <div className="landing-demo-grid">
          <div className="landing-demo-main">
            <TerminalAnimation onComplete={handleComplete} />
          </div>

          <div className="landing-demo-side">
            <LiveLogFeed />
            <div className="landing-mini-panel">
              <div className="landing-mini-panel-header">
                <BarChart3 size={12} className="text-red-500" />
                <span>ANALYSIS METRICS</span>
              </div>
              <div className="landing-mini-panel-body">
                <div className="landing-mini-stat">
                  <span className="text-zinc-500">Nodes Scanned</span>
                  <span className="text-red-500 font-bold">
                    <AnimatedCounter target={1847} />
                  </span>
                </div>
                <div className="landing-mini-stat">
                  <span className="text-zinc-500">Edges Analyzed</span>
                  <span className="text-red-500 font-bold">
                    <AnimatedCounter target={3214} />
                  </span>
                </div>
                <div className="landing-mini-stat">
                  <span className="text-zinc-500">Threats Found</span>
                  <span className="text-red-400 font-bold">
                    <AnimatedCounter target={23} />
                  </span>
                </div>
                <div className="landing-mini-stat">
                  <span className="text-zinc-500">Communities</span>
                  <span className="text-cyan-400 font-bold">
                    <AnimatedCounter target={12} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Video player — only mounted after terminal completes ── */}
        {terminalDone && (
        <div
          className="landing-demo-video-wrap"
          style={{
            opacity: videoVisible ? 1 : 0,
            transform: videoVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          {/* window chrome */}
          <div className="landing-demo-video-chrome">
            <div className="landing-demo-video-chrome-header">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="landing-demo-video-title">
                <Eye size={11} className="inline-block mr-1.5 text-red-500" />
                SYSTEM DEMO // LIVE REPLAY
              </span>
              <span className="landing-demo-video-badge">
                <span className="landing-status-dot" style={{ width: 5, height: 5 }} />
                REC
              </span>
            </div>

            {/* video */}
            <div className="landing-demo-video-body">
              <video
                ref={videoRef}
                src="/demo.mp4"
                muted
                loop
                playsInline
                preload="metadata"
                className="landing-demo-video"
              />
              {/* scanline overlay on video */}
              <div className="landing-demo-video-scanlines" aria-hidden="true" />
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Landing Page
// ═══════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  // Shader intro: "playing" → "fading" → "done"
  const [introPhase, setIntroPhase] = useState("playing");
  const [redProgress, setRedProgress] = useState(0);
  // Letters: D . B . M . S — we track how many visible (7 → 0)
  const letters = ["D", ".", "B", ".", "M", ".", "S"];
  const [visibleCount, setVisibleCount] = useState(7);

  // Scroll/wheel drives the red transition + letter removal
  useEffect(() => {
    if (introPhase !== "playing") return;
    let accumulated = 0;
    const maxScroll = 1400;

    const advance = (delta) => {
      accumulated += delta;
      const progress = Math.min(accumulated / maxScroll, 1);
      setRedProgress(progress);

      // Letters disappear one by one: last letter goes at ~15%, next at ~30%, etc.
      const lettersGone = Math.floor(progress * 9); // 0-7 range across 0-0.78 progress
      setVisibleCount(Math.max(0, 7 - lettersGone));

      if (progress >= 1) {
        setIntroPhase("fading");
        setTimeout(() => setIntroPhase("done"), 1200);
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      advance(Math.abs(e.deltaY));
    };
    let touchY = null;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (touchY === null) return;
      e.preventDefault();
      const delta = Math.abs(e.touches[0].clientY - touchY);
      touchY = e.touches[0].clientY;
      advance(delta);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [introPhase]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll during intro
  useEffect(() => {
    if (introPhase !== "done") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [introPhase]);

  return (
    <div className="landing-root">

      {/* ════════════ SHADER INTRO OVERLAY ════════════ */}
      {introPhase !== "done" && (
        <div className={`shader-intro-overlay ${
          introPhase === "fading" ? "shader-intro-fading" : ""
        }`}>
          <ShaderAnimation redProgress={redProgress} />
          {/* Black overlay that fades in as you scroll, creating shader→black */}
          <div className="shader-black-overlay" style={{ opacity: Math.pow(redProgress, 2.5) }} />
          <div className="shader-intro-content">
            <h1 className="shader-intro-title">
              {letters.map((ch, i) => (
                <span
                  key={i}
                  className="shader-letter"
                  style={{ opacity: i < visibleCount ? 1 : 0 }}
                >
                  {ch}
                </span>
              ))}
            </h1>
            <div className={`shader-intro-sub ${
              visibleCount < 5 ? "shader-intro-sub-hide" : ""
            }`}>
              <span className="shader-intro-line" />
              <span className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
                Distributed Blockchain Monitoring System
              </span>
              <span className="shader-intro-line" />
            </div>
            <div
              className="shader-scroll-hint"
              style={{
                opacity: Math.max(0, 1 - redProgress * 40),
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              <span className="shader-scroll-text">SCROLL</span>
              <div className="shader-scroll-arrow" />
            </div>
          </div>
          <div className="shader-intro-scanlines" aria-hidden="true" />
        </div>
      )}

      {/* Only mount landing once fading/done — fade in from black */}
      {introPhase !== "playing" && (
      <div className={`landing-fade-in ${introPhase === "done" ? "landing-visible" : ""}`}>
      <>
      {/* ════════════ Full-screen cyber network background ════════════ */}
      <div className="cyber-network-bg" aria-hidden="true">
        <VideoBackground videoSrc="/asset/background.mp4" />
      </div>

      <ScanlineOverlay />

      {/* ════════════════════ NAV ════════════════════ */}
      <nav
        className={`landing-nav ${scrollY > 50 ? "landing-nav-scrolled" : ""}`}
      >
        <div className="landing-nav-inner">
          <div className="flex items-center">
            <div>
              <span className="text-sm font-bold tracking-tight text-white font-mono">
                DBMS
              </span>
              <span className="hidden sm:inline text-[10px] text-zinc-500 ml-2 font-mono">
                v2.0 // DISTRIBUTED BLOCKCHAIN MONITORING
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden sm:inline text-xs text-zinc-400 hover:text-white transition-colors font-mono">
              FEATURES
            </a>
            <a href="#demo" className="hidden sm:inline text-xs text-zinc-400 hover:text-white transition-colors font-mono">
              DEMO
            </a>
            <a href="#overview" className="hidden sm:inline text-xs text-zinc-400 hover:text-white transition-colors font-mono">
              OVERVIEW
            </a>
            <button
              onClick={() => router.push("/login")}
              className="landing-btn-ghost"
            >
              Log In
            </button>
            <button
              onClick={() => router.push("/login")}
              className="landing-btn-primary"
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="landing-hero">
        {/* Background overlay — network is now global behind the page */}
        <div className="absolute inset-0 z-0">
          {/* Radial gradient overlay for readability */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#000000]/30 to-[#000000]/70" />
          {/* Grid overlay */}
          <div className="landing-grid-overlay" />
        </div>

        <div className="relative z-10 landing-hero-content">
          {/* Status badge */}
          <div className="landing-status-badge">
            <span className="landing-status-dot" />
            <span className="font-mono text-[11px] text-zinc-400">
              SYSTEM ONLINE — ANALYSIS ENGINE ACTIVE
            </span>
          </div>

          {/* Headline */}
          <h1 className="landing-hero-title">
            <span className="landing-glitch" data-text="Distributed Blockchain">
              Distributed Blockchain
            </span>
            <br />
            <span className="landing-hero-accent">
              Monitoring System
            </span>
          </h1>

          <p className="landing-hero-sub">
            Visualize financial networks. Detect laundering patterns.
            <br className="hidden sm:block" />
            Analyze transaction flows in real time with graph-powered forensics.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => router.push("/login")}
              className="landing-btn-hero"
            >
              <Terminal size={16} />
              Launch Console
              <ChevronRight size={16} className="ml-1" />
            </button>
            <a
              href="#demo"
              className="landing-btn-outline"
            >
              <Eye size={16} />
              Live Preview
            </a>
          </div>

          {/* Hero stats */}
          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-value">
                <AnimatedCounter target={5} suffix="+" />
              </span>
              <span className="landing-hero-stat-label">Detection Algorithms</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-value">
                <AnimatedCounter target={3} suffix="D" />
              </span>
              <span className="landing-hero-stat-label">Graph Visualization</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <span className="landing-hero-stat-value">
                <AnimatedCounter target={100} suffix="/100" />
              </span>
              <span className="landing-hero-stat-label">Risk Scoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ INTERACTIVE DEMO ════════════════════ */}
      <DemoSection />



      {/* ════════════════════ FEATURES ════════════════════ */}
      <section id="features" className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <div className="text-center mb-12">
            <span className="landing-section-tag">
              <Zap size={12} /> CAPABILITIES
            </span>
            <h2 className="landing-section-title">
              Built for Blockchain Forensics
            </h2>
            <p className="landing-section-sub">
              A focused toolkit for tracking wallet behavior, spotting anomalies,
              and acting on risk quickly.
            </p>
          </div>

          <div className="landing-features-grid">
            <FeatureCard
              icon={Network}
              title="3D Graph Visualization"
              description="Explore wallet relationships in an interactive network view with depth, motion, and clear cluster separation."
              accent="text-red-500"
            />
            <FeatureCard
              icon={ShieldAlert}
              title="Fraud Pattern Detection"
              description="Automatically surfaces fan-out, fan-in, circular transfers, rapid relays, and dense coordination patterns."
              accent="text-red-400"
            />
            <FeatureCard
              icon={Search}
              title="Path Finding"
              description="Trace shortest fund-flow paths between wallets and inspect each hop with clear directional context."
              accent="text-amber-400"
            />
            <FeatureCard
              icon={GitBranch}
              title="Community Detection"
              description="Groups wallets into behavior communities to reveal hidden coordination that tables miss."
              accent="text-cyan-400"
            />
            <FeatureCard
              icon={Activity}
              title="Risk Scoring Engine"
              description="Ranks wallets from 0 to 100 using structural risk factors so analysts can prioritize investigations."
              accent="text-green-400"
            />
            <FeatureCard
              icon={Database}
              title="Neo4j Graph Database"
              description="Backed by Neo4j with indexed queries and batch ingestion designed for responsive analysis workflows."
              accent="text-purple-400"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════ QUICK OVERVIEW ════════════════════ */}
      <section id="overview" className="landing-section">
        <div className="landing-section-inner">
          <div className="text-center mb-12">
            <span className="landing-section-tag">
              <Globe size={12} /> QUICK FLOW
            </span>
            <h2 className="landing-section-title">
              Simple Investigation Workflow
            </h2>
            <p className="landing-section-sub">
              A streamlined path from uploaded transactions to risk-ranked wallets and explainable decisions.
            </p>
          </div>

          <div className="landing-pipeline">
            {[
              { step: "01", icon: Database, title: "INGEST", desc: "Upload CSV/JSON data and normalize wallet, amount, time, and coin fields." },
              { step: "02", icon: ShieldAlert, title: "DETECT", desc: "Run graph detectors for circular, fan-out, fan-in, rapid, and cluster behavior." },
              { step: "03", icon: Activity, title: "SCORE", desc: "Compute a 0-100 composite risk score to prioritize investigation targets." },
              { step: "04", icon: Eye, title: "INVESTIGATE", desc: "Drill into wallet paths, communities, and evidence-backed suspicious flows." },
            ].map((item) => (
              <div key={item.step} className="landing-pipeline-step">
                <div className="landing-pipeline-num">{item.step}</div>
                <item.icon size={20} className="text-red-500 mb-3" />
                <h3 className="text-xs font-bold text-zinc-200 tracking-widest mb-2">
                  {item.title}
                </h3>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <div className="landing-algo-card">
              <div className="landing-schema-card-header text-cyan-400 mb-3">
                <Database size={14} /> CORE DATA MODEL
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Wallet, Coin, and User entities are linked through TRANSFER and USES relationships, with indexed timestamps and transaction IDs for quick lookups.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="landing-detect-param">3 Node Types</span>
                <span className="landing-detect-param">2 Relationship Types</span>
                <span className="landing-detect-param">1,000 tx / batch</span>
              </div>
            </div>

            <div className="landing-algo-card">
              <div className="landing-schema-card-header text-amber-400 mb-3">
                <Search size={14} /> NEED A DEEP DIVE?
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Detailed schema tables, Cypher detection logic, risk formula breakdown, and endpoint-level references are now organized in Presentation Mode.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="landing-detect-param">5 Detection Queries</span>
                <span className="landing-detect-param">0-100 Risk Formula</span>
                <span className="landing-detect-param">Neo4j Constraints</span>
                <span className="landing-detect-param">JWT + Role Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <div className="landing-cta-glow" />
          <div className="relative z-10 text-center">
            <AlertTriangle size={28} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
              Ready to Expose Hidden Patterns?
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-8">
              Upload your transaction data and let the analysis engine reveal
              suspicious flows, community clusters, and high-risk wallets.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => router.push("/login")}
                className="landing-btn-hero"
              >
                <Lock size={16} />
                Access the Console
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="flex items-center">
            <span className="font-mono text-xs text-zinc-600">
              DBMS v2.0
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-700">
            DISTRIBUTED BLOCKCHAIN MONITORING SYSTEM — {new Date().getFullYear()}
          </span>
        </div>
      </footer>
      </>
      </div>)}
    </div>
  );
}
