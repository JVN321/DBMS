"use client";

import { useState } from "react";
import { LayoutTemplate, Presentation } from "lucide-react";

import LandingPageClassic from "./LandingPageClassic";
import LandingPagePresentation from "./LandingPagePresentation";

export default function LandingPage() {
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-10050">
        <button
          type="button"
          onClick={() => setIsPresentationMode((currentMode) => !currentMode)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/75 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition hover:border-cyan-300/70 hover:text-cyan-200"
          aria-pressed={isPresentationMode}
          aria-label={
            isPresentationMode
              ? "Switch to classic landing page"
              : "Switch to presentation landing page"
          }
        >
          {isPresentationMode ? <LayoutTemplate size={14} /> : <Presentation size={14} />}
          {isPresentationMode ? "Classic Page" : "Presentation Mode"}
        </button>
      </div>

      {isPresentationMode ? <LandingPagePresentation /> : <LandingPageClassic />}
    </div>
  );
}
