"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  DEFAULT_RENDER_LAYER_STATE,
  buildRenderStateManifest,
  inferTerrainProfile,
  type RenderLayerId,
  type RenderLayerState,
  type RenderStateManifest,
} from "@/domain/rendering";
import { useAnalysisState } from "@/app-shell/providers/AnalysisStateProvider";
import { useViewportState } from "@/app-shell/providers/ViewportStateProvider";

interface RenderStateValue {
  requestedLayers: RenderLayerState;
  activeLayerIds: RenderLayerId[];
  suppressedLayerIds: RenderLayerId[];
  terrainProfile: RenderStateManifest["terrain_profile"];
  warnings: RenderStateManifest["warnings"];
  renderStateManifest: RenderStateManifest;
}

interface RenderActionsValue {
  toggleRenderLayer: (layerId: RenderLayerId) => void;
  setRenderLayer: (layerId: RenderLayerId, enabled: boolean) => void;
}

type RenderAction =
  | { type: "toggle"; layerId: RenderLayerId }
  | { type: "set"; layerId: RenderLayerId; enabled: boolean };

const RenderStateContext = createContext<RenderStateValue | undefined>(
  undefined,
);
const RenderActionsContext = createContext<RenderActionsValue | undefined>(
  undefined,
);

function renderReducer(
  state: RenderLayerState,
  action: RenderAction,
): RenderLayerState {
  switch (action.type) {
    case "toggle":
      return {
        ...state,
        [action.layerId]: !state[action.layerId],
      };
    case "set":
      return {
        ...state,
        [action.layerId]: action.enabled,
      };
    default:
      return state;
  }
}

export function RenderStateProvider({ children }: { children: ReactNode }) {
  const [requestedLayers, dispatch] = useReducer(
    renderReducer,
    DEFAULT_RENDER_LAYER_STATE,
  );
  const { center, zoom, deviceClass, viewMode } = useViewportState();
  const { profileData } = useAnalysisState();

  const terrainProfile = inferTerrainProfile(center, zoom);
  const renderStateManifest = useMemo(() => {
    return buildRenderStateManifest({
      requestedLayers,
      deviceClass,
      terrainProfile,
      analysisProducts: {
        elevation_profile: Boolean(profileData && profileData.length > 1),
        los_check: requestedLayers.los ? "UNKNOWN" : false,
        fresnel_check: false,
        terrain_3d: viewMode === "3D",
      },
    });
  }, [deviceClass, profileData, requestedLayers, terrainProfile, viewMode]);

  const stateValue = useMemo(
    () => ({
      requestedLayers,
      activeLayerIds: renderStateManifest.layers_active.map((layer) => layer.id),
      suppressedLayerIds: renderStateManifest.layers_suppressed.map(
        (layer) => layer.id,
      ),
      terrainProfile,
      warnings: renderStateManifest.warnings,
      renderStateManifest,
    }),
    [renderStateManifest, requestedLayers, terrainProfile],
  );

  const actionsValue = useMemo(
    () => ({
      toggleRenderLayer: (layerId: RenderLayerId) =>
        dispatch({ type: "toggle", layerId }),
      setRenderLayer: (layerId: RenderLayerId, enabled: boolean) =>
        dispatch({ type: "set", layerId, enabled }),
    }),
    [],
  );

  return (
    <RenderStateContext.Provider value={stateValue}>
      <RenderActionsContext.Provider value={actionsValue}>
        {children}
      </RenderActionsContext.Provider>
    </RenderStateContext.Provider>
  );
}

export function useRenderState() {
  const context = useContext(RenderStateContext);
  if (!context) {
    throw new Error("useRenderState must be used within RenderStateProvider");
  }

  return context;
}

export function useRenderActions() {
  const context = useContext(RenderActionsContext);
  if (!context) {
    throw new Error("useRenderActions must be used within RenderStateProvider");
  }

  return context;
}
