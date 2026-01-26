"use client";

import { cn } from "@/lib/utils";

interface GhostFrameOverlayProps {
  isRecording: boolean;
}

export function GhostFrameOverlay({ isRecording }: GhostFrameOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-500",
        isRecording ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Car silhouette SVG - side view */}
      <svg
        viewBox="0 0 400 160"
        className="w-[80%] max-w-[400px] h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main car body outline */}
        <path
          d="M40 100
             L60 100
             L70 80
             L100 60
             L140 50
             L180 45
             L260 45
             L300 50
             L330 65
             L350 85
             L360 100
             L380 100
             L380 110
             L340 110
             L340 100
             C340 85 325 75 310 75
             C295 75 280 85 280 100
             L280 110
             L140 110
             L140 100
             C140 85 125 75 110 75
             C95 75 80 85 80 100
             L80 110
             L40 110
             Z"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="8 4"
          strokeOpacity="0.25"
        />

        {/* Windows */}
        <path
          d="M110 60
             L145 50
             L180 48
             L180 75
             L110 75
             Z"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.2"
        />
        <path
          d="M185 48
             L260 48
             L290 55
             L310 70
             L310 75
             L185 75
             Z"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeOpacity="0.2"
        />

        {/* Front wheel */}
        <circle
          cx="110"
          cy="100"
          r="22"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 3"
          strokeOpacity="0.25"
        />
        <circle
          cx="110"
          cy="100"
          r="12"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 2"
          strokeOpacity="0.15"
        />

        {/* Rear wheel */}
        <circle
          cx="310"
          cy="100"
          r="22"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 3"
          strokeOpacity="0.25"
        />
        <circle
          cx="310"
          cy="100"
          r="12"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 2"
          strokeOpacity="0.15"
        />

        {/* Headlight */}
        <ellipse
          cx="55"
          cy="92"
          rx="8"
          ry="6"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="3 2"
          strokeOpacity="0.2"
        />

        {/* Taillight */}
        <ellipse
          cx="365"
          cy="95"
          rx="6"
          ry="8"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="3 2"
          strokeOpacity="0.2"
        />
      </svg>

      {/* Guide text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium tracking-wide">
        ALIGN VEHICLE
      </div>
    </div>
  );
}
