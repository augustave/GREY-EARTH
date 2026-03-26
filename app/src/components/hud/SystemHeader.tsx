"use client";

import { useRenderState, useViewportState } from "@/app-shell/hooks";

export default function SystemHeader({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { viewMode } = useViewportState();
  const { terrainProfile } = useRenderState();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="status-indicator bg-sigint-green pulse-tactical" />
        <span className="text-sm font-black tracking-[0.2em] text-white">
          GREY-EARTH
        </span>
        {compact ? null : (
          <span className="text-[9px] px-1.5 py-0.5 border border-sigint-green/30 text-sigint-green bg-sigint-green/5 font-bold uppercase tracking-widest">
            Tactical SA // v1.2
          </span>
        )}
      </div>
      {compact ? null : (
        <div className="flex items-center gap-4 mt-1 ml-5">
          <div className="flex flex-col">
            <span className="data-label">Datum</span>
            <span className="text-[10px] font-bold text-white/80">
              WGS84 / NAVD88
            </span>
          </div>
          <div className="w-px h-6 bg-divider" />
          <div className="flex flex-col">
            <span className="data-label">Mode</span>
            <span className="text-[10px] font-bold text-sigint-teal uppercase tracking-widest">
              {viewMode} RELIEF
            </span>
          </div>
          <div className="w-px h-6 bg-divider" />
          <div className="flex flex-col">
            <span className="data-label">Profile</span>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
              {terrainProfile.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
