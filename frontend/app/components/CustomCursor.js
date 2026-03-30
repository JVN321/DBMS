"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * CustomCursor — optional scoped custom cursor.
 *
 * States:
 *  • default     – small dot + subtle ring
 *  • clickable   – ring enlarges slightly (buttons, links, etc.)
 *  • graph-node  – targeting crosshair + scan ring colored to the node's risk hue
 */
export default function CustomCursor({ scopeRef = null }) {
  const pathname = usePathname();
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const brac1Ref = useRef(null); // corner brackets (4)
  const brac2Ref = useRef(null);
  const brac3Ref = useRef(null);
  const brac4Ref = useRef(null);
  const labelRef = useRef(null);

  // ── Reset cursor to default on every route change ─────────────────
  useEffect(() => {
    const ring  = ringRef.current;
    const b1    = brac1Ref.current;
    const b2    = brac2Ref.current;
    const b3    = brac3Ref.current;
    const b4    = brac4Ref.current;
    const label = labelRef.current;
    if (!ring) return;
    ring.classList.remove("cursor--node", "cursor--clickable");
    [b1, b2, b3, b4].forEach((b) => b?.classList.remove("cursor-bracket--active"));
    if (label) label.classList.remove("cursor-label--visible");
  }, [pathname]);

  useEffect(() => {
    const dot   = dotRef.current;
    const ring  = ringRef.current;
    const b1    = brac1Ref.current;
    const b2    = brac2Ref.current;
    const b3    = brac3Ref.current;
    const b4    = brac4Ref.current;
    const label = labelRef.current;
    const scopeEl = scopeRef?.current ?? null;
    let insideScope = !scopeEl;

    if (!dot || !ring) return;

    // ── Smooth position via RAF ──────────────────────────────────────
    let mouseX = -200, mouseY = -200;
    let rafId = null;

    const isInScope = (target) => {
      if (!scopeEl) return true;
      if (!(target instanceof Node)) return false;
      return scopeEl.contains(target);
    };

    const resetNode = () => {
      ring.classList.remove("cursor--node");
      [b1, b2, b3, b4].forEach((b) => b.classList.remove("cursor-bracket--active"));
      label.classList.remove("cursor-label--visible");
    };

    const setVisible = (visible) => {
      const opacity = visible ? "1" : "0";
      dot.style.opacity = opacity;
      ring.style.opacity = opacity;
      if (!visible) {
        resetNode();
        ring.classList.remove("cursor--clickable");
      }
    };

    setVisible(!scopeEl);

    const tick = () => {
      const tx = `translate(${mouseX}px,${mouseY}px)`;
      dot.style.transform   = tx;
      ring.style.transform  = tx;
      b1.style.transform    = tx;
      b2.style.transform    = tx;
      b3.style.transform    = tx;
      b4.style.transform    = tx;
      label.style.transform = `translate(${mouseX + 22}px,${mouseY - 14}px)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMove = (e) => {
      if (scopeEl && !insideScope) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onScopeEnter = () => {
      insideScope = true;
      setVisible(true);
    };

    const onScopeLeave = () => {
      insideScope = false;
      setVisible(false);
    };

    if (scopeEl) {
      scopeEl.addEventListener("mouseenter", onScopeEnter);
      scopeEl.addEventListener("mouseleave", onScopeLeave);
    }

    // ── Generic clickable hover (buttons, links, interactive elements) ──
    const CLICKABLE = "a,button,[role=button],input,select,textarea,label,[tabindex]";

    const onOver = (e) => {
      if (!isInScope(e.target)) return;
      if (e.target.closest(CLICKABLE)) {
        ring.classList.add("cursor--clickable");
      }
    };
    const onOut = (e) => {
      if (!isInScope(e.target)) return;
      if (e.target.closest(CLICKABLE)) {
        ring.classList.remove("cursor--clickable");
      }
    };
    window.addEventListener("mouseover",  onOver, { passive: true });
    window.addEventListener("mouseout",   onOut,  { passive: true });

    // ── Mouse down/up feedback ───────────────────────────────────────
    const onDown = (e) => {
      if (!isInScope(e.target)) return;
      dot.classList.add("cursor--press");
      resetNode();
    };
    const onUp = () => dot.classList.remove("cursor--press");
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup",   onUp,   { passive: true });

    // ── Graph node hover event (dispatched from GraphViewer/*.js) ────
    const onNodeHover = (e) => {
      if (scopeEl && !insideScope) return;
      const node = e.detail?.node;

      if (node) {
        const color = node.color || "#6366f1";

        ring.style.setProperty("--c-ring", color);
        ring.classList.add("cursor--node");
        ring.classList.remove("cursor--clickable");

        [b1, b2, b3, b4].forEach((b) => {
          b.style.setProperty("--c-ring", color);
          b.classList.add("cursor-bracket--active");
        });

        // Short label: first 8 chars of address
        const shortLabel = node.label
          ? node.label.length > 10
            ? node.label.slice(0, 8) + "…"
            : node.label
          : node.id?.slice(0, 8) ?? "";
        label.textContent  = shortLabel;
        label.style.color  = color;
        label.style.borderColor = color;
        label.style.boxShadow   = `0 0 6px ${color}80`;
        label.classList.add("cursor-label--visible");
      } else {
        ring.classList.remove("cursor--node");

        [b1, b2, b3, b4].forEach((b) =>
          b.classList.remove("cursor-bracket--active")
        );
        label.classList.remove("cursor-label--visible");
      }
    };

    window.addEventListener("graph-node-hover", onNodeHover);

    // ── Leave window: hide cursor ────────────────────────────────────
    const onLeave = () => {
      setVisible(false);
    };
    const onEnter = () => {
      if (!scopeEl || insideScope) {
        setVisible(true);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(rafId);
      if (scopeEl) {
        scopeEl.removeEventListener("mouseenter", onScopeEnter);
        scopeEl.removeEventListener("mouseleave", onScopeLeave);
      }
      window.removeEventListener("mousemove",         onMove);
      window.removeEventListener("mouseover",         onOver);
      window.removeEventListener("mouseout",          onOut);
      window.removeEventListener("mousedown",         onDown);
      window.removeEventListener("mouseup",           onUp);
      window.removeEventListener("graph-node-hover",  onNodeHover);
      document.removeEventListener("mouseleave",      onLeave);
      document.removeEventListener("mouseenter",      onEnter);
    };
  }, [scopeRef]);

  return (
    <>
      {/* ── Center dot ── */}
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" suppressHydrationWarning />

      {/* ── Outer ring ── */}
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" suppressHydrationWarning />

      {/* ── Corner brackets (targeting reticle) ── */}
      <div ref={brac1Ref} className="cursor-bracket cursor-bracket--tl" aria-hidden="true" suppressHydrationWarning />
      <div ref={brac2Ref} className="cursor-bracket cursor-bracket--tr" aria-hidden="true" suppressHydrationWarning />
      <div ref={brac3Ref} className="cursor-bracket cursor-bracket--bl" aria-hidden="true" suppressHydrationWarning />
      <div ref={brac4Ref} className="cursor-bracket cursor-bracket--br" aria-hidden="true" suppressHydrationWarning />

      {/* ── Node label tooltip ── */}
      <div ref={labelRef} className="cursor-label" aria-hidden="true" suppressHydrationWarning />
    </>
  );
}

