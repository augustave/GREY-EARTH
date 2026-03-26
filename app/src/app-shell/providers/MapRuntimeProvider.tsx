"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type maplibregl from "maplibre-gl";

interface MapRuntimeStateValue {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

interface MapRuntimeActionsValue {
  setMap: (map: maplibregl.Map | null) => void;
  setIsLoaded: (isLoaded: boolean) => void;
}

const MapRuntimeStateContext = createContext<MapRuntimeStateValue | undefined>(
  undefined,
);
const MapRuntimeActionsContext = createContext<
  MapRuntimeActionsValue | undefined
>(undefined);

export function MapRuntimeProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const stateValue = useMemo(() => ({ map, isLoaded }), [isLoaded, map]);
  const actionsValue = useMemo(() => ({ setMap, setIsLoaded }), []);

  return (
    <MapRuntimeStateContext.Provider value={stateValue}>
      <MapRuntimeActionsContext.Provider value={actionsValue}>
        {children}
      </MapRuntimeActionsContext.Provider>
    </MapRuntimeStateContext.Provider>
  );
}

export function useMapRuntime() {
  const context = useContext(MapRuntimeStateContext);
  if (!context) {
    throw new Error("useMapRuntime must be used within MapRuntimeProvider");
  }

  return context;
}

export function useMapRuntimeActions() {
  const context = useContext(MapRuntimeActionsContext);
  if (!context) {
    throw new Error(
      "useMapRuntimeActions must be used within MapRuntimeProvider",
    );
  }

  return context;
}
