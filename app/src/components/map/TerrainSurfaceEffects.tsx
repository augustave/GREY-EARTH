"use client";

import { useViewportState } from "@/app-shell/hooks";

export default function TerrainSurfaceEffects() {
  const { breakpoint } = useViewportState();

  return (
    <>
      {breakpoint === "desktop" ? (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-screen opacity-20">
          <div className="stipple-high absolute inset-0" />
        </div>
      ) : null}

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-multiply opacity-20">
        <div className="wash-aging absolute inset-0" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-overlay opacity-10">
        <div className="hillshade-grain absolute inset-0" />
      </div>

      {breakpoint !== "mobile" ? (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-40">
          <div className="scan-lines scan-animate absolute inset-0" />
        </div>
      ) : null}

      <div className="vignette absolute inset-0 z-10 pointer-events-none" />
    </>
  );
}
