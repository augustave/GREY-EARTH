"use client";

import { useClock } from "@/hooks/useClock";

export default function TimeStatusPanel({
  compact = false,
}: {
  compact?: boolean;
}) {
  const time = useClock();

  return (
    <div className="panel-hardened px-4 py-2 flex items-center gap-4 hillshade-grain">
      <div className="flex flex-col items-end">
        <span className="data-label">Zulu Time</span>
        <span className="text-xs font-bold tracking-widest text-white transition-opacity duration-300">
          {time}
        </span>
      </div>
      {compact ? null : <div className="w-px h-8 bg-divider" />}
      <div className="flex flex-col items-end">
        <span className="data-label">Status</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sigint-green shadow-[0_0_8px_var(--color-sigint-green)]" />
          <span className="text-[10px] font-bold text-sigint-green uppercase tracking-wider">
            Operational
          </span>
        </div>
      </div>
    </div>
  );
}
