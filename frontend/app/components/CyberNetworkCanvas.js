"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
// CyberNetworkCanvas — 3D depth network background
//
// Nodes exist at different z-depths. Farther nodes are smaller, dimmer,
// and blurred. Red scanner, overload explosions with depth-aware debris.
// Cycle: spawn → connect → overload → destroy → repeat.
// ═══════════════════════════════════════════════════════════════════════

const NODE_COUNT     = 160;
const SPAWN_RATE     = 2.5;
const EDGE_RANGE     = 220;
const OVERLOAD_AT    = 8;         // destroy at this many connections
const EXPLODE_DUR    = 1.4;
const SCAN_GAP       = 6;
const SCAN_SPEED     = 450;

// Depth: z=0 far (back), z=1 near (front)

// Palette
const COL_NODE  = [180, 195, 200];
const COL_EDGE  = [80, 95, 110];
const COL_WARN  = [255, 180, 50];
const COL_RED   = [255, 55, 55];
const COL_WHITE = [255, 255, 255];

function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function lerp(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }

const HEX = "0123456789ABCDEF";
function rHex(n) { let s=""; for(let i=0;i<n;i++) s+=HEX[Math.floor(Math.random()*16)]; return s; }

// Depth helpers — scale and opacity by z
function zScale(z) { return 0.35 + z * 0.65; }          // far=0.35x, near=1x
function zAlpha(z) { return 0.25 + z * 0.75; }          // far=0.25, near=1

let _id = 0;
function mkNode(w, h, fromEdge) {
  let x, y;
  if (fromEdge) {
    const s = Math.random() * 4 | 0;
    if      (s===0) { x=Math.random()*w; y=-8; }
    else if (s===1) { x=w+8; y=Math.random()*h; }
    else if (s===2) { x=Math.random()*w; y=h+8; }
    else            { x=-8; y=Math.random()*h; }
  } else {
    x = 40+Math.random()*(w-80);
    y = 40+Math.random()*(h-80);
  }
  const a = Math.random()*Math.PI*2;
  const z = Math.random();          // depth 0..1
  return {
    id: _id++, x, y, z,
    zv: (Math.random()-0.5)*0.04,   // slow z drift
    vx: Math.cos(a)*(0.3+Math.random()*0.7),
    vy: Math.sin(a)*(0.3+Math.random()*0.7),
    drift: Math.random()*Math.PI*2,
    dAmp: 0.12+Math.random()*0.25,
    r: 3.5+Math.random()*2.5,
    phase: Math.random()*Math.PI*2,
    op: 0, opTarget: 0.65+Math.random()*0.25,
    alive: true, edges: 0,
    overT: 0,
    exploding: false, expT: 0,
  };
}

function mkEdge(a, b, t) {
  return { a: a.id, b: b.id, born: t, life: 3+Math.random()*7, pT: Math.random(), pS: 0.4+Math.random()*0.6 };
}

function spawnDebris(node) {
  const out = [];
  const z = node.z;
  for (let i = 0; i < 20; i++) {
    const a = Math.random()*Math.PI*2, sp = 50+Math.random()*180;
    out.push({ t:"dot", x:node.x, y:node.y, z, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
      life:0.4+Math.random()*0.9, age:0, r:0.5+Math.random()*1.8, col: Math.random()<0.4?COL_RED:COL_NODE });
  }
  for (let i = 0; i < 6; i++) {
    out.push({ t:"tear", x:node.x-20-Math.random()*30, y:node.y+(Math.random()-0.5)*30, z,
      w:20+Math.random()*50, h:1+Math.random()*1.5, vx:(Math.random()-0.5)*120,
      life:0.25+Math.random()*0.4, age:0, col: Math.random()<0.3?COL_RED:COL_WHITE });
  }
  for (let i = 0; i < 8; i++) {
    const a = Math.random()*Math.PI*2, sp = 12+Math.random()*30;  // slow = stays near node
    out.push({ t:"hex", x:node.x, y:node.y, z, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
      text:"0x"+rHex(4), life:0.7+Math.random()*0.8, age:0 });
  }
  return out;
}

export default function CyberNetworkCanvas({ className }) {
  const canvasRef = useRef(null);
  const animRef  = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    let nodes = [], edges = [], debris = [];
    let scanX = -999, lastScan = 0, lastSpawn = 0;

    const nMap = new Map();
    const rebuild = () => { nMap.clear(); for (const n of nodes) nMap.set(n.id, n); };
    const nById = (id) => nMap.get(id);
    const dst = (a, b) => Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);

    // Only connect nodes at similar depth
    const zClose = (a, b) => Math.abs(a.z - b.z) < 0.35;

    // Seed
    for (let i = 0; i < NODE_COUNT * 0.6; i++) {
      const n = mkNode(W(), H(), false);
      n.op = n.opTarget;
      nodes.push(n);
    }
    rebuild();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i+1; j < nodes.length; j++) {
        if (zClose(nodes[i], nodes[j]) && dst(nodes[i], nodes[j]) < EDGE_RANGE*0.5 && Math.random() < 0.12)
          edges.push(mkEdge(nodes[i], nodes[j], 0));
      }
    }

    let prev = performance.now() * 0.001;

    const loop = () => {
      const now = performance.now() * 0.001;
      const dt = Math.min(now - prev, 0.05);
      prev = now;
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // ── Spawn ──
      const live = nodes.filter(n => n.alive && !n.exploding).length;
      if (live < NODE_COUNT && now - lastSpawn > 1/SPAWN_RATE) {
        const n = mkNode(w, h, true);
        nodes.push(n); nMap.set(n.id, n);
        lastSpawn = now;
      }

      // ── Update nodes ──
      for (const n of nodes) {
        if (!n.alive) continue;

        // Fade in
        if (n.op < n.opTarget) n.op = Math.min(n.opTarget, n.op + dt * 1.5);

        // Drift z slowly
        n.z += n.zv * dt;
        if (n.z < 0.05) { n.z = 0.05; n.zv = Math.abs(n.zv); }
        if (n.z > 0.95) { n.z = 0.95; n.zv = -Math.abs(n.zv); }

        // Count edges
        n.edges = 0;
        for (const e of edges) { if (e.a === n.id || e.b === n.id) n.edges++; }

        // Overload
        if (!n.exploding) {
          if (n.edges >= OVERLOAD_AT) {
            n.overT = Math.min(1, n.overT + dt * 1.5);
            if (n.overT >= 0.8) {
              n.exploding = true;
              n.expT = 0;
              debris.push(...spawnDebris(n));
            }
          } else {
            n.overT = Math.max(0, n.overT - dt * 2);
          }
        }

        // Exploding
        if (n.exploding) {
          n.expT += dt / EXPLODE_DUR;
          n.op = Math.max(0, 1 - n.expT * 1.3);
          const shake = 10 * Math.max(0, 1 - n.expT);
          n.x += (Math.random()-0.5) * shake;
          n.y += (Math.random()-0.5) * shake;
          if (n.expT >= 1) {
            n.alive = false;
            edges = edges.filter(e => e.a !== n.id && e.b !== n.id);
          }
          continue;
        }

        // Movement
        n.drift += dt * 0.5;
        const zs = zScale(n.z);
        n.vx += Math.sin(now*0.7 + n.drift) * n.dAmp * dt;
        n.vy += Math.cos(now*0.6 + n.drift*1.3) * n.dAmp * dt;
        n.x += n.vx * zs; n.y += n.vy * zs;   // far nodes move slower (parallax)

        // Wrap
        if (n.x < -30) n.x = w+20;
        if (n.x > w+30) n.x = -20;
        if (n.y < -30) n.y = h+20;
        if (n.y > h+30) n.y = -20;

        // Mouse repel (stronger on near nodes)
        const dx = n.x - mouseRef.current.x, dy = n.y - mouseRef.current.y;
        const md = Math.sqrt(dx*dx+dy*dy);
        if (md < 120 && md > 0) {
          const f = (120-md)/120*0.15*n.z;
          n.vx += dx/md*f; n.vy += dy/md*f;
        }

        // Damping
        n.vx *= 0.993; n.vy *= 0.993;
        const sp = Math.sqrt(n.vx**2+n.vy**2);
        if (sp > 1.0) { n.vx *= 1.0/sp; n.vy *= 1.0/sp; }
      }

      // Prune
      nodes = nodes.filter(n => n.alive || n.exploding);
      rebuild();

      // ── Edge formation ──
      for (let i = 0; i < 8; i++) {
        const a = nodes[Math.random()*nodes.length|0];
        if (!a || !a.alive || a.exploding) continue;
        for (const b of nodes) {
          if (b===a || !b.alive || b.exploding) continue;
          if (!zClose(a, b)) continue;
          if (dst(a,b) < EDGE_RANGE * zScale((a.z+b.z)/2)) {
            if (!edges.some(e => (e.a===a.id&&e.b===b.id)||(e.a===b.id&&e.b===a.id))) {
              edges.push(mkEdge(a, b, now));
              break;
            }
          }
        }
      }

      // Expire edges
      edges = edges.filter(e => {
        if (now - e.born > e.life) return false;
        const a = nById(e.a), b = nById(e.b);
        return a && b && a.alive && b.alive;
      });

      // ── Scan wave ──
      if (now - lastScan > SCAN_GAP) { scanX = -60; lastScan = now; }
      if (scanX < w + 100) scanX += SCAN_SPEED * dt;

      // ═══════════ RENDER — single z-sorted pass (no ctx.filter) ═══════════
      // Depth is conveyed via size (zScale) + opacity (zAlpha) + parallax speed.
      // ctx.filter blur is intentionally avoided — it redraws the entire canvas
      // state per-layer and is one of the most expensive Canvas2D operations.

      // Sort nodes back→front so painter's algorithm gives correct overlap
      nodes.sort((a, b) => a.z - b.z);

      // ── 1. Scanner (behind everything) ──
      if (scanX >= -60 && scanX < w + 100) {
        ctx.beginPath();
        ctx.moveTo(scanX, 0); ctx.lineTo(scanX, h);
        ctx.strokeStyle = rgba(COL_RED, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const g = ctx.createLinearGradient(scanX - 100, 0, scanX + 40, 0);
        g.addColorStop(0, "rgba(255,55,55,0)");
        g.addColorStop(0.5, "rgba(255,55,55,0.06)");
        g.addColorStop(0.8, "rgba(255,55,55,0.12)");
        g.addColorStop(1, "rgba(255,55,55,0)");
        ctx.fillStyle = g;
        ctx.fillRect(scanX - 100, 0, 140, h);

        ctx.beginPath();
        ctx.moveTo(scanX + 2, 0); ctx.lineTo(scanX + 2, h);
        ctx.strokeStyle = rgba(COL_RED, 0.2);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── 2. Edges ──
      for (const e of edges) {
        const na = nById(e.a), nb = nById(e.b);
        if (!na || !nb) continue;
        const eZ = (na.z + nb.z) / 2;

        const d = dst(na, nb);
        if (d < 1) continue;
        const age = now - e.born;
        let al = 1;
        if (age < 0.3) al = age/0.3;
        else if (age > e.life-0.8) al = Math.max(0, (e.life-age)/0.8);
        al *= 0.4 * (1 - d/(EDGE_RANGE*1.2));
        al = Math.max(0, al) * zAlpha(eZ);

        let ec = COL_EDGE;
        const mo = Math.max(na.overT||0, nb.overT||0);
        if (mo > 0) ec = mo < 0.5 ? lerp(COL_EDGE, COL_WARN, mo*2) : lerp(COL_WARN, COL_RED, (mo-0.5)*2);

        const boom = na.exploding || nb.exploding;
        if (boom && Math.random() > 0.3) continue;

        ctx.beginPath();
        ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = rgba(ec, boom ? al*2 : al);
        ctx.lineWidth = (boom ? 1.2 : 0.7) * zScale(eZ);
        ctx.stroke();

        // Energy dot — skip for far edges (barely visible, saves draw calls)
        if (!boom && eZ > 0.3) {
          e.pT += e.pS * dt;
          if (e.pT > 1) e.pT -= 1;
          const px = na.x+(nb.x-na.x)*e.pT, py = na.y+(nb.y-na.y)*e.pT;
          ctx.beginPath();
          ctx.arc(px, py, 1.2*zScale(eZ), 0, Math.PI*2);
          ctx.fillStyle = rgba(COL_NODE, 0.5*al);
          ctx.fill();
        }
      }

      // ── 3. Debris ──
      ctx.font = "bold 12px monospace";
      for (let i = debris.length-1; i >= 0; i--) {
        const d = debris[i];
        d.age += dt;
        if (d.age >= d.life) { debris.splice(i,1); continue; }
        const p = d.age/d.life, a = 1-p;
        const ds = zScale(d.z), da = zAlpha(d.z);

        if (d.t === "dot") {
          d.x += d.vx*dt; d.y += d.vy*dt;
          d.vx *= 0.94; d.vy *= 0.94;
          if (Math.random()>0.6) continue;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r*(1-p*0.5)*ds, 0, Math.PI*2);
          ctx.fillStyle = rgba(d.col, a*0.85*da);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x-d.vx*dt*3, d.y-d.vy*dt*3);
          ctx.strokeStyle = rgba(d.col, a*0.25*da);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else if (d.t === "tear") {
          d.x += d.vx*dt;
          if (Math.random()>0.5) continue;
          ctx.fillStyle = rgba(d.col, a*0.6*da);
          ctx.fillRect(d.x, d.y, d.w*(1-p*0.3)*ds, d.h*ds);
        } else if (d.t === "hex") {
          d.x += d.vx*dt; d.y += d.vy*dt;
          d.vx *= 0.96; d.vy *= 0.96;
          if (Math.random()>0.55) continue;
          ctx.fillStyle = rgba(COL_RED, a*0.7*da);
          ctx.fillText(d.text, d.x, d.y);
        }
      }

      // ── 4. Nodes (z-sorted, back→front) ──
      for (const n of nodes) {
        if (!n.alive && !n.exploding) continue;

        const zs = zScale(n.z);
        const za = zAlpha(n.z);
        const pulse = 1 + Math.sin(now*2.5+n.phase)*0.12;
        let col = COL_NODE;
        if (n.overT > 0) col = n.overT<0.5 ? lerp(COL_NODE, COL_WARN, n.overT*2) : lerp(COL_WARN, COL_RED, (n.overT-0.5)*2);
        if (n.exploding) col = COL_RED;

        const scale = 1 + n.overT * 2;
        const r = n.r * pulse * scale * zs;
        const al = n.op * za;

        let dx = n.x, dy = n.y;
        if (n.exploding) {
          dx += (Math.random()-0.5)*8*Math.max(0,1-n.expT);
          dy += (Math.random()-0.5)*8*Math.max(0,1-n.expT);
        }

        // Glow — use shadowBlur for near/overloading nodes; skip for far background ones
        // shadowBlur on a single arc is much faster than createRadialGradient per frame
        if (n.z > 0.45 || n.overT > 0 || n.exploding) {
          const glowStr = r * (3 + n.overT * 4);
          ctx.shadowColor = rgba(col, 0.5 * al);
          ctx.shadowBlur  = glowStr;
        }

        // Explosion flash
        if (n.exploding && n.expT < 0.12) {
          const fr = r*5*(1-n.expT/0.12);
          const fg = ctx.createRadialGradient(dx,dy,0,dx,dy,fr);
          fg.addColorStop(0, rgba(COL_WHITE, 0.5*(1-n.expT/0.12)));
          fg.addColorStop(0.4, rgba(COL_RED, 0.3*(1-n.expT/0.12)));
          fg.addColorStop(1, rgba(COL_RED, 0));
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(dx,dy,fr,0,Math.PI*2);
          ctx.fillStyle = fg; ctx.fill();
          ctx.shadowColor = rgba(col, 0.5 * al);
          ctx.shadowBlur  = r * (3 + n.overT * 4);
        }
        // Shockwave ring
        if (n.exploding && n.expT < 0.4) {
          const sr = r*2 + n.expT*100*zs;
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(dx,dy,sr,0,Math.PI*2);
          ctx.strokeStyle = rgba(COL_RED, 0.25*(1-n.expT/0.4));
          ctx.lineWidth = 1.5*(1-n.expT/0.4)*zs;
          ctx.stroke();
        }
        // Glitch bands
        if (n.exploding && n.expT < 0.5 && Math.random()>0.4) {
          ctx.shadowBlur = 0;
          for (let g=0;g<2;g++) {
            const gy = dy+(Math.random()-0.5)*r*3;
            ctx.fillStyle = rgba(Math.random()>0.5?COL_RED:COL_WHITE, 0.12*(1-n.expT/0.5));
            ctx.fillRect(dx-25*zs-Math.random()*15, gy, (30+Math.random()*40)*zs, 1+Math.random());
          }
        }

        // Dot
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI*2);
        ctx.fillStyle = rgba(col, al * 0.85);
        ctx.fill();

        // Center highlight
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(dx, dy, r*0.35, 0, Math.PI*2);
        ctx.fillStyle = rgba(COL_WHITE, al*0.5);
        ctx.fill();

        // Scanner highlight
        if (Math.abs(n.x - scanX) < 35) {
          const si = 1 - Math.abs(n.x - scanX)/35;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r*2, 0, Math.PI*2);
          ctx.fillStyle = rgba(COL_RED, 0.15*si*za);
          ctx.fill();
        }
      }

      // Ensure shadow is off after node pass
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(loop);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", onMouse);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouse);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
