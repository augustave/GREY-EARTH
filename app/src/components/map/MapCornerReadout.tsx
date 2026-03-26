"use client";

import { useViewportState } from "@/app-shell/hooks";
import { formatDMS } from "@/lib/geo";

export default function MapCornerReadout() {
  const { breakpoint, center, zoom } = useViewportState();

  if (breakpoint !== "desktop") {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 panel px-3 py-2 hillshade-grain">
      <div className="flex items-center gap-3 text-[10px] tracking-wider">
        <span className="text-[#00ff41] font-semibold">SIGINT-TERRAIN</span>
        <span className="text-white/60 font-mono">
          {formatDMS(center.lat, true)} {formatDMS(center.lng, false)}
        </span>
        <span className="text-white/40 font-mono">Z{zoom.toFixed(1)}</span>
      </div>
    </div>
  );
}
