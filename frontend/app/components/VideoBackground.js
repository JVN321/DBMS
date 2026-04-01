"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground({
  className,
  videoSrc = "/asset/background.mp4",
  videoOpacity = 1,
  overlayOpacity = 0.1,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0; // Adjust for playback speed if needed
    }
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className || ""}`}>
      {/* 
        For best performance with a video background: 
        - Use WebM (H.264/H.265) or MP4. 
        - The source plays inline, muted, and loops indefinitely.
        - Next.js typically serves assets from the 'public' folder. If "asset/background.mp4" 
          is in 'frontend/public/asset/background.mp4', the path "/asset/background.mp4" works perfectly.
      */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-100"
        style={{
          opacity: videoOpacity,
          filter: "brightness(1) contrast(1.1)", // Optional: tweaks to make overlay text pop
        }}
      />
      {/* Optional dark overlay to ensure text readability */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}
    </div>
  );
}