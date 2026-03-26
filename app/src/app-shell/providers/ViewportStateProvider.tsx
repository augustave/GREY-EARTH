"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBreakpoint, type Breakpoint } from "@/hooks/useBreakpoint";
import {
  deriveDeviceClass,
  type DeviceClass,
  type ViewMode,
} from "@/domain/rendering";

export interface ViewportCenter {
  lng: number;
  lat: number;
}

export interface ViewportSnapshot {
  center: ViewportCenter;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface ViewportStateValue {
  center: ViewportCenter;
  zoom: number;
  pitch: number;
  bearing: number;
  breakpoint: Breakpoint;
  deviceClass: DeviceClass;
  viewMode: ViewMode;
}

interface ViewportActionsValue {
  setViewMode: (mode: ViewMode) => void;
  updateViewport: (snapshot: Partial<ViewportSnapshot>) => void;
}

const DEFAULT_CENTER: ViewportCenter = {
  lng: -73.9629,
  lat: 40.6851,
};

const ViewportStateContext = createContext<ViewportStateValue | undefined>(
  undefined,
);
const ViewportActionsContext = createContext<ViewportActionsValue | undefined>(
  undefined,
);

export function ViewportStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const breakpoint = useBreakpoint();
  const [center, setCenter] = useState<ViewportCenter>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(11.5);
  const [pitch, setPitch] = useState(45);
  const [bearing, setBearing] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("2D");

  const updateViewport = useCallback((snapshot: Partial<ViewportSnapshot>) => {
    if (snapshot.center) {
      setCenter(snapshot.center);
    }
    if (typeof snapshot.zoom === "number") {
      setZoom(snapshot.zoom);
    }
    if (typeof snapshot.pitch === "number") {
      setPitch(snapshot.pitch);
    }
    if (typeof snapshot.bearing === "number") {
      setBearing(snapshot.bearing);
    }
  }, []);

  const deviceClass = deriveDeviceClass(breakpoint);

  const stateValue = useMemo(
    () => ({
      center,
      zoom,
      pitch,
      bearing,
      breakpoint,
      deviceClass,
      viewMode,
    }),
    [bearing, breakpoint, center, deviceClass, pitch, viewMode, zoom],
  );

  const actionsValue = useMemo(
    () => ({
      setViewMode,
      updateViewport,
    }),
    [updateViewport],
  );

  return (
    <ViewportStateContext.Provider value={stateValue}>
      <ViewportActionsContext.Provider value={actionsValue}>
        {children}
      </ViewportActionsContext.Provider>
    </ViewportStateContext.Provider>
  );
}

export function useViewportState() {
  const context = useContext(ViewportStateContext);
  if (!context) {
    throw new Error("useViewportState must be used within ViewportStateProvider");
  }

  return context;
}

export function useViewportActions() {
  const context = useContext(ViewportActionsContext);
  if (!context) {
    throw new Error(
      "useViewportActions must be used within ViewportStateProvider",
    );
  }

  return context;
}
