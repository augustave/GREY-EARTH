"use client";

import { useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import MapCornerReadout from "@/components/map/MapCornerReadout";
import TerrainSurfaceEffects from "@/components/map/TerrainSurfaceEffects";
import { useEarthEngineImageryLayer } from "@/components/map/useEarthEngineImageryLayer";
import { useMapAnalysisBindings } from "@/components/map/useMapAnalysisBindings";
import { useMapInteractions } from "@/components/map/useMapInteractions";
import { useMapLayerBindings } from "@/components/map/useMapLayerBindings";
import { useMapLifecycle } from "@/components/map/useMapLifecycle";

export default function TerrainMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useMapLifecycle(mapContainerRef);
  useEarthEngineImageryLayer();
  useMapLayerBindings();
  useMapAnalysisBindings();
  useMapInteractions();

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="w-full h-full" />
      <TerrainSurfaceEffects />
      <MapCornerReadout />
      <style jsx global>{`
        .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }

        .maplibregl-popup-tip {
          border-top-color: rgba(10, 12, 11, 0.95) !important;
        }

        .maplibregl-popup-close-button {
          color: rgba(255, 255, 255, 0.3);
          padding: 6px;
        }
      `}</style>
    </div>
  );
}
