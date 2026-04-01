"use client";

import { useEffect, useRef } from "react";

const HEX = "0123456789abcdef";

const LOG_TEMPLATES = [
  "MATCH (w1:Wallet)-[t:TRANSFER]->(w2:Wallet) WHERE t.risk_score > 0.82",
  "CALL db.index.fulltext.queryNodes('wallet_idx', 'rapid relay')",
  "apoc.path.expandConfig burst traversal returned high-degree pattern",
  "suspicious relay pattern correlated across temporal window",
  "cluster threshold exceeded for bidirectional transaction fanout",
  "wallet risk escalation triggered by cycle contribution",
  "neo4j tx indexed by transfer_txid and timestamp",
  "forensic score recomputed for neighborhood depth=3",
  "JWT-authenticated watcher subscribed to anomaly feed",
];

const EVENT_TAGS = [
  "TRACE INITIATED",
  "RISK DETECTED",
  "CASCADE IMMINENT",
  "FORENSIC SNAPSHOT",
  "CLUSTER QUARANTINE",
  "CONTAINMENT ROUTINE",
];

const EVENT_GLYPHS = [
  "TRACE INITIATED",
  "RISK DETECTED",
  "TX FLOOD",
  "CASCADE",
  "WALLET MELTDOWN",
  "CHAIN SPIKE",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function colorRgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function formatWallet() {
  let text = "0x";
  for (let i = 0; i < 8; i += 1) text += HEX[Math.floor(Math.random() * HEX.length)];
  return text;
}

function spawnFromEdge(w, h) {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: rand(0, w), y: -24 };
  if (side === 1) return { x: w + 24, y: rand(0, h) };
  if (side === 2) return { x: rand(0, w), y: h + 24 };
  return { x: -24, y: rand(0, h) };
}

function makeNode(id, w, h, fromEdge) {
  const start = fromEdge ? spawnFromEdge(w, h) : { x: rand(40, w - 40), y: rand(40, h - 40) };
  const angle = rand(0, Math.PI * 2);
  const depth = rand(0.08, 0.96);

  return {
    id,
    x: start.x,
    y: start.y,
    z: depth,
    vx: Math.cos(angle) * rand(6, 18),
    vy: Math.sin(angle) * rand(6, 18),
    driftPhase: rand(0, Math.PI * 2),
    driftRate: rand(0.3, 0.8),
    radius: rand(2.1, 4.8),
    state: "idle",
    stateTime: 0,
    activePulse: 0,
    overload: 0,
    collapse: 0,
    connectionCount: 0,
    anomalyHeat: 0,
    hotspotHeat: 0,
    lifeSeed: rand(0, Math.PI * 2),
  };
}

function depthScale(z) {
  return 0.28 + z * 0.95;
}

function depthAlpha(z) {
  return 0.2 + z * 0.8;
}

function buildStarField(w, h, count) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: rand(0, w),
      y: rand(0, h),
      z: rand(0.05, 0.95),
      phase: rand(0, Math.PI * 2),
      seed: rand(0.4, 1.2),
    });
  }
  return stars;
}

function mutateText(base, intensity) {
  const chars = base.split("");
  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] === " " || chars[i] === ":" || chars[i] === "[" || chars[i] === "]") continue;
    if (Math.random() < intensity) {
      chars[i] = HEX[Math.floor(Math.random() * HEX.length)].toUpperCase();
    }
  }
  return chars.join("");
}

function wrap01(value) {
  if (value > 1) return value - 1;
  if (value < 0) return value + 1;
  return value;
}

function makeHotspot(id, w, h, active = true) {
  const angle = rand(0, Math.PI * 2);
  const baseRadius = rand(140, 250);
  return {
    id,
    x: rand(w * 0.15, w * 0.85),
    y: rand(h * 0.18, h * 0.82),
    vx: Math.cos(angle) * rand(5, 14),
    vy: Math.sin(angle) * rand(5, 14),
    z: rand(0.24, 0.9),
    baseRadius,
    radius: baseRadius,
    intensity: active ? rand(0.35, 0.62) : 0,
    targetIntensity: active ? rand(0.4, 0.7) : 0,
    active,
    retargetAt: 0,
    anomalyBoost: 0,
  };
}

export default function CyberNetworkCanvas({ className, variant = "ambient" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    const forensicMode = variant === "forensic";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hardwareThreads = navigator.hardwareConcurrency || 4;
    const viewportArea = window.innerWidth * window.innerHeight;
    const lowPowerMode =
      prefersReducedMotion ||
      coarsePointer ||
      hardwareThreads <= 4 ||
      viewportArea > 2600000;

    const perf = forensicMode
      ? {
          maxDpr: lowPowerMode ? 1 : 1.25,
          frameInterval: lowPowerMode ? 1 / 30 : 1 / 45,
          useNodeBlur: !lowPowerMode,
          starCount: lowPowerMode ? 92 : 132,
          maxEdges: lowPowerMode ? 260 : 420,
          maxFragments: lowPowerMode ? 460 : 760,
          maxGlyphs: lowPowerMode ? 12 : 20,
          maxNodeLinks: lowPowerMode ? 7 : 10,
          drawHud: !lowPowerMode || !coarsePointer,
        }
      : {
          maxDpr: 1.25,
          frameInterval: 1 / 45,
          useNodeBlur: false,
          starCount: 100,
          maxEdges: 220,
          maxFragments: 260,
          maxGlyphs: 8,
          maxNodeLinks: 7,
          drawHud: false,
        };

    const cfg = forensicMode
      ? {
          nodeCount: lowPowerMode ? 92 : 122,
          edgeNear: lowPowerMode ? 182 : 205,
          edgeFar: lowPowerMode ? 112 : 122,
          safeEdges: 4,
          overloadEdges: lowPowerMode ? 8 : 9,
          collapseDuration: 1.35,
          anomalyMinGap: 5.2,
          anomalyMaxGap: 9.8,
          anomalyDurationMin: 3.8,
          anomalyDurationMax: 6.2,
          logIntervalMin: 0.9,
          logIntervalMax: 2.1,
        }
      : {
          nodeCount: 96,
          edgeNear: 170,
          edgeFar: 108,
          safeEdges: 5,
          overloadEdges: 11,
          collapseDuration: 1.1,
          anomalyMinGap: 999,
          anomalyMaxGap: 999,
          anomalyDurationMin: 0,
          anomalyDurationMax: 0,
          logIntervalMin: 999,
          logIntervalMax: 999,
        };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, perf.maxDpr);
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const createGlowTexture = (r, g, b, coreAlpha, haloAlpha) => {
      const size = 64;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d", { alpha: true });
      const center = size / 2;
      const grad = octx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
      grad.addColorStop(0.12, `rgba(${r}, ${g}, ${b}, ${haloAlpha})`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${haloAlpha * 0.4})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      octx.fillStyle = grad;
      octx.fillRect(0, 0, size, size);
      return off;
    };

    const texRed = createGlowTexture(255, 30, 30, 1, 0.7);
    const texBright = createGlowTexture(255, 100, 100, 1, 0.9);

    const width = () => canvas.offsetWidth;
    const height = () => canvas.offsetHeight;

    let nextNodeId = 1;
    const nodes = [];
    const edges = new Map();
    const fragments = [];
    const hudLogs = [];
    const glyphNoise = [];
    let stars = buildStarField(width(), height(), perf.starCount);

    const hotspotCount = forensicMode ? (lowPowerMode ? 1 : Math.random() < 0.55 ? 2 : 1) : 1;
    const hotspots = [];
    for (let i = 0; i < hotspotCount; i += 1) {
      hotspots.push(makeHotspot(i, width(), height(), i === 0 || Math.random() < 0.75));
    }

    const parallax = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const anomaly = {
      active: false,
      stage: "idle",
      stageProgress: 0,
      nextStart: performance.now() * 0.001 + rand(cfg.anomalyMinGap, cfg.anomalyMaxGap),
      startAt: 0,
      endAt: 0,
      collapseAt: 0,
      centerNodeId: null,
      centerX: 0,
      centerY: 0,
      radius: 0,
      nodeIds: new Set(),
      secondaryIds: new Set(),
      collapseTriggered: false,
      primaryHotspotId: null,
    };

    let lastSpawn = performance.now() * 0.001;
    let lastLog = performance.now() * 0.001;
    let lastGlyph = performance.now() * 0.001;
    let lastCollapseLog = performance.now() * 0.001;
    let eventGlitch = 0;

    function nodeById(id) {
      for (let i = 0; i < nodes.length; i += 1) {
        if (nodes[i].id === id) return nodes[i];
      }
      return null;
    }

    function spawnNode(fromEdge) {
      const n = makeNode(nextNodeId, width(), height(), fromEdge);
      nextNodeId += 1;
      nodes.push(n);
      return n;
    }

    function spawnFragments(node, intensity = 1) {
      if (fragments.length >= perf.maxFragments) return;

      const baseCount = forensicMode ? 24 : 16;
      const available = perf.maxFragments - fragments.length;
      const count = Math.min(available, Math.floor(baseCount * intensity));
      for (let i = 0; i < count; i += 1) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(36, 180) * (0.8 + intensity * 0.4);
        fragments.push({
          x: node.x,
          y: node.y,
          z: node.z,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: rand(0.35, 1.05),
          size: rand(0.8, 2.3),
          kind: Math.random() < 0.65 ? "dust" : "pixel",
          red: Math.random() < 0.45 || intensity > 1.2,
        });
      }
    }

    function spawnEdgeFragments(x, y, z, intensity = 1) {
      if (fragments.length >= perf.maxFragments) return;

      const available = perf.maxFragments - fragments.length;
      const count = Math.min(available, Math.floor(rand(8, 16) * intensity));
      for (let i = 0; i < count; i += 1) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(28, 120) * (0.8 + intensity * 0.4);
        fragments.push({
          x,
          y,
          z,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          life: rand(0.24, 0.75),
          size: rand(0.7, 1.9),
          kind: Math.random() < 0.7 ? "pixel" : "dust",
          red: Math.random() < 0.55,
        });
      }
    }

    function resetNode(node) {
      const fresh = makeNode(node.id, width(), height(), true);
      node.x = fresh.x;
      node.y = fresh.y;
      node.z = fresh.z;
      node.vx = fresh.vx;
      node.vy = fresh.vy;
      node.driftPhase = fresh.driftPhase;
      node.driftRate = fresh.driftRate;
      node.radius = fresh.radius;
      node.state = "idle";
      node.stateTime = 0;
      node.activePulse = 0;
      node.overload = 0;
      node.collapse = 0;
      node.connectionCount = 0;
      node.anomalyHeat = 0;
      node.hotspotHeat = 0;
      node.lifeSeed = fresh.lifeSeed;
    }

    function logMessage(message, level = "INFO") {
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      const ss = String(t.getSeconds()).padStart(2, "0");
      hudLogs.push({
        text: `${hh}:${mm}:${ss} [${level}] ${message}`,
        age: 0,
        life: rand(2.4, 4.2),
      });
      if (hudLogs.length > 8) hudLogs.shift();
    }

    function emitGlyph(text, x, y, lifeMin = 0.55, lifeMax = 1.5, urgent = false) {
      glyphNoise.push({
        x,
        y,
        text,
        age: 0,
        life: rand(lifeMin, lifeMax),
        urgent,
      });
      if (glyphNoise.length > perf.maxGlyphs) glyphNoise.shift();
    }

    function collapseNode(node, reason, now) {
      if (node.state === "collapse") return false;

      node.state = "collapse";
      node.stateTime = 0;
      node.collapse = 0;
      node.overload = Math.max(node.overload, 1.02);
      node.activePulse = 0;

      const burst = reason === "cascade" ? 1.45 : reason === "overload" ? 1.05 : 1;
      spawnFragments(node, burst);

      if (forensicMode && now - lastCollapseLog > 0.7) {
        const level = reason === "cascade" ? "ALERT" : "WARN";
        const msg =
          reason === "cascade"
            ? `cascade disintegration for wallet ${formatWallet()}`
            : `wallet collapse ${formatWallet()} due to load spike`;
        logMessage(msg, level);
        lastCollapseLog = now;
      }

      return true;
    }

    function nearestNodeTo(x, y, candidates) {
      let winner = null;
      let best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < candidates.length; i += 1) {
        const n = candidates[i];
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < best) {
          best = d;
          winner = n;
        }
      }
      return winner;
    }

    function buildCluster(centerNode, candidates, minSize, maxSize) {
      if (!centerNode) return [];
      const ranked = [...candidates].sort((a, b) => {
        const da = (a.x - centerNode.x) ** 2 + (a.y - centerNode.y) ** 2;
        const db = (b.x - centerNode.x) ** 2 + (b.y - centerNode.y) ** 2;
        return da - db;
      });
      const size = Math.min(ranked.length, Math.floor(rand(minSize, maxSize)));
      return ranked.slice(0, size);
    }

    function maybeStartAnomaly(now) {
      if (!forensicMode) return;
      if (anomaly.active || now < anomaly.nextStart) return;

      const candidates = nodes.filter((n) => n.state !== "collapse");
      if (!candidates.length) return;

      const activeHotspots = hotspots.filter((h) => h.active || h.intensity > 0.2);
      const primaryHotspot =
        activeHotspots.length > 0
          ? activeHotspots.reduce((best, current) =>
              current.intensity + current.anomalyBoost > best.intensity + best.anomalyBoost ? current : best
            )
          : hotspots[0];

      const centerNode = nearestNodeTo(primaryHotspot.x, primaryHotspot.y, candidates);
      if (!centerNode) return;

      const primaryCluster = buildCluster(centerNode, candidates, 12, 22);
      const secondarySet = new Set();

      if (activeHotspots.length > 1 && Math.random() < 0.55) {
        const secondaryHotspot = pick(activeHotspots.filter((h) => h.id !== primaryHotspot.id));
        if (secondaryHotspot) {
          const secondaryCenter = nearestNodeTo(secondaryHotspot.x, secondaryHotspot.y, candidates);
          const secondaryCluster = buildCluster(secondaryCenter, candidates, 6, 12);
          for (let i = 0; i < secondaryCluster.length; i += 1) {
            secondarySet.add(secondaryCluster[i].id);
          }
        }
      }

      anomaly.active = true;
      anomaly.stage = "ramp";
      anomaly.stageProgress = 0;
      anomaly.startAt = now;
      anomaly.endAt = now + rand(cfg.anomalyDurationMin, cfg.anomalyDurationMax);
      anomaly.collapseAt = now + (anomaly.endAt - now) * rand(0.56, 0.73);
      anomaly.centerNodeId = centerNode.id;
      anomaly.centerX = centerNode.x;
      anomaly.centerY = centerNode.y;
      anomaly.radius = primaryHotspot.baseRadius * rand(0.84, 1.14);
      anomaly.nodeIds = new Set(primaryCluster.map((n) => n.id));
      anomaly.secondaryIds = secondarySet;
      anomaly.collapseTriggered = false;
      anomaly.primaryHotspotId = primaryHotspot.id;

      const flaggedCount = anomaly.nodeIds.size + anomaly.secondaryIds.size;
      logMessage(`TRACE INITIATED around ${formatWallet()}`, "ALERT");
      logMessage(`RISK DETECTED in ${flaggedCount} wallet cluster`, "WARN");

      emitGlyph("TRACE INITIATED", anomaly.centerX + rand(-80, 80), anomaly.centerY - rand(35, 110), 0.8, 1.6, true);
      eventGlitch = Math.max(eventGlitch, 0.42);
    }

    function triggerCollapseCascade(now) {
      if (!anomaly.active || anomaly.collapseTriggered) return;

      anomaly.collapseTriggered = true;
      anomaly.stage = "collapse";
      const impacted = new Set([...anomaly.nodeIds, ...anomaly.secondaryIds]);

      let collapsedCount = 0;
      for (const id of impacted.values()) {
        const n = nodeById(id);
        if (!n) continue;
        const chance = 0.34 + n.hotspotHeat * 0.34 + n.anomalyHeat * 0.22;
        if (Math.random() < chance && collapseNode(n, "cascade", now)) {
          collapsedCount += 1;
        }
      }

      for (const [key, edge] of edges.entries()) {
        if (!impacted.has(edge.a) && !impacted.has(edge.b)) continue;
        const a = nodeById(edge.a);
        const b = nodeById(edge.b);
        if (a && b) {
          spawnEdgeFragments((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, (a.z + b.z) * 0.5, 1.25);
        }
        edges.delete(key);
      }

      logMessage(`cascade collapse impacted ${collapsedCount} wallets`, "ALERT");
      emitGlyph(pick(EVENT_GLYPHS), anomaly.centerX + rand(-120, 120), anomaly.centerY + rand(-80, 80), 0.7, 1.5, true);
      eventGlitch = Math.max(eventGlitch, 0.95);
    }

    function maybeEndAnomaly(now) {
      if (!anomaly.active) return;
      if (now < anomaly.endAt) return;

      anomaly.active = false;
      anomaly.stage = "idle";
      anomaly.stageProgress = 0;
      anomaly.startAt = 0;
      anomaly.centerNodeId = null;
      anomaly.nodeIds.clear();
      anomaly.secondaryIds.clear();
      anomaly.primaryHotspotId = null;
      anomaly.nextStart = now + rand(cfg.anomalyMinGap, cfg.anomalyMaxGap);

      logMessage("cluster instability normalized", "INFO");
      emitGlyph("TRACE SEALED", rand(width() * 0.62, width() - 80), rand(44, 130), 0.5, 1.1, false);
    }

    function updateHotspots(dt, now, w, h) {
      for (let i = 0; i < hotspots.length; i += 1) {
        const hs = hotspots[i];

        if (now > hs.retargetAt) {
          if (forensicMode && i > 0 && !anomaly.active && Math.random() < 0.16) {
            hs.active = !hs.active;
          }
          hs.targetIntensity = hs.active ? rand(0.3, 0.7) : 0;
          hs.retargetAt = now + rand(2.5, 6.8);
        }

        if (anomaly.active && hs.id === anomaly.primaryHotspotId) {
          hs.targetIntensity = 1;
          hs.anomalyBoost = clamp(hs.anomalyBoost + dt * 1.8, 0, 1);
        } else {
          hs.anomalyBoost = clamp(hs.anomalyBoost - dt * 0.9, 0, 1);
        }

        hs.intensity = lerp(hs.intensity, hs.targetIntensity, clamp(dt * 1.25, 0, 1));
        hs.radius = lerp(
          hs.radius,
          hs.baseRadius * (1 + hs.anomalyBoost * 0.48),
          clamp(dt * 1.3, 0, 1)
        );

        if (Math.random() < dt * 0.18) {
          hs.vx = clamp(hs.vx + rand(-6, 6), -18, 18);
          hs.vy = clamp(hs.vy + rand(-6, 6), -18, 18);
        }

        const speedMul = 0.2 + hs.intensity * 0.9 + hs.anomalyBoost * 0.8;
        hs.x += hs.vx * dt * speedMul;
        hs.y += hs.vy * dt * speedMul;

        if (hs.x < 70 || hs.x > w - 70) hs.vx *= -1;
        if (hs.y < 70 || hs.y > h - 70) hs.vy *= -1;

        hs.x = clamp(hs.x, 50, w - 50);
        hs.y = clamp(hs.y, 50, h - 50);
      }
    }

    function maybeEmitContextualLogs(now) {
      if (!forensicMode) return;

      const minGap = anomaly.active ? cfg.logIntervalMin * 0.45 : cfg.logIntervalMin;
      const maxGap = anomaly.active ? cfg.logIntervalMax * 0.65 : cfg.logIntervalMax;
      if (now - lastLog <= rand(minGap, maxGap)) return;

      if (anomaly.active) {
        const stageTag = anomaly.stage === "collapse" ? "ALERT" : "WARN";
        logMessage(`${pick(EVENT_TAGS)} | ${pick(LOG_TEMPLATES)}`, stageTag);
      } else {
        logMessage(pick(LOG_TEMPLATES), "INFO");
      }

      lastLog = now;
    }

    function maybeEmitGlyphNoise(now) {
      if (!forensicMode) return;

      const interval = anomaly.active
        ? lowPowerMode
          ? 0.24
          : 0.16
        : lowPowerMode
          ? 0.52
          : 0.34;
      if (now - lastGlyph <= interval) return;

      if (anomaly.active) {
        const angle = rand(0, Math.PI * 2);
        const jitter = anomaly.radius * rand(0.15, 0.85);
        emitGlyph(
          pick(EVENT_GLYPHS),
          anomaly.centerX + Math.cos(angle) * jitter,
          anomaly.centerY + Math.sin(angle) * jitter,
          0.45,
          1.1,
          true
        );
      } else {
        emitGlyph(`${formatWallet()} ${Math.floor(rand(12, 99))}%`, width() - rand(260, 48), rand(40, 220), 0.55, 1.25);
      }

      lastGlyph = now;
    }

    for (let i = 0; i < cfg.nodeCount; i += 1) spawnNode(false);

    let previousTime = performance.now() * 0.001;
    let frameAccumulator = 0;

    function parallaxOffset(z) {
      return {
        x: parallax.x * lerp(4, 24, z),
        y: parallax.y * lerp(3, 18, z),
      };
    }

    function nodeDrawPos(node) {
      const offset = parallaxOffset(node.z);
      return { x: node.x + offset.x, y: node.y + offset.y };
    }

    function drawBackground(w, h, now) {
      const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
      gradient.addColorStop(0, "rgba(24, 6, 6, 0.5)");
      gradient.addColorStop(0.5, "rgba(10, 2, 2, 0.6)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        const offset = parallaxOffset(star.z * 0.68);

        let sx = star.x + offset.x * 0.72;
        let sy = star.y + offset.y * 0.72;

        if (sx < -2) sx += w + 4;
        if (sx > w + 2) sx -= w + 4;
        if (sy < -2) sy += h + 4;
        if (sy > h + 2) sy -= h + 4;

        const alpha =
          (0.07 + 0.25 * star.z) *
          (0.72 + Math.sin(now * star.seed + star.phase) * 0.28) *
          (1 + eventGlitch * 0.22);
        const size = 0.45 + star.z * 1.15;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        // More reddish-white stars instead of blueish
        ctx.fillStyle = `rgba(255, 200, 200, ${alpha})`;
        ctx.fill();
      }

      if (forensicMode && eventGlitch > 0.08) {
        ctx.globalCompositeOperation = "lighter";
        const bars = Math.floor((lowPowerMode ? 1 : 2) + eventGlitch * (lowPowerMode ? 4 : 8));
        for (let i = 0; i < bars; i += 1) {
          const y = rand(0, h);
          const heightBand = rand(1, 2.6);
          const xJitter = rand(-18, 18) * eventGlitch;
          ctx.fillStyle = `rgba(255, 40, 40, ${rand(0.02, 0.08) * eventGlitch})`;
          ctx.fillRect(xJitter, y, w + Math.abs(xJitter), heightBand);
        }
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function drawHotspotOverlay() {
      if (!forensicMode) return;

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < hotspots.length; i += 1) {
        const hs = hotspots[i];
        if (hs.intensity < 0.08 && hs.anomalyBoost < 0.08) continue;

        const offset = parallaxOffset(hs.z);
        const x = hs.x + offset.x;
        const y = hs.y + offset.y;

        const danger = anomaly.active && hs.id === anomaly.primaryHotspotId;
        const radius = hs.radius * (0.5 + hs.intensity * 0.95);
        const alpha = 0.02 + hs.intensity * 0.08 + hs.anomalyBoost * 0.1;

        const grad = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
        if (danger) {
          grad.addColorStop(0, `rgba(255, 40, 40, ${alpha * 1.5})`);
          grad.addColorStop(1, "rgba(255, 40, 40, 0)");
        } else {
          grad.addColorStop(0, `rgba(255, 60, 60, ${alpha * 0.9})`);
          grad.addColorStop(1, "rgba(255, 60, 60, 0)");
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawEdges(now) {
      const neutral = [255, 60, 60];
      const danger = [255, 120, 120];
      
      ctx.globalCompositeOperation = "lighter";

      for (const edge of edges.values()) {
        const a = nodeById(edge.a);
        const b = nodeById(edge.b);
        if (!a || !b) continue;

        const aPos = nodeDrawPos(a);
        const bPos = nodeDrawPos(b);

        const zMid = (a.z + b.z) * 0.5;
        const baseAlpha = edge.strength * (0.08 + 0.35 * depthAlpha(zMid));
        const riskIntensity = clamp(Math.max(a.overload, b.overload, a.anomalyHeat, b.anomalyHeat), 0, 1);
        const c = [
          Math.round(lerp(neutral[0], danger[0], riskIntensity)),
          Math.round(lerp(neutral[1], danger[1], riskIntensity)),
          Math.round(lerp(neutral[2], danger[2], riskIntensity)),
        ];

        ctx.beginPath();
        ctx.moveTo(aPos.x, aPos.y);
        ctx.lineTo(bPos.x, bPos.y);
        ctx.strokeStyle = colorRgba(c, baseAlpha);
        ctx.lineWidth = (0.5 + zMid * 1.5) * (0.7 + edge.strength * 0.7);
        ctx.stroke();

        const speedNorm = clamp((edge.speed - 0.2) / 2.3, 0, 1);
        const pulseEnergy = clamp(
          0.3 + edge.pulseGain * 0.4 + speedNorm * 0.5 + (edge.unstable ? 0.35 : 0),
          0.2,
          1.5
        );

        const t = edge.pulse;
        const px = aPos.x + (bPos.x - aPos.x) * t;
        const py = aPos.y + (bPos.y - aPos.y) * t;
        const pulseRadius = (1.0 + zMid * 2.0) * (edge.unstable ? 1.3 : 1);

        ctx.beginPath();
        ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = edge.unstable
          ? `rgba(255, 150, 150, ${0.6 + pulseEnergy * 0.4})`
          : `rgba(255, 200, 200, ${0.4 + pulseEnergy * 0.4})`;
        ctx.fill();

        if (edge.bidirectional) {
          const t2 = edge.secondaryPulse;
          const px2 = aPos.x + (bPos.x - aPos.x) * t2;
          const py2 = aPos.y + (bPos.y - aPos.y) * t2;
          ctx.beginPath();
          ctx.arc(px2, py2, pulseRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = edge.unstable
            ? `rgba(255, 200, 200, ${0.5 + pulseEnergy * 0.3})`
            : `rgba(255, 100, 100, ${0.3 + pulseEnergy * 0.3})`;
          ctx.fill();
        }

        if (edge.unstable && eventGlitch > 0.35 && Math.random() < 0.12) {
          const gy = lerp(aPos.y, bPos.y, rand(0, 1));
          const gw = rand(16, 58);
          ctx.fillStyle = `rgba(255, 120, 120, ${0.2 + eventGlitch * 0.2})`;
          ctx.fillRect(lerp(aPos.x, bPos.x, rand(0, 1)) - gw * 0.5, gy, gw, rand(0.9, 2));
        }
      }
      
      ctx.globalCompositeOperation = "source-over";
    }

    function drawFragments(dt) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = fragments.length - 1; i >= 0; i -= 1) {
        const f = fragments[i];
        f.age += dt;
        if (f.age >= f.life) {
          fragments.splice(i, 1);
          continue;
        }

        const p = f.age / f.life;
        const alpha = (1 - p) * depthAlpha(f.z);
        f.x += f.vx * dt * (0.3 + f.z * 0.9);
        f.y += f.vy * dt * (0.3 + f.z * 0.9);
        f.vx *= 0.94;
        f.vy *= 0.94;

        const offset = parallaxOffset(f.z);
        const dx = f.x + offset.x;
        const dy = f.y + offset.y;

        if (f.kind === "pixel") {
          ctx.fillStyle = f.red ? `rgba(255, 50, 50, ${alpha * 1.2})` : `rgba(255, 180, 180, ${alpha * 0.8})`;
          ctx.fillRect(dx, dy, f.size * (1 - p * 0.4), f.size * (1 - p * 0.4));
        } else {
          ctx.beginPath();
          ctx.arc(dx, dy, f.size * (1 - p * 0.25), 0, Math.PI * 2);
          ctx.fillStyle = f.red ? `rgba(255, 40, 40, ${alpha})` : `rgba(255, 150, 150, ${alpha * 0.6})`;
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawNodes(now) {
      nodes.sort((a, b) => a.z - b.z);
      
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        const dScale = depthScale(n.z);
        const dAlpha = depthAlpha(n.z);
        const pulse = 1 + Math.sin(now * 2.1 + n.lifeSeed) * 0.1;
        const baseRadius = n.radius * dScale;

        const pos = nodeDrawPos(n);
        let drawX = pos.x;
        let drawY = pos.y;

        if (anomaly.active && n.anomalyHeat > 0.4) {
          const jitter = (0.6 + n.anomalyHeat * 2.2) * (Math.sin(now * 30 + n.lifeSeed) * 0.5);
          drawX += jitter;
          drawY += jitter * 0.4;
        }

        const flicker =
          n.state === "overloaded"
            ? 0.65 + Math.abs(Math.sin(now * 35 + n.lifeSeed)) * (0.45 + eventGlitch * 0.12)
            : 1;
        const alpha =
          dAlpha *
          (0.38 + n.activePulse * 0.42 + n.hotspotHeat * 0.12) *
          flicker *
          (n.state === "collapse" ? clamp(1 - n.collapse / cfg.collapseDuration, 0.25, 1) : 1);

        ctx.globalAlpha = clamp(alpha * 1.5, 0, 1);

        const tex = (n.state === "overloaded" || n.state === "collapse") ? texBright : texRed;
        const glowBoost = (n.state === "overloaded" ? 1.4 : 1) * (1 + n.activePulse * 0.5) * pulse;
        const drawSize = baseRadius * 16 * glowBoost * (n.z < 0.3 ? 1.4 : 1);

        ctx.drawImage(tex, drawX - drawSize * 0.5, drawY - drawSize * 0.5, drawSize, drawSize);

        if (n.state === "collapse" && n.collapse < 0.45) {
          ctx.globalAlpha = 1;
          for (let g = 0; g < 2; g += 1) {
            const gy = drawY + rand(-baseRadius * 2.5, baseRadius * 2.5);
            const gw = rand(18, 48) * dScale;
            ctx.fillStyle = `rgba(255, 150, 150, ${(0.3 + eventGlitch * 0.1) * (1 - n.collapse / 0.45)})`;
            ctx.fillRect(drawX - gw * 0.5, gy, gw, 1 + Math.random() * 1.5);
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function drawAnomalyOverlay(now) {
      if (!forensicMode || !anomaly.active) return;

      const centerNode = nodeById(anomaly.centerNodeId);
      if (centerNode) {
        anomaly.centerX = centerNode.x;
        anomaly.centerY = centerNode.y;
      }

      const centerOffset = parallaxOffset(0.78);
      const cx = anomaly.centerX + centerOffset.x;
      const cy = anomaly.centerY + centerOffset.y;

      const phase = Math.sin(now * 7.4) * 0.5 + 0.5;
      const radius = anomaly.radius * (0.9 + phase * 0.12);

      const ringCount = anomaly.stage === "collapse" ? 2 : 1;
      for (let r = 0; r < ringCount; r += 1) {
        const rr = radius * (1 + r * 0.18);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 70, 70, ${0.06 + phase * 0.08 + eventGlitch * 0.08})`;
        ctx.lineWidth = 1.4 + r * 0.6;
        ctx.stroke();
      }

      for (let i = 0; i < 14; i += 1) {
        const a = rand(0, Math.PI * 2);
        const rr = radius * rand(0.45, 1.2);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        const w = rand(16, 52);
        ctx.fillStyle = `rgba(255, 90, 90, ${rand(0.04, 0.11) * (1 + eventGlitch * 0.25)})`;
        ctx.fillRect(x - w * 0.5, y, w, rand(0.8, 2.1));
      }

      if (anomaly.stage === "collapse") {
        for (let i = 0; i < 6; i += 1) {
          const w = rand(24, 88);
          const x = cx + rand(-radius, radius);
          const y = cy + rand(-radius * 0.65, radius * 0.65);
          ctx.fillStyle = `rgba(255, 96, 96, ${0.08 + eventGlitch * 0.12})`;
          ctx.fillRect(x - w * 0.5, y, w, rand(1, 2.4));
        }
      }
    }

    function drawHud(w, h, dt) {
      if (!forensicMode || !perf.drawHud) return;

      ctx.font = "11px monospace";
      ctx.textBaseline = "top";

      for (let i = hudLogs.length - 1; i >= 0; i -= 1) {
        const line = hudLogs[i];
        line.age += dt;
        if (line.age > line.life) {
          hudLogs.splice(i, 1);
        }
      }

      for (let i = glyphNoise.length - 1; i >= 0; i -= 1) {
        const g = glyphNoise[i];
        g.age += dt;
        if (g.age > g.life) {
          glyphNoise.splice(i, 1);
        }
      }

      const panelX = 24;
      const panelW = Math.max(300, Math.min(500, w - panelX * 2));
      const panelH = 98;
      const panelY = h - panelH - 24;

      ctx.fillStyle = "rgba(4, 8, 13, 0.28)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = `rgba(170, 185, 196, ${0.12 + eventGlitch * 0.1})`;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      const title = anomaly.active
        ? `LIVE FORENSIC FEED | ${anomaly.stage.toUpperCase()} EVENT`
        : "LIVE FORENSIC FEED";
      ctx.fillStyle = "rgba(255, 98, 98, 0.58)";
      ctx.fillText(title, panelX + 10, panelY + 8);

      const visibleLogs = hudLogs.slice(-4);
      for (let i = 0; i < visibleLogs.length; i += 1) {
        const line = visibleLogs[i];
        const fade = clamp(1 - line.age / line.life, 0, 1);
        const scramble = line.age < 0.45 ? 0.24 * (1 - line.age / 0.45) + eventGlitch * 0.14 : eventGlitch * 0.06;
        const text = scramble > 0 ? mutateText(line.text, scramble) : line.text;
        ctx.fillStyle = `rgba(214, 223, 233, ${0.22 + fade * 0.42})`;
        ctx.fillText(text, panelX + 10, panelY + 28 + i * 16);
      }

      const activeHotspots = hotspots.filter((hs) => hs.intensity > 0.22).length;
      ctx.fillStyle = "rgba(160, 176, 188, 0.36)";
      ctx.fillText(
        `WALLETS ${nodes.length} | TX CHANNELS ${edges.size} | HOTSPOTS ${activeHotspots}`,
        panelX + 10,
        panelY + panelH - 16
      );

      for (let i = 0; i < glyphNoise.length; i += 1) {
        const g = glyphNoise[i];
        const fade = clamp(1 - g.age / g.life, 0, 1);
        const text = g.age < g.life * 0.45 ? mutateText(g.text, 0.4 + eventGlitch * 0.2) : g.text;
        ctx.fillStyle = g.urgent
          ? `rgba(255, 118, 118, ${0.15 + fade * 0.35})`
          : `rgba(226, 232, 238, ${0.11 + fade * 0.2})`;
        ctx.fillText(text, g.x, g.y);
      }
    }

    function step(now) {
      if (document.hidden) {
        previousTime = now;
        rafRef.current = requestAnimationFrame(() => step(performance.now() * 0.001));
        return;
      }

      const rawDt = Math.min(now - previousTime, 0.1);
      previousTime = now;
      frameAccumulator += rawDt;

      if (frameAccumulator < perf.frameInterval) {
        rafRef.current = requestAnimationFrame(() => step(performance.now() * 0.001));
        return;
      }

      const dt = Math.min(frameAccumulator, 0.05);
      frameAccumulator = 0;

      const w = width();
      const h = height();

      parallax.x = lerp(parallax.x, parallax.targetX, clamp(dt * 2.3, 0, 1));
      parallax.y = lerp(parallax.y, parallax.targetY, clamp(dt * 2.3, 0, 1));

      updateHotspots(dt, now, w, h);
      maybeStartAnomaly(now);

      if (anomaly.active) {
        const duration = Math.max(anomaly.endAt - anomaly.startAt, 0.001);
        const elapsed = now - anomaly.startAt;
        const timeline = clamp(elapsed / duration, 0, 1);
        anomaly.stageProgress = timeline;

        if (timeline < 0.42) anomaly.stage = "ramp";
        else if (timeline < 0.72) anomaly.stage = "surge";
        else anomaly.stage = "collapse";

        if (now >= anomaly.collapseAt && !anomaly.collapseTriggered) {
          triggerCollapseCascade(now);
        }
      }

      maybeEndAnomaly(now);

      let targetGlitch = 0.03;
      if (anomaly.active) {
        if (anomaly.stage === "ramp") targetGlitch = 0.34;
        else if (anomaly.stage === "surge") targetGlitch = 0.58;
        else targetGlitch = 0.84;
      }
      eventGlitch = lerp(eventGlitch, targetGlitch, clamp(dt * 2.8, 0, 1));

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];

        n.connectionCount = 0;
        n.stateTime += dt;

        if (n.state === "collapse") {
          n.collapse += dt;
          if (n.collapse >= cfg.collapseDuration) {
            resetNode(n);
          }
          continue;
        }

        const depth = depthScale(n.z);
        const driftX = Math.sin(now * n.driftRate + n.driftPhase) * 12;
        const driftY = Math.cos(now * n.driftRate * 0.82 + n.driftPhase * 1.2) * 12;

        n.vx += driftX * dt * 0.18;
        n.vy += driftY * dt * 0.18;

        n.hotspotHeat = clamp(n.hotspotHeat - dt * 0.8, 0, 1);
        for (let hIndex = 0; hIndex < hotspots.length; hIndex += 1) {
          const hs = hotspots[hIndex];
          if (hs.intensity < 0.08 && hs.anomalyBoost < 0.08) continue;

          const dxh = hs.x - n.x;
          const dyh = hs.y - n.y;
          const dist = Math.sqrt(dxh * dxh + dyh * dyh) || 1;
          if (dist > hs.radius * 1.2) continue;

          const influence = clamp(1 - dist / hs.radius, 0, 1) * hs.intensity;
          if (influence <= 0) continue;

          n.hotspotHeat = Math.max(n.hotspotHeat, clamp(influence + hs.anomalyBoost * 0.25, 0, 1));

          const swirl = (18 + influence * 54) * (1 + hs.anomalyBoost * 0.75);
          n.vx += (-dyh / dist) * swirl * dt;
          n.vy += (dxh / dist) * swirl * dt;

          const pull = (4 + influence * 22) * (1 + hs.anomalyBoost * 0.5);
          n.vx += (dxh / dist) * pull * dt;
          n.vy += (dyh / dist) * pull * dt;
        }

        if (anomaly.active) {
          const inPrimary = anomaly.nodeIds.has(n.id);
          const inSecondary = anomaly.secondaryIds.has(n.id);

          const dx = n.x - anomaly.centerX;
          const dy = n.y - anomaly.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const influence = clamp(1 - dist / (anomaly.radius * 1.35), 0, 1);
          const boost = inPrimary ? 1 : inSecondary ? 0.72 : influence * 0.45;

          if (boost > 0) {
            const tangential = 24 * boost;
            n.vx += (-dy / dist) * tangential * dt;
            n.vy += (dx / dist) * tangential * dt;
            n.vx += rand(-16, 16) * boost * dt;
            n.vy += rand(-16, 16) * boost * dt;
          }

          n.anomalyHeat = clamp(
            n.anomalyHeat + (inPrimary ? dt * 1.8 : inSecondary ? dt * 1.2 : influence * dt * 0.7),
            0,
            1
          );
        } else {
          n.anomalyHeat = clamp(n.anomalyHeat - dt * 1.2, 0, 1);
        }

        const repelX = n.x - mouseRef.current.x;
        const repelY = n.y - mouseRef.current.y;
        const md = Math.sqrt(repelX * repelX + repelY * repelY);
        if (md > 0 && md < 130) {
          const f = ((130 - md) / 130) * 36 * n.z;
          n.vx += (repelX / md) * f * dt;
          n.vy += (repelY / md) * f * dt;
        }

        const damping = clamp(0.988 - n.hotspotHeat * 0.004 - n.anomalyHeat * 0.003, 0.975, 0.991);
        n.vx *= damping;
        n.vy *= damping;

        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        const maxSpeed = lerp(16, 60, n.z) * (1 + n.hotspotHeat * 0.52 + n.anomalyHeat * 0.66);
        if (speed > maxSpeed && speed > 0) {
          n.vx = (n.vx / speed) * maxSpeed;
          n.vy = (n.vy / speed) * maxSpeed;
        }

        n.x += n.vx * dt * depth;
        n.y += n.vy * dt * depth;

        if (n.x < -48) n.x = w + 32;
        if (n.x > w + 48) n.x = -32;
        if (n.y < -48) n.y = h + 32;
        if (n.y > h + 48) n.y = -32;

        n.activePulse = clamp(n.activePulse - dt * (0.95 - n.hotspotHeat * 0.2), 0, 1);
      }

      const touchedEdges = new Set();

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        if (a.state === "collapse") continue;

        if (a.connectionCount >= perf.maxNodeLinks) continue;

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          if (b.state === "collapse") continue;

          if (b.connectionCount >= perf.maxNodeLinks) continue;

          const dz = Math.abs(a.z - b.z);
          if (dz > 0.45) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const zMid = (a.z + b.z) * 0.5;
          const hotspotPair = Math.max(a.hotspotHeat, b.hotspotHeat);
          const inCluster =
            anomaly.active &&
            (anomaly.nodeIds.has(a.id) || anomaly.nodeIds.has(b.id) || anomaly.secondaryIds.has(a.id) || anomaly.secondaryIds.has(b.id));

          let threshold = lerp(cfg.edgeFar, cfg.edgeNear, zMid) * (1 + hotspotPair * 0.34);
          if (inCluster) threshold *= 1.22;

          if (dist > threshold) continue;

          const skipChance = inCluster ? 0.01 : lerp(0.28, 0.03, hotspotPair);
          if (Math.random() < skipChance) continue;

          const key = edgeKey(a.id, b.id);
          let edge = edges.get(key);

          if (!edge) {
            if (edges.size >= perf.maxEdges) continue;

            const speedBase =
              rand(0.22, 0.72) *
              (1 + hotspotPair * 0.65) *
              (inCluster ? rand(1.25, 2.1) : 1);

            edge = {
              a: a.id,
              b: b.id,
              strength: 0,
              pulse: Math.random(),
              speed: speedBase,
              unstable: inCluster,
              seenAt: now,
              direction: Math.random() < 0.5 ? 1 : -1,
              bidirectional: Math.random() < (inCluster ? 0.44 : 0.12 + hotspotPair * 0.25),
              secondaryPulse: Math.random(),
              secondarySpeed: speedBase * rand(0.75, 1.25),
              pulseGain: rand(0.72, 1.3),
            };
            edges.set(key, edge);
          }

          edge.seenAt = now;
          edge.unstable = inCluster;

          const targetSpeed =
            (inCluster ? rand(1.0, 2.3) : rand(0.22, 0.9)) *
            (1 + hotspotPair * 0.5) *
            (anomaly.stage === "collapse" ? 1.12 : 1);
          edge.speed = lerp(edge.speed, targetSpeed, 0.14);
          edge.secondarySpeed = lerp(edge.secondarySpeed, targetSpeed * rand(0.7, 1.3), 0.1);
          edge.pulseGain = lerp(edge.pulseGain, 0.8 + edge.speed * 0.32, 0.1);

          if (!inCluster && !edge.bidirectional && Math.random() < 0.0008 * (1 + hotspotPair * 4)) {
            edge.bidirectional = true;
          }
          if (!inCluster && edge.bidirectional && Math.random() < 0.0025) {
            edge.bidirectional = false;
          }

          touchedEdges.add(key);
          a.connectionCount += 1;
          b.connectionCount += 1;
          a.activePulse = clamp(a.activePulse + 0.18 + hotspotPair * 0.22, 0, 1);
          b.activePulse = clamp(b.activePulse + 0.18 + hotspotPair * 0.22, 0, 1);

          edge.strength = clamp(edge.strength + dt * (inCluster ? 3.8 : 2 + hotspotPair * 1.35), 0, 1);
        }
      }

      for (const [key, edge] of edges.entries()) {
        const stale = now - edge.seenAt;
        const decay = edge.unstable ? 2.95 : 1.55;

        if (!touchedEdges.has(key)) edge.strength = clamp(edge.strength - dt * decay, 0, 1);

        edge.pulse = wrap01(edge.pulse + dt * edge.speed * edge.direction);
        edge.secondaryPulse = wrap01(edge.secondaryPulse + dt * edge.secondarySpeed * -edge.direction);

        if (Math.random() < dt * (edge.unstable ? 0.35 : 0.1)) {
          edge.direction *= -1;
        }

        const a = nodeById(edge.a);
        const b = nodeById(edge.b);
        if (!a || !b || a.state === "collapse" || b.state === "collapse") {
          edges.delete(key);
          continue;
        }

        if (edge.strength < 0.03 || stale > 2.2) edges.delete(key);
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (n.state === "collapse") continue;

        let load = clamp(
          (n.connectionCount - cfg.safeEdges) / (cfg.overloadEdges - cfg.safeEdges),
          0,
          1.2
        );

        load += n.hotspotHeat * 0.35;
        if (anomaly.active && (anomaly.nodeIds.has(n.id) || anomaly.secondaryIds.has(n.id))) {
          load += 0.35;
        }

        if (load > n.overload) n.overload = clamp(n.overload + dt * (1.55 + load * 1.25), 0, 1.3);
        else n.overload = clamp(n.overload - dt * 1.2, 0, 1.3);

        if (n.anomalyHeat > 0.6) n.overload = clamp(n.overload + dt * 0.33, 0, 1.3);

        if (n.overload > 1.03) {
          collapseNode(n, anomaly.active ? "cascade" : "overload", now);
          continue;
        }

        if (n.overload > 0.6) n.state = "overloaded";
        else if (n.activePulse > 0.11 || n.connectionCount > 0) n.state = "active";
        else n.state = "idle";
      }

      maybeEmitContextualLogs(now);
      maybeEmitGlyphNoise(now);

      if (nodes.length < cfg.nodeCount && now - lastSpawn > 0.18) {
        spawnNode(true);
        lastSpawn = now;
      }

      drawBackground(w, h, now);
      drawHotspotOverlay();
      drawEdges(now);
      drawAnomalyOverlay(now);
      drawFragments(dt);
      drawNodes(now);
      drawHud(w, h, dt);

      rafRef.current = requestAnimationFrame(() => step(performance.now() * 0.001));
    }

    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouseRef.current.x = x;
      mouseRef.current.y = y;

      parallax.targetX = clamp((x / rect.width - 0.5) * 2, -1, 1);
      parallax.targetY = clamp((y / rect.height - 0.5) * 2, -1, 1);
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      parallax.targetX = 0;
      parallax.targetY = 0;
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      stars = buildStarField(width(), height(), perf.starCount);
      for (let i = 0; i < hotspots.length; i += 1) {
        hotspots[i].x = clamp(hotspots[i].x, 50, width() - 50);
        hotspots[i].y = clamp(hotspots[i].y, 50, height() - 50);
      }
    });
    resizeObserver.observe(canvas);

    rafRef.current = requestAnimationFrame(() => step(performance.now() * 0.001));

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      resizeObserver.disconnect();
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
