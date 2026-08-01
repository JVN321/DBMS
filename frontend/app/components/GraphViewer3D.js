"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, Copy, ExternalLink, ShieldAlert, Activity, RotateCw, Check, X } from "lucide-react";
import CustomCursor from "./CustomCursor";

// ═══════════════════════════════════════════════════════════════════════
// Color utilities
// ═══════════════════════════════════════════════════════════════════════

/** Risk gradient: 0 → green, 50 → yellow, 100 → red. Supports color sensitivity. */
function riskColor(score, sensitivity = 1.0) {
  const s = Math.max(0, Math.min(100, (score || 0) * sensitivity));
  const hue = Math.round(120 - s * 1.2);
  return `hsl(${Math.max(0, hue)}, 85%, 60%)`;
}

/** Golden-angle cluster color for max perceptual separation. */
function clusterColor(clusterId) {
  const hue = (clusterId * 137.508) % 360;
  return `hsl(${Math.round(hue)}, 70%, 55%)`;
}

/** Fraud pattern → distinct color. */
const FRAUD_COLORS = {
  fanout: "hsl(30, 95%, 60%)",
  fanin: "hsl(280, 80%, 60%)",
  circular: "hsl(0, 90%, 55%)",
  hub: "hsl(200, 90%, 65%)",
  mixer: "hsl(320, 80%, 60%)",
  normal: null,
};

/** Parse `hsl(h, s%, l%)` → { r, g, b } 0-255. */
function parseColor(str) {
  const m = str.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
  if (m) return hslToRgb(parseFloat(m[1]) / 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
  return { r: 100, g: 100, b: 255 };
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (pp, qq, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
      if (t < 1 / 2) return qq;
      if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
      return pp;
    };
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// ═══════════════════════════════════════════════════════════════════════
// Glow texture (canvas radial gradient)
// ═══════════════════════════════════════════════════════════════════════

function createGlowTexture(color, intensity = 1, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const { r, g, b } = parseColor(color);
  const cx = size / 2;
  const rad = size / 2;
  const a = Math.min(1, 0.75 + intensity * 0.25);
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, rad);
  grad.addColorStop(0, `rgba(255,255,255,${a})`);
  grad.addColorStop(0.18, `rgba(${r},${g},${b},${a * 0.95})`);
  grad.addColorStop(0.42, `rgba(${r},${g},${b},${a * 0.5})`);
  grad.addColorStop(0.72, `rgba(${r},${g},${b},${a * 0.15})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

// ═══════════════════════════════════════════════════════════════════════
// Starfield generator
// ═══════════════════════════════════════════════════════════════════════

function createStarfield(T, count = 3000, radius = 2000) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.3 + Math.random() * 0.7);
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * s * Math.sin(theta);
    positions[i * 3 + 2] = r * u;
    sizes[i] = 0.5 + Math.random() * 1.5;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(positions, 3));
  geo.setAttribute("size", new T.BufferAttribute(sizes, 1));
  const mat = new T.PointsMaterial({
    color: 0xaabbff,
    size: 1.2,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    depthWrite: false,
  });
  return new T.Points(geo, mat);
}

// ═══════════════════════════════════════════════════════════════════════
// Fraud-pattern layout positions
// ═══════════════════════════════════════════════════════════════════════

function computeFraudLayout(nodes) {
  const groups = { fanout: [], fanin: [], circular: [], hub: [], mixer: [], normal: [] };
  for (const n of nodes) groups[n.fraudPattern]?.push(n) ?? groups.normal.push(n);

  const positions = new Map();
  const SPREAD = 200;

  layoutStar(groups.fanout, -SPREAD * 1.5, 0, 0, positions);
  layoutStar(groups.fanin, SPREAD * 1.5, 0, 0, positions);
  layoutRing(groups.circular, 0, SPREAD * 1.5, 0, positions);
  layoutCluster(groups.hub, 0, 0, SPREAD * 0.5, positions);
  layoutCluster(groups.mixer, 0, -SPREAD * 1.5, 0, positions);

  return positions;
}

function layoutStar(nodeList, cx, cy, cz, posMap) {
  if (nodeList.length === 0) return;
  const sorted = [...nodeList].sort((a, b) => b.totalVolume - a.totalVolume);
  posMap.set(sorted[0].id, { fx: cx, fy: cy, fz: cz });
  const R = 50 + sorted.length * 3;
  for (let i = 1; i < sorted.length; i++) {
    const angle = ((i - 1) / (sorted.length - 1)) * Math.PI * 2;
    posMap.set(sorted[i].id, {
      fx: cx + R * Math.cos(angle),
      fy: cy + R * Math.sin(angle),
      fz: cz + (Math.random() - 0.5) * 30,
    });
  }
}

function layoutRing(nodeList, cx, cy, cz, posMap) {
  if (nodeList.length === 0) return;
  const R = 30 + nodeList.length * 5;
  for (let i = 0; i < nodeList.length; i++) {
    const angle = (i / nodeList.length) * Math.PI * 2;
    posMap.set(nodeList[i].id, {
      fx: cx + R * Math.cos(angle),
      fy: cy + R * Math.sin(angle),
      fz: cz,
    });
  }
}

function layoutCluster(nodeList, cx, cy, cz, posMap) {
  if (nodeList.length === 0) return;
  for (let i = 0; i < nodeList.length; i++) {
    const angle = (i / Math.max(1, nodeList.length)) * Math.PI * 2;
    const r = 20 + i * 4;
    posMap.set(nodeList[i].id, {
      fx: cx + r * Math.cos(angle),
      fy: cy + r * Math.sin(angle),
      fz: cz + (Math.random() - 0.5) * 40,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export default function GraphViewer3D({
  elements,
  onNodeClick,
  highlightedNodes = EMPTY_ARRAY,
  highlightPath = EMPTY_ARRAY,
  volumeThreshold = 0,
  clusterSizeThreshold = 0,
  colorMode = "risk",
  animateTime = false,
  layoutMode = "force",
  reduceAnimations = false,
  vizSettings = EMPTY_OBJECT,
  focusNodeId = null,
  style,
}) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const animFrameRef = useRef(null);
  const orbitRef = useRef(null);
  const wasdFrameRef = useRef(null);
  const sceneExtrasRef = useRef([]);
  const starfieldMeshRef = useRef(null);
  const keysRef = useRef(new Set());
  const cameraStateRef = useRef(null);
  const userInteractedRef = useRef(false);
  const settingsRef = useRef(null);
  const hoveredNodeRef = useRef(null);
  const onNodeClickRef = useRef(onNodeClick);
  const cameraVelRef = useRef({ x: 0, y: 0, z: 0 });
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });
  const readyTimeoutRef = useRef(null);
  const autoRotateRef = useRef(false);

  const [fps, setFps] = useState(0);
  const [ForceGraph3DModule, setForceGraph3DModule] = useState(null);
  const [graphReady, setGraphReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // When graph is ready, trigger the fade-out transition
  useEffect(() => {
    if (graphReady && !fadeOut && !overlayDone) {
      setFadeOut(true);
    }
  }, [graphReady, fadeOut, overlayDone]);

  // Reset loading state when data changes
  useEffect(() => {
    setGraphReady(false);
    setFadeOut(false);
    setOverlayDone(false);
  }, [elements]);

  onNodeClickRef.current = onNodeClick;

  // ── Merged visual settings with defaults ──
  const settings = useMemo(() => ({
    fogDensity: vizSettings.fogDensity ?? 0.0022,
    particleSpeed: vizSettings.particleSpeed ?? 0.003,
    glowIntensity: vizSettings.glowIntensity ?? 1.0,
    colorSensitivity: vizSettings.colorSensitivity ?? 1.0,
    particleCount: vizSettings.particleCount ?? 4,
    orbitSpeed: vizSettings.orbitSpeed ?? 0.0008,
    gravity: vizSettings.gravity ?? 0.015,
    dustCount: vizSettings.dustCount ?? 4000,
  }), [
    vizSettings.fogDensity,
    vizSettings.particleSpeed,
    vizSettings.glowIntensity,
    vizSettings.colorSensitivity,
    vizSettings.particleCount,
    vizSettings.orbitSpeed,
    vizSettings.gravity,
    vizSettings.dustCount,
  ]);

  // Dynamic import of 3d-force-graph + three
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import("3d-force-graph"),
      import("three"),
    ]).then(([graphMod, THREE]) => {
      if (!cancelled) {
        window.__THREE__ = THREE;
        setForceGraph3DModule(() => graphMod.default);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ═══════════════════════════════════════════════════════════════════
  // Data transformation: backend Cytoscape format → 3d-force-graph format
  // ═══════════════════════════════════════════════════════════════════
  const graphData = useMemo(() => {
    if (!elements) return { nodes: [], links: [] };

    const nodeMap = new Map();
    const nodes = [];
    const links = [];

    // Compute scale factors from data extremes
    let maxVol = 0;
    for (const n of elements.nodes || []) {
      const v = parseFloat(n.data?.totalVolume ?? n.data?.value_lossless ?? 0);
      if (v > maxVol) maxVol = v;
    }
    const scaleFactor = maxVol > 0 ? Math.sqrt(maxVol) / 13 : 1;

    let maxLogAmt = 0;
    for (const e of elements.edges || []) {
      const la = parseFloat(e.data?.logAmount ?? 0);
      if (la > maxLogAmt) maxLogAmt = la;
    }
    const edgeWidthScale = maxLogAmt > 0 ? 4 / maxLogAmt : 1;

    // Pre-count cluster sizes across ALL nodes (before any filtering)
    // so the threshold is based on raw cluster membership, not post-filter counts.
    const rawClusterSizes = new Map();
    for (const n of elements.nodes || []) {
      const cid = n.data?.clusterId ?? -1;
      if (cid >= 0) rawClusterSizes.set(cid, (rawClusterSizes.get(cid) || 0) + 1);
    }

    // Pre-count node connection degrees across edges
    const degreeMap = new Map();
    for (const e of elements.edges || []) {
      const src = e.data?.source;
      const tgt = e.data?.target;
      if (src) degreeMap.set(src, (degreeMap.get(src) || 0) + 1);
      if (tgt) degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
    }

    for (const n of elements.nodes || []) {
      const normVol = parseFloat(n.data?.normalizedVolume ?? 0);
      const totalVol = parseFloat(n.data?.totalVolume ?? n.data?.value_lossless ?? 0);
      const logVol = parseFloat(n.data?.logVolume ?? 0);
      const risk = n.data?.riskScore || 0;
      const clusterId = n.data?.clusterId ?? -1;
      const fraudPattern = n.data?.fraudPattern || "normal";
      const degree = degreeMap.get(n.data.id) || 0;

      if (volumeThreshold > 0 && normVol < volumeThreshold) continue;
      if (clusterSizeThreshold > 0 && clusterId >= 0 && (rawClusterSizes.get(clusterId) || 0) < clusterSizeThreshold) continue;

      const isHighlighted =
        highlightedNodes.includes(n.data.id) || highlightedNodes.includes(n.data.label);
      const isOnPath =
        highlightPath.includes(n.data.id) || highlightPath.includes(n.data.label);

      // Color priority: path > highlighted > cluster > fraud > risk
      let color;
      if (isOnPath) {
        color = "hsl(45, 100%, 60%)";
      } else if (isHighlighted) {
        color = "hsl(0, 85%, 55%)";
      } else if (colorMode === "cluster" && clusterId >= 0) {
        color = clusterColor(clusterId);
      } else if (FRAUD_COLORS[fraudPattern]) {
        color = FRAUD_COLORS[fraudPattern];
      } else {
        color = riskColor(risk, settings.colorSensitivity);
      }

      // Node size: sqrt-scaled so largest ~ 16, smallest = 3
      const nodeSize = 3 + Math.sqrt(totalVol) / scaleFactor;

      // Z target from normalizedVolume: -150 (low volume) to +150 (high volume)
      const fzTarget = normVol * 300 - 150;

      const node = {
        id: n.data.id,
        label: n.data.label || n.data.id,
        address: n.data.address || n.data.label || n.data.id,
        nodeType: n.data.nodeType || "Wallet",
        totalVolume: totalVol,
        logVolume: logVol,
        normalizedVolume: normVol,
        riskScore: risk,
        clusterId,
        fraudPattern,
        color,
        isHighlighted,
        isOnPath,
        fzTarget,
        nodeSize,
        degree,
        glowIntensity: normVol,
      };
      nodes.push(node);
      nodeMap.set(n.data.id, node);
    }

    for (const e of elements.edges || []) {
      if (!nodeMap.has(e.data.source) || !nodeMap.has(e.data.target)) continue;

      const isPathEdge =
        highlightPath.length > 1 &&
        highlightPath.includes(e.data.source) &&
        highlightPath.includes(e.data.target);

      const logAmt = parseFloat(e.data?.logAmount ?? 0);

      links.push({
        source: e.data.source,
        target: e.data.target,
        edgeType: e.data.edgeType,
        amount: e.data.amount,
        coin_type: e.data.coin_type,
        timestamp: e.data.timestamp,
        txid: e.data.txid || e.data.id,
        label: e.data.label,
        normalizedTime: parseFloat(e.data?.normalizedTime ?? 0),
        color: isPathEdge ? "rgba(245, 158, 11, 0.9)" : "rgba(100, 130, 210, 0.4)",
        width: isPathEdge ? 3 : Math.max(0.3, logAmt * edgeWidthScale),
        isPathEdge,
      });
    }

    return { nodes, links };
  }, [elements, highlightedNodes, highlightPath, volumeThreshold, clusterSizeThreshold, colorMode, settings.colorSensitivity]);

  // ═══════════════════════════════════════════════════════════════════
  // 3D Graph init & update
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!containerRef.current || !ForceGraph3DModule) return;

    const container = containerRef.current;

    // Save camera before destroying previous instance
    if (graphRef.current) {
      try {
        const pos = graphRef.current.cameraPosition();
        if (pos) cameraStateRef.current = pos;
      } catch (_) { /* ignore */ }
      graphRef.current._destructor?.();
      graphRef.current = null;
      while (container.firstChild) container.removeChild(container.firstChild);
    }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (orbitRef.current) { cancelAnimationFrame(orbitRef.current); orbitRef.current = null; }
    if (wasdFrameRef.current) { cancelAnimationFrame(wasdFrameRef.current); wasdFrameRef.current = null; }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    sceneExtrasRef.current = [];

    // ── Fraud layout mode: fix positions ──
    if (layoutMode === "fraud") {
      const fraudPositions = computeFraudLayout(graphData.nodes);
      for (const node of graphData.nodes) {
        const pos = fraudPositions.get(node.id);
        if (pos) { node.fx = pos.fx; node.fy = pos.fy; node.fz = pos.fz; }
      }
    } else {
      for (const node of graphData.nodes) {
        delete node.fx; delete node.fy; delete node.fz;
        // Seed near centre with a tiny random jitter so nodes don't
        // all start at exactly (0,0,0) and scatter unpredictably.
        node.x = (Math.random() - 0.5) * 30;
        node.y = (Math.random() - 0.5) * 30;
        node.z = (Math.random() - 0.5) * 30;
      }
    }

    const _reduceAnim = reduceAnimations;
    const effectCleanup = { cancelled: false };

    // ───────────────────────────────────────────────────────────────
    // Instantiate 3d-force-graph
    // ───────────────────────────────────────────────────────────────
    const Graph = ForceGraph3DModule()(container)
      .backgroundColor("#050816")
      .showNavInfo(false)

      // Curved edges
      .linkCurvature(0.25)
      .linkCurveRotation(0)

      // ── Custom node rendering: sphere + glow sprite ──
      .nodeThreeObject((node) => {
        const T = window.__THREE__;
        if (!T) return undefined;

        const s = node.nodeSize || 5;
        const { r, g, b } = parseColor(node.color);
        const col = new T.Color(r / 255, g / 255, b / 255);

        const geo = new T.SphereGeometry(s * 0.5, 20, 20);
        const mat = new T.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 1.2,
          roughness: 0.15,
          metalness: 0.3,
          transparent: true,
          opacity: 0.95,
        });
        const sphere = new T.Mesh(geo, mat);

        if (!_reduceAnim && settingsRef.current.glowIntensity > 0) {
          const glowScale = 1 + node.normalizedVolume * 2.8 * settingsRef.current.glowIntensity;
          const canvas = createGlowTexture(
            node.color,
            node.glowIntensity * settingsRef.current.glowIntensity
          );
          const tex = new T.CanvasTexture(canvas);
          const spriteMat = new T.SpriteMaterial({
            map: tex,
            transparent: true,
            blending: T.AdditiveBlending,
            depthWrite: false,
          });
          const sprite = new T.Sprite(spriteMat);
          sprite.scale.set(s * 3.4 * glowScale, s * 3.4 * glowScale, 1);

          const group = new T.Group();
          group.add(sphere);
          group.add(sprite);
          return group;
        }
        return sphere;
      })

      // ── Node tooltip ──
      .nodeLabel((node) => {
        const addr = node.label?.length > 20
          ? node.label.slice(0, 10) + "\u2026" + node.label.slice(-6)
          : node.label;
        const vol = node.totalVolume > 1e15
          ? (node.totalVolume / 1e18).toFixed(4) + " ETH"
          : node.totalVolume.toLocaleString() + " Wei";
        const riskHue = Math.max(0, Math.round(120 - (node.riskScore || 0) * 1.2));
        const patternBadge = node.fraudPattern !== "normal"
          ? `<div style="margin-top:2px;color:${FRAUD_COLORS[node.fraudPattern] || "#fff"};font-weight:700;">\u26a0 ${node.fraudPattern.toUpperCase()}</div>`
          : "";
        return `<div style="background:rgba(0,0,0,0.95);color:#e4e4e7;padding:8px 12px;border-radius:8px;font-size:12px;font-family:monospace;border:1px solid #27272a;pointer-events:none;max-width:300px;">
          <div style="font-weight:700;margin-bottom:4px;">${addr}</div>
          <div style="color:#a1a1aa;">Volume: <span style="color:${node.color}">${vol}</span></div>
          <div style="color:#a1a1aa;">LogVol: <span style="color:#818cf8">${node.logVolume.toFixed(2)}</span></div>
          <div style="color:#a1a1aa;">Risk: <span style="color:hsl(${riskHue}, 85%, 60%)">${node.riskScore}</span></div>
          <div style="color:#a1a1aa;">Cluster: <span style="color:${clusterColor(node.clusterId)}">#${node.clusterId}</span></div>
          ${patternBadge}
        </div>`;
      })

      // ── Link tooltip ──
      .linkLabel((link) => {
        const src = typeof link.source === "object" ? (link.source.label || link.source.id) : link.source;
        const tgt = typeof link.target === "object" ? (link.target.label || link.target.id) : link.target;
        const shortSrc = src?.length > 16 ? src.slice(0, 8) + "\u2026" + src.slice(-6) : src;
        const shortTgt = tgt?.length > 16 ? tgt.slice(0, 8) + "\u2026" + tgt.slice(-6) : tgt;
        const amt = link.amount != null
          ? `${Number(link.amount).toLocaleString()} ${link.coin_type || ""}`.trim()
          : "\u2014";
        const ts = link.timestamp
          ? new Date(link.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
          : null;
        const txShort = link.txid?.length > 20
          ? link.txid.slice(0, 10) + "\u2026" + link.txid.slice(-6)
          : link.txid;
        const pathBadge = link.isPathEdge
          ? `<div style="margin-top:4px;color:#f59e0b;font-weight:700;">&#9654; Path edge</div>`
          : "";
        return `<div style="background:rgba(0,0,0,0.95);color:#e4e4e7;padding:8px 12px;border-radius:8px;font-size:12px;font-family:monospace;border:1px solid #27272a;pointer-events:none;max-width:320px;">
          <div style="font-weight:700;margin-bottom:4px;color:#818cf8;">&#8594; Transfer</div>
          <div style="color:#a1a1aa;">From: <span style="color:#e4e4e7">${shortSrc}</span></div>
          <div style="color:#a1a1aa;">To: &nbsp;&nbsp;<span style="color:#e4e4e7">${shortTgt}</span></div>
          <div style="color:#a1a1aa;margin-top:4px;">Amount: <span style="color:#34d399">${amt}</span></div>
          ${ts ? `<div style="color:#a1a1aa;">Date: <span style="color:#e4e4e7">${ts}</span></div>` : ""}
          ${txShort ? `<div style="color:#a1a1aa;">TxID: <span style="color:#71717a">${txShort}</span></div>` : ""}
          ${pathBadge}
        </div>`;
      })

      // ── Edge visuals ──
      .linkColor((link) => link.color)
      .linkWidth((link) => link.width)
      .linkOpacity(0.55)
      .linkDirectionalParticles(_reduceAnim ? 0 : settingsRef.current.particleCount)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(settingsRef.current.particleSpeed)
      .linkDirectionalParticleColor((link) =>
        link.isPathEdge ? "#f59e0b" : "rgba(140, 160, 210, 0.5)"
      )

      // ── Physics engine parameters ──
      .d3AlphaDecay(0.028)
      .d3VelocityDecay(0.35)
      .warmupTicks(80)
      .cooldownTicks(220)

      // ── Interaction ──
      .onNodeClick((node) => {
        if (onNodeClickRef.current && (!node.nodeType || node.nodeType === "Wallet")) {
          onNodeClickRef.current(node.address || node.label || node.id);
        }
      })
      .onNodeHover((node) => {
        hoveredNodeRef.current = node || null;
        setHoveredNode(node || null);
        window.dispatchEvent(
          new CustomEvent("graph-node-hover", { detail: { node: node || null } })
        );
      })
      .enableNodeDrag(false);

    // Middle-click: open wallet in new tab
    const handleAuxClick = (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      const node = hoveredNodeRef.current;
      if (node && (!node.nodeType || node.nodeType === "Wallet")) {
        window.open(`/wallet/${encodeURIComponent(node.address || node.label || node.id)}`, "_blank", "noopener,noreferrer");
      }
    };
    container.addEventListener("auxclick", handleAuxClick);

    // ───────────────────────────────────────────────────────────────
    // PHYSICS FORCES
    //
    //   1. charge    — many-body repulsion
    //   2. link      — spring keeps connected nodes together
    //   3. gravity   — inward pull, inversely weighted by node volume
    //                  so heavy/large nodes feel less pull and drift out
    //   4. spiral    — tangential nudge around cluster centroids giving
    //                  same-cluster nodes a gentle orbital swirl
    //   5. collision — prevent visual overlap
    // ───────────────────────────────────────────────────────────────

    // 1. Charge: repulsion only — nodes push each other away
    const nodeCount = graphData.nodes.length;
    const chargeStrength = nodeCount > 100 ? -80 : nodeCount > 30 ? -120 : -180;
    Graph.d3Force("charge").strength(chargeStrength).distanceMax(400);

    // 2. Link: spring force — connected nodes stay close
    const linkDist = nodeCount > 100 ? 40 : nodeCount > 30 ? 55 : 70;
    Graph.d3Force("link").distance(linkDist).strength(0.5);

    // Remove all other default forces that might bias positions
    Graph.d3Force("center", null);
    Graph.d3Force("x", null);
    Graph.d3Force("y", null);
    Graph.d3Force("z", null);
    Graph.d3Force("cluster", null);
    Graph.d3Force("bounds", null);

    // 3. Volume-aware gravity: pulls nodes toward origin.
    //    Heavy (large nodeSize) nodes feel less pull so they drift
    //    outward naturally rather than piling up at the centre.
    Graph.d3Force("gravity", (alpha) => {
      const strength = alpha * (settingsRef.current?.gravity ?? 0.015);
      for (const node of graphData.nodes) {
        if (node.fx !== undefined) continue;
        const nx = node.x || 0;
        const ny = node.y || 0;
        const nz = node.z || 0;
        const dist = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        // Heavier nodes (larger nodeSize) get less pull — they spread outward
        const massFactor = 1 / Math.max(1, (node.nodeSize || 5) * 0.25);
        const pull = strength * Math.sqrt(dist) * massFactor;
        node.vx = (node.vx || 0) - (nx / dist) * pull;
        node.vy = (node.vy || 0) - (ny / dist) * pull;
        node.vz = (node.vz || 0) - (nz / dist) * pull;
      }
    });

    // 4. Spiral + cluster-size gravity: big clusters → centre,
    //    small clusters → farther out. Also adds tangential swirl.
    //    Pre-compute cluster sizes once, then use both in the force.
    const clusterSizes = new Map();
    for (const n of graphData.nodes) {
      if (n.clusterId < 0) continue;
      clusterSizes.set(n.clusterId, (clusterSizes.get(n.clusterId) || 0) + 1);
    }
    let maxCluster = 1;
    for (const sz of clusterSizes.values()) if (sz > maxCluster) maxCluster = sz;

    Graph.d3Force("spiral", (alpha) => {
      if (alpha < 0.003) return;
      const centroids = new Map();
      const counts = new Map();
      for (const n of graphData.nodes) {
        if (n.clusterId < 0) continue;
        if (!centroids.has(n.clusterId)) {
          centroids.set(n.clusterId, { x: 0, y: 0, z: 0 });
          counts.set(n.clusterId, 0);
        }
        const c = centroids.get(n.clusterId);
        c.x += n.x || 0; c.y += n.y || 0; c.z += n.z || 0;
        counts.set(n.clusterId, counts.get(n.clusterId) + 1);
      }
      for (const [cid, c] of centroids) {
        const cnt = counts.get(cid);
        c.x /= cnt; c.y /= cnt; c.z /= cnt;
      }

      const swirl = alpha * 0.06;
      const clusterCentrePull = alpha * 0.05;

      for (const n of graphData.nodes) {
        if (n.clusterId < 0 || n.fx !== undefined) continue;
        const c = centroids.get(n.clusterId);
        if (!c) continue;
        const csz = clusterSizes.get(n.clusterId) || 1;

        // --- Cluster-size gravity: bigger clusters pulled toward origin ---
        // sizeRatio near 1 for the biggest cluster, near 0 for tiny ones.
        // Bigger cluster → stronger pull toward origin.
        const sizeRatio = csz / maxCluster;
        const pullToOrigin = clusterCentrePull * sizeRatio;
        const cx = c.x || 0, cy = c.y || 0, cz = c.z || 0;
        const cDist = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
        n.vx = (n.vx || 0) - (cx / cDist) * pullToOrigin * Math.sqrt(cDist);
        n.vy = (n.vy || 0) - (cy / cDist) * pullToOrigin * Math.sqrt(cDist);
        n.vz = (n.vz || 0) - (cz / cDist) * pullToOrigin * Math.sqrt(cDist);

        // --- Tangential swirl around cluster centroid (in XZ plane) ---
        const rx = (n.x || 0) - c.x;
        const rz = (n.z || 0) - c.z;
        const len = Math.sqrt(rx * rx + rz * rz) || 1;
        n.vx = (n.vx || 0) + (-rz / len) * swirl;
        n.vz = (n.vz || 0) + (rx / len) * swirl;
      }
    });

    // 5. Collision: prevent node overlap
    import("d3-force-3d").then((d3) => {
      if (!graphRef.current || effectCleanup.cancelled) return;
      Graph.d3Force(
        "collision",
        d3.forceCollide((node) => (node.nodeSize || 5) * 1.0)
      );
    }).catch(() => {});

    // Feed data to graph
    setGraphReady(false);
    Graph.graphData(graphData);

    // Mark graph ready + optional fly-to-focus when simulation settles
    Graph.onEngineStop(() => {
      setGraphReady(true);
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    });

    // Safety fallback: never keep the interaction-blocking loading overlay forever.
    readyTimeoutRef.current = setTimeout(() => {
      if (!effectCleanup.cancelled) setGraphReady(true);
    }, 400);

    // ── Scene enhancements: lighting, fog, starfield ──
    setTimeout(() => {
      if (effectCleanup.cancelled) return;
      const scene = Graph.scene?.();
      const T = window.__THREE__;
      if (!scene || !T) return;

      const ambient = new T.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      sceneExtrasRef.current.push(ambient);

      const pointLight = new T.PointLight(0xffffff, 1, 0);
      pointLight.position.set(200, 200, 400);
      scene.add(pointLight);
      sceneExtrasRef.current.push(pointLight);

      const accentLight = new T.PointLight(0x6366f1, 0.4, 0);
      accentLight.position.set(-300, -100, -200);
      scene.add(accentLight);
      sceneExtrasRef.current.push(accentLight);

      const fogDensity = _reduceAnim ? 0 : settingsRef.current.fogDensity;
      scene.fog = fogDensity > 0 ? new T.FogExp2(0x050816, fogDensity) : null;

      if (starfieldMeshRef.current) {
        scene.remove(starfieldMeshRef.current);
        starfieldMeshRef.current.geometry?.dispose();
        starfieldMeshRef.current.material?.dispose();
        starfieldMeshRef.current = null;
      }

      const dustCount = settingsRef.current.dustCount ?? 4000;
      if (dustCount > 0) {
        const stars = createStarfield(T, dustCount, 2000);
        scene.add(stars);
        starfieldMeshRef.current = stars;
        sceneExtrasRef.current.push(stars);
      }
    }, 100);

    // ── Restore or set initial camera position ──
    setTimeout(() => {
      if (effectCleanup.cancelled) return;
      if (cameraStateRef.current) {
        const saved = cameraStateRef.current;
        Graph.cameraPosition(
          { x: saved.x, y: saved.y, z: saved.z },
          { x: 0, y: 0, z: 0 },
          0
        );
      } else {
        Graph.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
      }
    }, 200);

    graphRef.current = Graph;

    // ── Helper to check if event target is an editable input ──
    const isTargetEditable = (target) => {
      if (!target) return false;
      const tag = target.tagName ? target.tagName.toUpperCase() : "";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return true;
      if (target.isContentEditable) return true;
      if (target.closest && target.closest("input, textarea, select, [contenteditable='true']")) return true;
      return false;
    };

    // ── User interaction tracking ──
    const onInteract = () => { userInteractedRef.current = true; };
    container.addEventListener("pointerdown", onInteract);
    container.addEventListener("wheel", onInteract);

    // ── Ctrl key → enable node drag ──
    const onCtrlDown = (e) => {
      if (isTargetEditable(e.target)) return;
      if (e.key === "Control") {
        graphRef.current?.enableNodeDrag(true);
        container.style.cursor = "grab";
      }
    };
    const onCtrlUp = (e) => {
      if (e.key === "Control") {
        graphRef.current?.enableNodeDrag(false);
        container.style.cursor = "default";
      }
    };
    window.addEventListener("keydown", onCtrlDown);
    window.addEventListener("keyup", onCtrlUp);

    // ── Clear keys & drag state on window blur to prevent stuck WASD drift ──
    const onWindowBlur = () => {
      keysRef.current.clear();
      graphRef.current?.enableNodeDrag(false);
      if (container) container.style.cursor = "default";
    };
    window.addEventListener("blur", onWindowBlur);

    // ── WASD spaceship-style controls (momentum + drift) ──
    const THRUST = 0.6;
    const SHIFT_MULTIPLIER = 3;
    const FRICTION = 0.97;  // how fast velocity decays (1 = no friction)

    const onKeyDown = (e) => {
      if (isTargetEditable(e.target)) return;

      // Escape key: close panel / cancel focus
      if (e.key === "Escape") {
        setIsPanelOpen(false);
        setHoveredNode(null);
        hoveredNodeRef.current = null;
        return;
      }

      // Intercept Ctrl + D (or Cmd + D) for autorotation at FIXED camera radius
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        e.stopPropagation();
        const nextState = !autoRotateRef.current;
        autoRotateRef.current = nextState;
        setIsAutoRotating(nextState);

        if (graphRef.current) {
          try {
            const controls = graphRef.current.controls?.();
            if (controls) {
              controls.autoRotate = nextState;
              controls.autoRotateSpeed = (settingsRef.current?.orbitSpeed || 0.0008) * 2500;
            }
          } catch (_) {}
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "q", "e", " ", "shift"].includes(key)) {
        if (key === "d" && (e.ctrlKey || e.metaKey)) return;
        keysRef.current.add(key);
        if (key === " ") e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      if (isTargetEditable(e.target)) return;
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const vel = cameraVelRef.current;
    const wasdTick = () => {
      if (effectCleanup.cancelled) return;
      // FPS measurement
      const fpsData = fpsRef.current;
      fpsData.frames++;
      const now = performance.now();
      if (now - fpsData.lastTime >= 1000) {
        setFps(fpsData.frames);
        fpsData.frames = 0;
        fpsData.lastTime = now;
      }
      if (!graphRef.current) {
        wasdFrameRef.current = requestAnimationFrame(wasdTick);
        return;
      }
      const keys = keysRef.current;
      const camera = graphRef.current.camera?.();
      const T = window.__THREE__;
      if (camera && T) {
        const thrust = keys.has("shift") ? THRUST * SHIFT_MULTIPLIER : THRUST;
        const forward = new T.Vector3();
        camera.getWorldDirection(forward);
        const right = new T.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        const up = new T.Vector3(0, 1, 0);

        // Accumulate thrust while keys are held
        if (keys.has("w"))              { vel.x += forward.x * thrust; vel.y += forward.y * thrust; vel.z += forward.z * thrust; }
        if (keys.has("s"))              { vel.x -= forward.x * thrust; vel.y -= forward.y * thrust; vel.z -= forward.z * thrust; }
        if (keys.has("a"))              { vel.x -= right.x * thrust;   vel.y -= right.y * thrust;   vel.z -= right.z * thrust; }
        if (keys.has("d"))              { vel.x += right.x * thrust;   vel.y += right.y * thrust;   vel.z += right.z * thrust; }
        if (keys.has("q") || keys.has(" ")) { vel.x += up.x * thrust; vel.y += up.y * thrust; vel.z += up.z * thrust; }
        if (keys.has("e"))              { vel.x -= up.x * thrust;      vel.y -= up.y * thrust;      vel.z -= up.z * thrust; }

        if (keys.size > 0) userInteractedRef.current = true;

        // Apply velocity and friction (ship drifts after releasing keys)
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (speed > 0.01) {
          const pos = graphRef.current.cameraPosition();
          graphRef.current.cameraPosition({ x: pos.x + vel.x, y: pos.y + vel.y, z: pos.z + vel.z });
        }
        vel.x *= FRICTION; vel.y *= FRICTION; vel.z *= FRICTION;
      }
      wasdFrameRef.current = requestAnimationFrame(wasdTick);
    };
    wasdFrameRef.current = requestAnimationFrame(wasdTick);

    // ── Temporal animation ──
    if (animateTime && graphData.links.length > 0 && !_reduceAnim) {
      const sorted = [...graphData.links].sort((a, b) => a.normalizedTime - b.normalizedTime);
      const DURATION = 8000;
      const start = performance.now();
      const tick = () => {
        if (effectCleanup.cancelled) return;
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / DURATION);
        const cutoff = sorted.findIndex((l) => l.normalizedTime > t);
        const visibleLinks = cutoff === -1 ? sorted : sorted.slice(0, cutoff);
        Graph.graphData({ nodes: graphData.nodes, links: visibleLinks });
        if (t < 1) animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }

    // Resize observer
    const resizeObs = new ResizeObserver(() => {
      if (graphRef.current) {
        graphRef.current.width(container.clientWidth);
        graphRef.current.height(container.clientHeight);
      }
    });
    resizeObs.observe(container);

    // Capture ref for cleanup
    const keysSet = keysRef.current;

    // ── Cleanup ──
    return () => {
      effectCleanup.cancelled = true;
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onCtrlDown);
      window.removeEventListener("keyup", onCtrlUp);
      window.removeEventListener("blur", onWindowBlur);
      keysSet.clear();
      container.removeEventListener("pointerdown", onInteract);
      container.removeEventListener("wheel", onInteract);
      container.removeEventListener("auxclick", handleAuxClick);
      resizeObs.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (orbitRef.current) cancelAnimationFrame(orbitRef.current);
      if (wasdFrameRef.current) cancelAnimationFrame(wasdFrameRef.current);
      const scene = graphRef.current?.scene?.();
      if (scene) {
        for (const obj of sceneExtrasRef.current) scene.remove(obj);
      }
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
    };
  }, [ForceGraph3DModule, graphData, animateTime, layoutMode, reduceAnimations]);

  // Focus camera on a specific node without recreating the graph instance.
  // We only want to trigger this if focusNodeId changes AFTER the initial layout.
  useEffect(() => {
    if (!focusNodeId || !graphRef.current || !graphReady) return;
    const target = graphData.nodes.find(
      (n) => n.id === focusNodeId || n.label === focusNodeId
    );
    if (!target) return;

    const { x = 0, y = 0, z = 0 } = target;
    try {
      if (!userInteractedRef.current) {
        graphRef.current.cameraPosition(
          { x: x + 200, y: y + 50, z: z + 300 },
          { x, y, z },
          900
        );
      }
    } catch (_) {
      // Ignore camera transition failures when graph is still initializing.
    }
  }, [focusNodeId, graphReady, graphData]);

  // ── Live settings updates (no full recreation) ──
  const prevGravityRef = useRef(null);
  const prevGlowRef = useRef(settings.glowIntensity);
  const prevDustRef = useRef(settings.dustCount);
  useEffect(() => {
    const G = graphRef.current;
    if (!G) return;
    G.linkDirectionalParticles(reduceAnimations ? 0 : settings.particleCount);
    G.linkDirectionalParticleSpeed(settings.particleSpeed);

    if (G.controls?.()) {
      G.controls().autoRotateSpeed = (settings.orbitSpeed || 0.0008) * 2500;
    }

    const scene = G.scene?.();
    if (scene && window.__THREE__) {
      const T = window.__THREE__;
      const fogDensity = reduceAnimations ? 0 : settings.fogDensity;
      scene.fog = fogDensity > 0 ? new T.FogExp2(0x050816, fogDensity) : null;

      if (prevDustRef.current !== settings.dustCount) {
        prevDustRef.current = settings.dustCount;
        if (starfieldMeshRef.current) {
          scene.remove(starfieldMeshRef.current);
          starfieldMeshRef.current.geometry?.dispose();
          starfieldMeshRef.current.material?.dispose();
          starfieldMeshRef.current = null;
        }
        if (settings.dustCount > 0) {
          const stars = createStarfield(T, settings.dustCount, 2000);
          scene.add(stars);
          starfieldMeshRef.current = stars;
        }
      }
    }
    // Reheat the simulation when gravity changes so the force has ticks to run
    if (prevGravityRef.current !== null && prevGravityRef.current !== settings.gravity) {
      try { G.d3ReheatSimulation(); } catch (_) {}
    }
    prevGravityRef.current = settings.gravity;

    // Refresh nodeThreeObject when glowIntensity changes
    if (prevGlowRef.current !== settings.glowIntensity) {
      prevGlowRef.current = settings.glowIntensity;
      try {
        G.nodeThreeObject(G.nodeThreeObject());
      } catch (_) {}
    }
  }, [settings, reduceAnimations]);

  // ═══════════════════════════════════════════════════════════════════
  // Legend & controls UI
  // ═══════════════════════════════════════════════════════════════════
  const riskGradient = "linear-gradient(to right, hsl(120,85%,60%), hsl(60,85%,60%), hsl(0,85%,60%))";
  const clusterCount = new Set(graphData.nodes.map((n) => n.clusterId)).size;
  const fraudCounts = {};
  for (const n of graphData.nodes) {
    if (n.fraudPattern !== "normal") {
      fraudCounts[n.fraudPattern] = (fraudCounts[n.fraudPattern] || 0) + 1;
    }
  }

  return (
    <div className="relative" style={style}>
      <CustomCursor scopeRef={containerRef} />
      <div
        ref={containerRef}
        className="graph-container-3d custom-cursor-scope"
        style={{ width: "100%", height: "100%" }}
        tabIndex={0}
      />

      {/* ── Auto-Rotate Active Banner ── */}
      {isAutoRotating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-indigo-500/40 bg-black/85 px-4 py-1.5 backdrop-blur-md shadow-2xl text-xs font-mono text-indigo-300">
          <RotateCw size={13} className="animate-spin text-indigo-400" />
          <span>Auto-Rotating Graph</span>
          <span className="text-[10px] text-muted">(Ctrl+D to toggle)</span>
          <button
            onClick={() => {
              autoRotateRef.current = false;
              setIsAutoRotating(false);
              if (graphRef.current?.controls?.()) {
                graphRef.current.controls().autoRotate = false;
              }
            }}
            className="ml-1 rounded bg-white/10 p-0.5 hover:bg-white/20 text-foreground transition-colors"
            title="Pause Rotation"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Collapsible Right-Side Node Inspector Preview Panel ── */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end">
        {!isPanelOpen ? (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-card-border bg-black/90 px-3.5 py-2 text-xs font-medium text-foreground shadow-2xl backdrop-blur-md hover:border-accent hover:text-white transition-all"
          >
            <Activity size={14} className="text-accent animate-pulse" />
            <span>Node Inspector</span>
            <ChevronLeft size={14} className="text-muted" />
          </button>
        ) : (
          <div className="w-80 rounded-xl border border-card-border bg-black/90 p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 transition-all text-foreground">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-card-border/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-accent/15 p-1.5 text-accent">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-tight text-foreground uppercase">Node Inspector</h3>
                  <p className="text-[10px] text-muted">
                    {hoveredNode ? "Live Hover Preview" : "Hover over a node"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="rounded-md p-1 text-muted hover:bg-white/10 hover:text-foreground transition-colors"
                title="Collapse Panel"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Hovered Node Details */}
            {hoveredNode ? (
              <div className="flex flex-col gap-3 text-xs">
                {/* Address & Copy/Inspect Actions */}
                <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2.5">
                  <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Node Identifier</span>
                    <span className="font-mono text-[9px] text-accent font-semibold">{hoveredNode.nodeType || "Wallet"}</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-foreground break-all tracking-tight">
                    {hoveredNode.label || hoveredNode.address || hoveredNode.id}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(hoveredNode.address || hoveredNode.label || hoveredNode.id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="flex items-center gap-1 rounded border border-card-border bg-background px-2 py-1 text-[10px] font-mono text-muted hover:text-foreground hover:border-accent transition-colors"
                    >
                      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      <span>{copied ? "Copied" : "Copy Address"}</span>
                    </button>
                    {(!hoveredNode.nodeType || hoveredNode.nodeType === "Wallet") && (
                      <a
                        href={`/wallet/${encodeURIComponent(hoveredNode.address || hoveredNode.label || hoveredNode.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded bg-accent/20 border border-accent/40 px-2 py-1 text-[10px] font-mono text-accent hover:bg-accent hover:text-white transition-all"
                      >
                        <ExternalLink size={10} />
                        <span>Inspect Wallet</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Risk Score Meter */}
                <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Risk Factor</span>
                    <span
                      className="font-mono font-bold text-xs px-2 py-0.5 rounded"
                      style={{
                        color: riskColor(hoveredNode.riskScore),
                        backgroundColor: `${riskColor(hoveredNode.riskScore)}15`,
                        border: `1px solid ${riskColor(hoveredNode.riskScore)}40`
                      }}
                    >
                      {hoveredNode.riskScore || 0} / 100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-card-border/60 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, hoveredNode.riskScore || 0))}%`,
                        background: riskGradient
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-muted font-mono">
                    <span>Low (0)</span>
                    <span>Medium (50)</span>
                    <span>Critical (100)</span>
                  </div>
                </div>

                {/* Fraud Pattern Badge */}
                {hoveredNode.fraudPattern && hoveredNode.fraudPattern !== "normal" && (
                  <div
                    className="flex items-center gap-2 rounded-lg p-2.5 border"
                    style={{
                      borderColor: FRAUD_COLORS[hoveredNode.fraudPattern] || "#ef4444",
                      backgroundColor: `${FRAUD_COLORS[hoveredNode.fraudPattern] || "#ef4444"}15`
                    }}
                  >
                    <ShieldAlert size={16} style={{ color: FRAUD_COLORS[hoveredNode.fraudPattern] }} />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: FRAUD_COLORS[hoveredNode.fraudPattern] }}>
                        Fraud Pattern Detected
                      </div>
                      <div className="text-xs font-mono font-semibold text-foreground">
                        {hoveredNode.fraudPattern.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2">
                    <div className="text-[9px] text-muted font-semibold uppercase">Total Volume</div>
                    <div className="font-mono font-bold text-foreground mt-0.5 truncate">
                      {hoveredNode.totalVolume > 1e15
                        ? (hoveredNode.totalVolume / 1e18).toFixed(4) + " ETH"
                        : (hoveredNode.totalVolume || 0).toLocaleString() + " Wei"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2">
                    <div className="text-[9px] text-muted font-semibold uppercase">Log Volume</div>
                    <div className="font-mono font-bold text-indigo-400 mt-0.5">
                      {hoveredNode.logVolume?.toFixed(2) ?? "0.00"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2">
                    <div className="text-[9px] text-muted font-semibold uppercase">Community</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ background: clusterColor(hoveredNode.clusterId) }}
                      />
                      <span className="font-mono font-bold text-foreground">
                        #{hoveredNode.clusterId ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-card-border/60 bg-white/[0.03] p-2">
                    <div className="text-[9px] text-muted font-semibold uppercase">Connections</div>
                    <div className="font-mono font-bold text-amber-400 mt-0.5">
                      {hoveredNode.degree ?? 0} edges
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-6 px-3 text-center border border-dashed border-card-border/80 rounded-lg bg-white/[0.01]">
                <div className="relative mb-2">
                  <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                    <Activity size={20} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground">No Node Hovered</p>
                <p className="text-[10px] text-muted leading-relaxed mt-1 max-w-[200px]">
                  Hover over any node in the graph to preview risk metrics, cluster data & transaction history.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fakeload overlay ─────────────────────────────────────────
           Phase 1 (!graphReady && !fadeOut):
             fakeload.png sits behind pulsing rings, kept permanently blurred
             so the fake image is never clearly revealed.
           Phase 2 (fadeOut && !overlayDone):
             Entire overlay (blurred image + tint) fades out with a subtle
             opacity transition — the real graph is directly uncovered.
           Phase 3 (overlayDone):
             Overlay removed from DOM entirely.
      ────────────────────────────────────────────────────────────── */}
      {!overlayDone && (
        <>
          <style>{`
            @keyframes graphPulseRing {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50%      { transform: scale(1.15); opacity: 0.7; }
            }
            @keyframes graphDotPulse {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50%      { transform: scale(1.8); opacity: 1; }
            }
            @keyframes graphTextFade {
              0%, 100% { opacity: 0.4; }
              50%      { opacity: 0.9; }
            }
            /* Whole overlay fades out — image stays blurred, real graph revealed */
            @keyframes fakeOverlayFadeOut {
              0%   { opacity: 1; }
              100% { opacity: 0; }
            }
          `}</style>

          {/* Wrapper fades the entire overlay when graph is ready */}
          <div
            className="absolute inset-0 z-40 pointer-events-none"
            style={fadeOut ? { animation: "fakeOverlayFadeOut 0.7s ease-out forwards" } : undefined}
            onAnimationEnd={fadeOut ? () => setOverlayDone(true) : undefined}
          >
            {/* Fake image — permanently blurred, never revealed */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/fakeload.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(8px) brightness(0.45)",
                transform: "scale(1.04)", /* hide blur edge artefacts */
              }}
            />

            {/* Dark tint + pulsing rings — hidden during the fade-out phase */}
            {!fadeOut && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050816]/65 pointer-events-none">
                <div className="relative h-24 w-24">
                  <div
                    className="absolute inset-0 rounded-full border border-indigo-500/30"
                    style={{ animation: "graphPulseRing 2.4s ease-in-out infinite" }}
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-indigo-400/40"
                    style={{ animation: "graphPulseRing 2.4s ease-in-out 0.3s infinite" }}
                  />
                  <div
                    className="absolute inset-4 rounded-full border border-indigo-300/50"
                    style={{ animation: "graphPulseRing 2.4s ease-in-out 0.6s infinite" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-2 w-2 rounded-full bg-indigo-400"
                      style={{ animation: "graphDotPulse 1.6s ease-in-out infinite" }}
                    />
                  </div>
                </div>
                <p
                  className="mt-5 text-xs font-medium tracking-widest text-indigo-300/70 uppercase"
                  style={{ animation: "graphTextFade 2s ease-in-out infinite" }}
                >
                  Rendering graph
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 rounded-lg border border-card-border bg-card/90 px-3 py-2 backdrop-blur-sm">
        {colorMode === "risk" ? (
          <>
            <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
              Risk Score
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-16 rounded-sm" style={{ background: riskGradient }} />
              <span className="text-[9px] text-muted ml-1">0 → 100</span>
            </div>
          </>
        ) : (
          <>
            <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
              Communities ({clusterCount})
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(clusterCount, 6) }, (_, i) => (
                <span key={i} className="inline-block h-2 w-2 rounded-full" style={{ background: clusterColor(i) }} />
              ))}
              {clusterCount > 6 && <span className="text-[9px] text-muted">+{clusterCount - 6}</span>}
            </div>
          </>
        )}

        {Object.keys(fraudCounts).length > 0 && (
          <div className="mt-1.5 border-t border-card-border pt-1.5">
            <div className="mb-0.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
              Fraud Patterns
            </div>
            {Object.entries(fraudCounts).map(([pat, cnt]) => (
              <div key={pat} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: FRAUD_COLORS[pat] || "#888" }} />
                <span className="text-[9px] text-muted">{pat} ({cnt})</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 text-[10px] text-muted">
          Z = log-volume · Size = √volume · Glow = volume
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-[9px] text-muted">Path</span>
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[9px] text-muted">Suspicious</span>
        </div>
      </div>

      {/* Controls hint + FPS */}
      <div className="absolute bottom-3 right-3 rounded-lg border border-card-border bg-card/90 px-3 py-2 backdrop-blur-sm">
        <div className="text-[10px] text-muted leading-relaxed">
          <span className="font-medium text-foreground">Navigate:</span>{" "}
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">W</kbd>
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">A</kbd>
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">S</kbd>
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">D</kbd>
          {" "}move ·{" "}
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">Q</kbd>
          <kbd className="rounded border border-card-border bg-background px-1 py-0.5 text-[9px] font-mono">E</kbd>
          {" "}up/down
          <br />
          <span className="font-medium text-foreground">Mouse:</span>{" "}
          Left-drag rotate · Right-drag pan · Scroll zoom
          <br />
          <span className="text-[9px] opacity-60">
            <kbd className="rounded border border-card-border bg-background px-0.5 text-[8px] font-mono">Ctrl</kbd>+drag node to pin
            {" · "}
            <kbd className="rounded border border-card-border bg-background px-0.5 text-[8px] font-mono">Shift</kbd> faster · Space = up
          </span>
        </div>
        <div className="mt-1 border-t border-card-border pt-1 text-right">
          <span className="font-mono text-[9px] text-muted/60">{fps} fps</span>
        </div>
      </div>
    </div>
  );
}
