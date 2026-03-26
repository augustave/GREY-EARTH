"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useMapRuntimeActions, useViewportActions } from "@/app-shell/hooks";
import {
  DATUM_LAT,
  DATUM_LNG,
  createBaseStyle,
} from "@/lib/map/createBaseStyle";

export function useMapLifecycle(
  mapContainerRef: { current: HTMLDivElement | null },
) {
  const { setMap, setIsLoaded } = useMapRuntimeActions();
  const { updateViewport } = useViewportActions();

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createBaseStyle(),
      center: [DATUM_LNG, DATUM_LAT],
      zoom: 11.5,
      pitch: 45,
      bearing: 0,
      attributionControl: false,
    });

    const syncViewport = () => {
      const center = mapInstance.getCenter();
      updateViewport({
        center: { lng: center.lng, lat: center.lat },
        zoom: mapInstance.getZoom(),
        pitch: mapInstance.getPitch(),
        bearing: mapInstance.getBearing(),
      });
    };

    const datumEl = document.createElement("div");
    datumEl.style.cssText =
      "width: 12px; height: 12px; border: 1.5px solid #00ff41; border-radius: 50%; background: rgba(0, 255, 65, 0.15); box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);";

    new maplibregl.Marker({ element: datumEl })
      .setLngLat([DATUM_LNG, DATUM_LAT])
      .addTo(mapInstance);

    mapInstance.on("load", () => {
      setIsLoaded(true);
      syncViewport();
    });
    mapInstance.on("move", syncViewport);

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
      setMap(null);
      setIsLoaded(false);
    };
  }, [mapContainerRef, setIsLoaded, setMap, updateViewport]);
}
