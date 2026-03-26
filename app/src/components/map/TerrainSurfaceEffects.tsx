"use client";

import { useEarthEngineState, useViewportState } from "@/app-shell/hooks";

export default function TerrainSurfaceEffects() {
  const { breakpoint } = useViewportState();
  const { isImageryActive } = useEarthEngineState();

  return (
    <>
      {!isImageryActive ? (
        <div className="absolute inset-0 z-[1] pointer-events-none terrain-substrate" />
      ) : null}

      {!isImageryActive ? (
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden mix-blend-soft-light opacity-[0.14]">
          <div className="terrain-relief absolute inset-0" />
        </div>
      ) : null}

      {breakpoint === "desktop" ? (
        <div
          className={`absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-screen ${
            isImageryActive ? "opacity-12" : "opacity-20"
          }`}
        >
          <div className="stipple-high absolute inset-0" />
        </div>
      ) : null}

      <div
        className={`absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-multiply ${
          isImageryActive ? "opacity-10" : "opacity-20"
        }`}
      >
        <div className="wash-aging absolute inset-0" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden opacity-40">
        <div className="denied-crosshatch absolute inset-0 [mask-image:radial-gradient(circle_at_76%_48%,black_0,black_11%,transparent_19%)]" />
      </div>

      <div
        className={`absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-overlay ${
          isImageryActive ? "opacity-[0.06]" : "opacity-10"
        }`}
      >
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
