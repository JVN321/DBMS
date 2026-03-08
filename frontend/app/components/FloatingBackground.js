"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function FloatingBackground() {
  const [mounted, setMounted] = useState(false);
  const [doodles, setDoodles] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    // Generate a fixed scatter pattern safely after hydration to avoid SSR mismatch
    // WhatsApp style needs a dense, repeating grid-like scatter.
    const newDoodles = [];
    const rows = 6;
    const cols = 8;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Add some jitter to the grid positions so it feels scattered
        const top = (r / rows) * 100 + (Math.random() * 5 - 2.5);
        const left = (c / cols) * 100 + (Math.random() * 5 - 2.5);
        
        // Randomly skip a few to make it feel organic
        if (Math.random() > 0.8) continue;

        // Keep dots tiny (2px to 6px)
        const size = Math.floor(Math.random() * 4) + 2;
        // Random opacity for depth
        const opacity = Math.random() * 0.6 + 0.2;
        // Keep speeds incredibly slow (60s to 120s)
        const duration = Math.floor(Math.random() * 60) + 60;
        // Random stagger delays (-100s to 0s)
        const delay = -Math.floor(Math.random() * 100);

        newDoodles.push({ id: `${r}-${c}`, top, left, size, opacity, duration, delay });
      }
    }
    
    setDoodles(newDoodles);
    setMounted(true);
  }, []);

  if (!mounted || pathname === '/login' || pathname === '/') return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {doodles.map((doodle) => {
        const { id, top, left, size, opacity, duration, delay } = doodle;
        return (
          <div 
            key={id}
            className="absolute floating-icon" 
            style={{ 
              top: `${top}%`, 
              left: `${left}%`, 
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: '#a855f7', // Purple hue
              opacity: opacity,
              boxShadow: `0 0 ${size * 2}px rgba(168, 85, 247, 0.8)`, // Purple Glow effect
              animationDelay: `${delay}s`, 
              animationDuration: `${duration}s` 
            }}
          />
        );
      })}
    </div>
  );
}
