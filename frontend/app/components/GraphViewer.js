"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";

// Register the cola layout
if (typeof window !== "undefined") {
  cytoscape.use(cola);
}

// Map risk score (0-100) to a color from green → yellow → red
function riskColor(score, lightness = 50) {
  const s = Math.max(0, Math.min(100, score || 0));
  // Hue: 280° (purple) → 320° (pink/magenta) → 0° (red)
  const hue = Math.round(280 - (s / 100) * 280);
  return `hsl(${hue}, 90%, ${lightness}%)`;
}

const DEFAULT_STYLE = [
  {
    selector: "node[nodeType='Wallet']",
    style: {
      label: (ele) => {
        const risk = ele.data("riskScore");
        const addr = ele.data("label") || ele.data("id");
        const short = addr.length > 10 ? addr.slice(0, 10) + "…" : addr;
        return risk != null ? `${short}\n⚠ ${risk}` : short;
      },
      "text-valign": "bottom",
      "text-halign": "center",
      "font-size": "9px",
      color: "#a1a1aa",
      "text-margin-y": 6,
      "text-max-width": "100px",
      "text-wrap": "wrap",
      "text-overflow-wrap": "ellipsis",
      "background-color": (ele) => riskColor(ele.data("riskScore") || 0),
      width: 30,
      height: 30,
      "border-width": 2,
      "border-color": (ele) => riskColor(ele.data("riskScore") || 0, 35),
    },
  },
  {
    selector: "node[nodeType='Coin']",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "font-size": "8px",
      color: "#a1a1aa",
      "text-margin-y": 5,
      "background-color": "#f59e0b",
      shape: "diamond",
      width: 22,
      height: 22,
      "border-width": 1,
      "border-color": "#d97706",
    },
  },
  {
    selector: "node.suspicious",
    style: {
      "background-color": "#ef4444",
      "border-color": "#dc2626",
      "border-width": 3,
    },
  },
  {
    selector: "node.highlighted",
    style: {
      "background-color": "#c084fc",
      "border-color": "#a855f7",
      "border-width": 3,
    },
  },
  {
    selector: "node:selected",
    style: {
      "background-color": "#d8b4fe",
      "border-color": "#c084fc",
      "border-width": 3,
      "box-shadow": "0 0 20px rgba(168, 85, 247, 0.8)",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "#374151",
      "target-arrow-color": "#374151",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "arrow-scale": 0.8,
      label: "data(label)",
      "font-size": "7px",
      color: "#6b7280",
      "text-rotation": "autorotate",
      "text-margin-y": -8,
    },
  },
  {
    selector: "edge.highlighted",
    style: {
      "line-color": "#a855f7",
      "target-arrow-color": "#a855f7",
      width: 3,
      "z-index": 10,
    },
  },
  {
    selector: "edge[edgeType='USES']",
    style: {
      "line-style": "dashed",
      "line-color": "#4b5563",
      "target-arrow-shape": "none",
      width: 1,
      label: "",
    },
  },
];

export default function GraphViewer({
  elements,
  onNodeClick,
  highlightedNodes = [],
  highlightPath = [],
  style,
  layout = "cola",
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [zoomSpeed, setZoomSpeed] = useState(0.3);
  const zoomSpeedRef = useRef(zoomSpeed);

  // Keep ref in sync with state
  useEffect(() => {
    zoomSpeedRef.current = zoomSpeed;
  }, [zoomSpeed]);

  const handleNodeClick = useCallback(
    (e) => {
      const node = e.target;
      if (onNodeClick && node.data("nodeType") === "Wallet") {
        onNodeClick(node.data("label") || node.data("id"));
      }
    },
    [onNodeClick]
  );

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: DEFAULT_STYLE,
      layout: { name: "grid" },
      minZoom: 0.1,
      maxZoom: 5,
      userZoomingEnabled: false,
    });

    // Custom wheel zoom using zoomSpeed ref
    const container = containerRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const factor = Math.pow(1.04, delta * zoomSpeedRef.current * 10);
      const rect = container.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      cy.zoom({
        level: cy.zoom() * factor,
        renderedPosition: pos,
      });
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    cyRef.current = cy;
    cy.on("tap", "node", handleNodeClick);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      cy.destroy();
      cyRef.current = null;
    };
  }, [handleNodeClick]);

  // Update elements
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !elements) return;

    cy.elements().remove();

    if (elements.nodes?.length > 0 || elements.edges?.length > 0) {
      const allElements = [
        ...(elements.nodes || []),
        ...(elements.edges || []),
      ];
      cy.add(allElements);

      const layoutConfig =
        layout === "cola"
          ? {
              name: "cola",
              animate: true,
              maxSimulationTime: 500,
              nodeSpacing: 40,
              edgeLength: 120,
              randomize: true,
              avoidOverlap: true,
            }
          : { name: layout, animate: true };

      cy.layout(layoutConfig).run();
    }
  }, [elements, layout]);

  // Update highlights
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass("suspicious highlighted");

    // Mark suspicious nodes
    if (highlightedNodes.length > 0) {
      for (const nodeId of highlightedNodes) {
        const node = cy.getElementById(nodeId);
        if (node.length) node.addClass("suspicious");
        // Also try matching by label
        cy.nodes(`[label = "${nodeId}"]`).addClass("suspicious");
      }
    }

    // Mark path
    if (highlightPath.length > 1) {
      for (const nodeId of highlightPath) {
        const node = cy.getElementById(nodeId);
        if (node.length) node.addClass("highlighted");
        cy.nodes(`[label = "${nodeId}"]`).addClass("highlighted");
      }

      // Highlight edges between consecutive path nodes
      for (let i = 0; i < highlightPath.length - 1; i++) {
        const sourceId = highlightPath[i];
        const targetId = highlightPath[i + 1];
        cy.edges().forEach((edge) => {
          const s = edge.source();
          const t = edge.target();
          if (
            (s.id() === sourceId || s.data("label") === sourceId) &&
            (t.id() === targetId || t.data("label") === targetId)
          ) {
            edge.addClass("highlighted");
          }
        });
      }
    }
  }, [highlightedNodes, highlightPath]);

  return (
    <div className="relative" style={style}>
      <div
        ref={containerRef}
        className="graph-container"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg border border-card-border bg-card/90 px-3 py-2 backdrop-blur-sm">
        <span className="text-[10px] text-muted">Zoom</span>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={zoomSpeed}
          onChange={(e) => setZoomSpeed(parseFloat(e.target.value))}
          className="h-1 w-20 cursor-pointer accent-accent"
        />
        <span className="w-7 text-right text-[10px] font-mono text-muted">{zoomSpeed.toFixed(2)}</span>
      </div>
    </div>
  );
}
