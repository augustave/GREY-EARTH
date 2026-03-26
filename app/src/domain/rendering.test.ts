import { describe, expect, it } from "vitest";
import {
  compileLayerStack,
  inferTerrainProfile,
  deriveDeviceClass,
} from "@/domain/rendering";

describe("rendering domain", () => {
  it("keeps canonical active layer ordering stable", () => {
    const result = compileLayerStack({
      requestedLayers: {
        hillshade: true,
        contours: false,
        slope: false,
        hypso: false,
        denied: true,
        los: false,
      },
      deviceClass: "desktop_analyst",
      terrainProfile: "nyc_littoral_low_relief",
      analysisProducts: {
        elevation_profile: false,
        los_check: false,
        fresnel_check: false,
        terrain_3d: false,
      },
    });

    expect(result.layersActive.map((layer) => layer.id)).toEqual([
      "hillshade",
      "denied",
    ]);
  });

  it("suppresses layers beyond the field-tablet texture budget with reasons", () => {
    const result = compileLayerStack({
      requestedLayers: {
        hillshade: true,
        contours: true,
        slope: true,
        hypso: true,
        denied: false,
        los: false,
      },
      deviceClass: "field_tablet",
      terrainProfile: "standard_regional",
      analysisProducts: {
        elevation_profile: false,
        los_check: false,
        fresnel_check: false,
        terrain_3d: false,
      },
      supportedLayerIds: ["hillshade", "contours", "slope", "hypso"],
    });

    expect(result.layersActive.map((layer) => layer.id)).toEqual([
      "hillshade",
      "contours",
      "slope",
    ]);
    expect(result.layersSuppressed).toContainEqual(
      expect.objectContaining({
        id: "hypso",
        reason: "device_budget",
      }),
    );
  });

  it("defaults NYC area of interest to the littoral terrain profile", () => {
    expect(inferTerrainProfile({ lng: -73.9629, lat: 40.6851 }, 11.5)).toBe(
      "nyc_littoral_low_relief",
    );
  });

  it("maps breakpoints to bundle-aligned device classes", () => {
    expect(deriveDeviceClass("desktop")).toBe("desktop_analyst");
    expect(deriveDeviceClass("tablet")).toBe("field_tablet");
    expect(deriveDeviceClass("mobile")).toBe("degraded_edge_device");
  });
});
