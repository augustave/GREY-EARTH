"use client";

import { useEffect } from "react";
import { useMapRuntime, useRenderState } from "@/app-shell/hooks";

export function useMapLayerBindings() {
  const { map, isLoaded } = useMapRuntime();
  const { renderStateManifest } = useRenderState();

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }

    const activeLayerIds = new Set(
      renderStateManifest.layers_active.map((layer) => layer.id),
    );

    map.setPaintProperty(
      "hillshade",
      "raster-opacity",
      activeLayerIds.has("hillshade") ? 0.45 : 0,
    );
    map.setLayoutProperty(
      "denied",
      "visibility",
      activeLayerIds.has("denied") ? "visible" : "none",
    );
    map.setTerrain({
      source: "terrain-rgb",
      exaggeration: renderStateManifest.z_exaggeration,
    });
  }, [isLoaded, map, renderStateManifest]);
}
