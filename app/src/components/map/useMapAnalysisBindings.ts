"use client";

import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import { useAnalysisState, useMapRuntime } from "@/app-shell/hooks";

export function useMapAnalysisBindings() {
  const { map, isLoaded } = useMapRuntime();
  const { transectPoints } = useAnalysisState();

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }

    const source = map.getSource("transect-source") as
      | maplibregl.GeoJSONSource
      | undefined;

    if (!source) {
      return;
    }

    if (transectPoints.length === 2) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: transectPoints.map((point) => [point.lng, point.lat]),
            },
            properties: {},
          },
        ],
      });
      return;
    }

    source.setData({ type: "FeatureCollection", features: [] });
  }, [isLoaded, map, transectPoints]);
}
