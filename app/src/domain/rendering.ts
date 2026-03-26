import type { Breakpoint } from "@/hooks/useBreakpoint";

export type RenderLayerId =
  | "hillshade"
  | "contours"
  | "slope"
  | "hypso"
  | "denied"
  | "los";

export type ViewMode = "2D" | "3D";

export type DeviceClass =
  | "desktop_analyst"
  | "field_tablet"
  | "degraded_edge_device";

export type TerrainProfileName =
  | "standard_regional"
  | "nyc_littoral_low_relief"
  | "alpine_high_delta_z"
  | "urban_canyon_lidar";

export type RenderWarningCode =
  | "bathymetry_merged"
  | "bathymetry_unavailable"
  | "urban_lidar_filter_applied"
  | "LOS_UNSAFE_DSM_CONTAMINATION"
  | "BATHYMETRY_REQUIRED_FOR_WATER_CROSSING"
  | "FEED_FRESHNESS_UNDEFINED"
  | "REDUCED_SEMANTIC_FIDELITY"
  | "Z_EXAGGERATION_CLAMPED";

export interface LayerSpec {
  id: RenderLayerId;
  order: number;
  blend: "normal" | "overlay" | "multiply" | "screen";
  opacity: number;
  tier: "base" | "operational" | "analysis";
  reason?: string;
}

export interface AnalysisProducts {
  elevation_profile: boolean;
  los_check: boolean | "LOS_CLEAR" | "LOS_MASKED" | "UNKNOWN";
  fresnel_check: boolean;
  terrain_3d: boolean;
}

export interface RenderStateManifest {
  terrain_profile: TerrainProfileName;
  vertical_datum: string;
  water_crossing: boolean;
  z_exaggeration: number;
  device_budget: DeviceClass;
  layers_active: LayerSpec[];
  layers_suppressed: LayerSpec[];
  warnings: RenderWarningCode[];
  analysis_products: AnalysisProducts;
}

export type RenderLayerState = Record<RenderLayerId, boolean>;

export interface ViewportContextInput {
  widthPx?: number;
  heightPx?: number;
  zoom: number;
}

interface LayerDefinition {
  id: RenderLayerId;
  order: number;
  blend: LayerSpec["blend"];
  opacity: number;
  tier: LayerSpec["tier"];
  countsTowardBudget: boolean;
  currentlySupported: boolean;
}

const MANHATTAN_BBOX = {
  minLat: 40.35,
  maxLat: 41.1,
  minLng: -74.35,
  maxLng: -73.45,
};

export const CANONICAL_LAYER_ORDER: RenderLayerId[] = [
  "hillshade",
  "contours",
  "slope",
  "hypso",
  "denied",
  "los",
];

export const DEFAULT_RENDER_LAYER_STATE: RenderLayerState = {
  hillshade: true,
  contours: false,
  slope: false,
  hypso: false,
  denied: false,
  los: false,
};

export const LAYER_LABELS: Record<RenderLayerId, string> = {
  hillshade: "Relief (Hillshade)",
  contours: "Isolines (5m)",
  slope: "Slope Analysis",
  hypso: "Hypsometric",
  denied: "Denied Zones",
  los: "Line of Sight",
};

const LAYER_DEFINITIONS: LayerDefinition[] = [
  {
    id: "hillshade",
    order: 1,
    blend: "overlay",
    opacity: 0.45,
    tier: "base",
    countsTowardBudget: true,
    currentlySupported: true,
  },
  {
    id: "contours",
    order: 2,
    blend: "multiply",
    opacity: 1,
    tier: "operational",
    countsTowardBudget: true,
    currentlySupported: false,
  },
  {
    id: "slope",
    order: 3,
    blend: "multiply",
    opacity: 0.6,
    tier: "operational",
    countsTowardBudget: true,
    currentlySupported: false,
  },
  {
    id: "hypso",
    order: 4,
    blend: "multiply",
    opacity: 0.4,
    tier: "operational",
    countsTowardBudget: true,
    currentlySupported: false,
  },
  {
    id: "denied",
    order: 5,
    blend: "normal",
    opacity: 1,
    tier: "operational",
    countsTowardBudget: false,
    currentlySupported: true,
  },
  {
    id: "los",
    order: 6,
    blend: "normal",
    opacity: 1,
    tier: "analysis",
    countsTowardBudget: false,
    currentlySupported: false,
  },
];

function maxTextureLayers(deviceClass: DeviceClass): number {
  switch (deviceClass) {
    case "field_tablet":
      return 3;
    case "degraded_edge_device":
      return 2;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

function createLayerSpec(
  definition: LayerDefinition,
  reason?: string,
): LayerSpec {
  return {
    id: definition.id,
    order: definition.order,
    blend: definition.blend,
    opacity: definition.opacity,
    tier: definition.tier,
    ...(reason ? { reason } : {}),
  };
}

export interface CompileLayerStackInput {
  requestedLayers: RenderLayerState;
  deviceClass: DeviceClass;
  terrainProfile: TerrainProfileName;
  analysisProducts: AnalysisProducts;
  supportedLayerIds?: RenderLayerId[];
}

export interface CompileLayerStackResult {
  layersActive: LayerSpec[];
  layersSuppressed: LayerSpec[];
  warnings: RenderWarningCode[];
}

export function deriveDeviceClass(
  breakpoint: Breakpoint,
  viewportContext?: Pick<ViewportContextInput, "widthPx">,
): DeviceClass {
  if (breakpoint === "desktop") {
    return "desktop_analyst";
  }

  if (breakpoint === "tablet") {
    return "field_tablet";
  }

  if ((viewportContext?.widthPx ?? 0) >= 768) {
    return "field_tablet";
  }

  return "degraded_edge_device";
}

export function inferTerrainProfile(center: {
  lng: number;
  lat: number;
}, zoom: number): TerrainProfileName {
  const inNycViewport =
    center.lat >= MANHATTAN_BBOX.minLat &&
    center.lat <= MANHATTAN_BBOX.maxLat &&
    center.lng >= MANHATTAN_BBOX.minLng &&
    center.lng <= MANHATTAN_BBOX.maxLng;

  if (inNycViewport && zoom >= 16) {
    return "urban_canyon_lidar";
  }

  return inNycViewport ? "nyc_littoral_low_relief" : "standard_regional";
}

export function getTerrainProfileSettings(profile: TerrainProfileName): {
  zExaggeration: number;
  contourIntervalM: number;
  hillshadeAltitudeDeg: number;
} {
  switch (profile) {
    case "nyc_littoral_low_relief":
      return {
        zExaggeration: 3,
        contourIntervalM: 5,
        hillshadeAltitudeDeg: 35,
      };
    case "alpine_high_delta_z":
      return {
        zExaggeration: 1.25,
        contourIntervalM: 10,
        hillshadeAltitudeDeg: 45,
      };
    case "urban_canyon_lidar":
      return {
        zExaggeration: 2,
        contourIntervalM: 10,
        hillshadeAltitudeDeg: 40,
      };
    default:
      return {
        zExaggeration: 2,
        contourIntervalM: 10,
        hillshadeAltitudeDeg: 45,
      };
  }
}

export function compileLayerStack({
  requestedLayers,
  deviceClass,
  analysisProducts,
  supportedLayerIds,
}: CompileLayerStackInput): CompileLayerStackResult {
  const layersActive: LayerSpec[] = [];
  const layersSuppressed: LayerSpec[] = [];
  const warnings = new Set<RenderWarningCode>();
  const textureBudget = maxTextureLayers(deviceClass);
  const supportedLayerSet = new Set(
    supportedLayerIds ??
      LAYER_DEFINITIONS.filter((definition) => definition.currentlySupported).map(
        (definition) => definition.id,
      ),
  );
  let activeTextureCount = 0;

  for (const definition of LAYER_DEFINITIONS) {
    if (!requestedLayers[definition.id]) {
      layersSuppressed.push(createLayerSpec(definition, "operator_disabled"));
      continue;
    }

    if (definition.id === "los" && analysisProducts.los_check === false) {
      layersSuppressed.push(
        createLayerSpec(definition, "analysis_product_unavailable"),
      );
      continue;
    }

    if (!supportedLayerSet.has(definition.id)) {
      layersSuppressed.push(createLayerSpec(definition, "not_yet_available"));
      continue;
    }

    if (
      definition.countsTowardBudget &&
      activeTextureCount >= textureBudget
    ) {
      layersSuppressed.push(createLayerSpec(definition, "device_budget"));
      warnings.add("REDUCED_SEMANTIC_FIDELITY");
      continue;
    }

    layersActive.push(createLayerSpec(definition));

    if (definition.countsTowardBudget) {
      activeTextureCount += 1;
    }
  }

  return {
    layersActive,
    layersSuppressed,
    warnings: [...warnings],
  };
}

export interface BuildRenderManifestInput {
  requestedLayers: RenderLayerState;
  deviceClass: DeviceClass;
  terrainProfile: TerrainProfileName;
  analysisProducts: AnalysisProducts;
}

export function buildRenderStateManifest({
  requestedLayers,
  deviceClass,
  terrainProfile,
  analysisProducts,
}: BuildRenderManifestInput): RenderStateManifest {
  const compiled = compileLayerStack({
    requestedLayers,
    deviceClass,
    terrainProfile,
    analysisProducts,
  });
  const terrainProfileSettings = getTerrainProfileSettings(terrainProfile);

  return {
    terrain_profile: terrainProfile,
    vertical_datum: "NAVD88",
    water_crossing: false,
    z_exaggeration: terrainProfileSettings.zExaggeration,
    device_budget: deviceClass,
    layers_active: compiled.layersActive,
    layers_suppressed: compiled.layersSuppressed,
    warnings: compiled.warnings,
    analysis_products: analysisProducts,
  };
}
