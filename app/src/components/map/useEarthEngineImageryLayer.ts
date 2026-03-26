"use client";

import { useEffect } from "react";
import { useEarthEngineState, useMapRuntime } from "@/app-shell/hooks";
import {
  EARTH_ENGINE_LAYER_ID,
  EARTH_ENGINE_SOURCE_ID,
} from "@/lib/earth-engine/browser";

export function useEarthEngineImageryLayer() {
  const { map, isLoaded } = useMapRuntime();
  const { isImageryActive, tileUrlTemplate } = useEarthEngineState();

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }

    const removeImageryLayer = () => {
      if (map.getLayer(EARTH_ENGINE_LAYER_ID)) {
        map.removeLayer(EARTH_ENGINE_LAYER_ID);
      }
      if (map.getSource(EARTH_ENGINE_SOURCE_ID)) {
        map.removeSource(EARTH_ENGINE_SOURCE_ID);
      }
    };

    if (!isImageryActive || !tileUrlTemplate) {
      removeImageryLayer();
      return;
    }

    removeImageryLayer();
    map.addSource(EARTH_ENGINE_SOURCE_ID, {
      type: "raster",
      tiles: [tileUrlTemplate],
      tileSize: 256,
      attribution: "Google Earth Engine / Sentinel-2",
    });
    map.addLayer(
      {
        id: EARTH_ENGINE_LAYER_ID,
        type: "raster",
        source: EARTH_ENGINE_SOURCE_ID,
        paint: {
          "raster-opacity": 0.92,
          "raster-fade-duration": 0,
          "raster-saturation": -0.08,
          "raster-contrast": 0.08,
          "raster-brightness-min": 0.02,
          "raster-brightness-max": 0.98,
        },
      },
      "hillshade",
    );
  }, [isImageryActive, isLoaded, map, tileUrlTemplate]);
}
