"use client";

import { useViewportState } from "@/app-shell/hooks";
import { formatDMS } from "@/lib/geo";

function formatAzimuth(bearing: number) {
  const normalized = ((bearing % 360) + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const direction = directions[Math.round(normalized / 45) % directions.length];

  return `${normalized.toFixed(0)}° ${direction}`;
}

export default function CoordinatesPanel() {
  const { center, zoom, bearing } = useViewportState();

  return (
    <div className="panel-hardened p-4 w-72 hillshade-grain">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="data-label">Latitude</span>
            <span className="text-sm font-bold data-value">
              {formatDMS(center.lat, true, 2)}
            </span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="data-label">Longitude</span>
            <span className="text-sm font-bold data-value">
              {formatDMS(center.lng, false, 2)}
            </span>
          </div>
        </div>
        <div className="h-px bg-divider" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="data-label">Zoom</span>
            <span className="text-xs font-bold text-white">{zoom.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="data-label">Azimuth</span>
            <span className="text-xs font-bold text-white">
              {formatAzimuth(bearing)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
