"use client";

import { useCallback, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  useAnalysisActions,
  useAnalysisState,
  useMapRuntime,
  useViewportState,
} from "@/app-shell/hooks";
import { getSlopeLabel, queryElevation, sampleTransect } from "@/lib/elevation";
import { formatDMS } from "@/lib/geo";

function createMarker(lng: number, lat: number, label: string) {
  const element = document.createElement("div");
  element.style.cssText =
    "width: 20px; height: 20px; border: 1.5px solid #00ff41; border-radius: 50%; background: rgba(0, 255, 65, 0.2); color: #00ff41; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 0 12px rgba(0, 255, 65, 0.4);";
  element.innerText = label;

  return new maplibregl.Marker({ element }).setLngLat([lng, lat]);
}

export function useMapInteractions() {
  const { map } = useMapRuntime();
  const { breakpoint } = useViewportState();
  const { activeTool, transectPoints } = useAnalysisState();
  const {
    clearTransect,
    setTransectPoints,
    setProfileData,
    setSelectedQueryPoint,
    setAnalysisStatus,
  } = useAnalysisActions();

  const popupRef = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const longPressTimer = useRef<number | null>(null);

  const handleElevationQuery = useCallback(
    async (lng: number, lat: number) => {
      if (!map) {
        return;
      }

      setSelectedQueryPoint({ lng, lat });
      setAnalysisStatus("querying");

      const loadingPopup = new maplibregl.Popup({ closeButton: false })
        .setLngLat([lng, lat])
        .setHTML(
          '<div class="text-[9px] text-[#00ff41] tracking-widest uppercase">Querying DEM...</div>',
        )
        .addTo(map);

      try {
        const result = await queryElevation(
          lng,
          lat,
          Math.max(12, Math.floor(map.getZoom())),
        );
        loadingPopup.remove();

        if (result) {
          const content = `
            <div class="panel p-3 bg-black/95 border border-white/10 text-[10px] hillshade-grain shadow-2xl">
              <div class="text-white/40 mb-1 font-mono">${formatDMS(lat, true)} ${formatDMS(lng, false)}</div>
              <div class="flex items-baseline gap-2 mb-1">
                <span class="text-[#00ff41] font-bold text-xs">▲ ${result.elevation_m.toFixed(1)}m</span>
                <span class="text-[8px] text-white/30 tracking-wider">NAVD88</span>
              </div>
              <div class="text-white/60 uppercase tracking-tighter">Slope Severity: <span class="text-[#00ff41]">${result.slope_deg?.toFixed(1) ?? "0.0"}° (${getSlopeLabel(result.slope_deg || 0)})</span></div>
            </div>
          `;
          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup()
            .setLngLat([lng, lat])
            .setHTML(content)
            .addTo(map);
        }
      } finally {
        setAnalysisStatus("idle");
      }
    },
    [map, setAnalysisStatus, setSelectedQueryPoint],
  );

  useEffect(() => {
    if (transectPoints.length === 0) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }
  }, [transectPoints]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const onClick = (event: maplibregl.MapMouseEvent) => {
      if (breakpoint === "mobile") {
        return;
      }

      const { lng, lat } = event.lngLat;

      if (activeTool !== "profile") {
        void handleElevationQuery(lng, lat);
        return;
      }

      if (transectPoints.length >= 2) {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        clearTransect();
        setTransectPoints([{ lng, lat }]);
        const nextMarker = createMarker(lng, lat, "A");
        nextMarker.addTo(map);
        markersRef.current.push(nextMarker);
        return;
      }

      const nextPoints = [...transectPoints, { lng, lat }];
      setTransectPoints(nextPoints);
      const nextMarker = createMarker(
        lng,
        lat,
        nextPoints.length === 1 ? "A" : "B",
      );
      nextMarker.addTo(map);
      markersRef.current.push(nextMarker);

      if (nextPoints.length === 2) {
        setAnalysisStatus("sampling");
        void sampleTransect(nextPoints[0], nextPoints[1])
          .then(setProfileData)
          .finally(() => setAnalysisStatus("idle"));
      }
    };

    const onTouchStart = (event: maplibregl.MapTouchEvent) => {
      if (breakpoint !== "mobile") {
        return;
      }

      longPressTimer.current = window.setTimeout(() => {
        const lngLat = map.unproject(event.point);
        void handleElevationQuery(lngLat.lng, lngLat.lat);
      }, 500);
    };

    const onTouchEnd = () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };

    map.on("click", onClick);
    map.on("touchstart", onTouchStart);
    map.on("touchend", onTouchEnd);

    return () => {
      map.off("click", onClick);
      map.off("touchstart", onTouchStart);
      map.off("touchend", onTouchEnd);
    };
  }, [
    activeTool,
    breakpoint,
    clearTransect,
    handleElevationQuery,
    map,
    setAnalysisStatus,
    setProfileData,
    setTransectPoints,
    transectPoints,
  ]);
}
