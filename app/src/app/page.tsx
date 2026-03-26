"use client";

import TerrainMap from "@/components/TerrainMap";
import HUDOverlay from "@/components/HUDOverlay";
import Terrain3D from "@/components/Terrain3D";
import { useViewportState } from "@/app-shell/hooks";

export default function Home() {
  const { viewMode } = useViewportState();

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* 2D Map */}
      <div className={viewMode === "2D" ? "block h-full w-full" : "hidden"}>
        <TerrainMap />
      </div>

      {/* 3D Mode */}
      {viewMode === "3D" && <Terrain3D />}

      {/* HUD panels overlay */}
      <HUDOverlay />

      {/* Corner vignette */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </main>
  );
}
