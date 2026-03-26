import { describe, expect, it } from "vitest";
import {
  EARTH_ENGINE_PROJECT_ID_DEFAULT,
  buildEarthEngineTileTemplate,
  getEarthEngineClientConfig,
} from "@/lib/earth-engine/browser";

describe("earth engine browser helpers", () => {
  it("falls back to the configured Earth Engine project default", () => {
    expect(getEarthEngineClientConfig({})).toEqual({
      clientId: null,
      projectId: EARTH_ENGINE_PROJECT_ID_DEFAULT,
      isConfigured: false,
    });
  });

  it("uses the configured OAuth client and project when present", () => {
    expect(
      getEarthEngineClientConfig({
        NEXT_PUBLIC_EE_CLIENT_ID: "client-id.apps.googleusercontent.com",
        NEXT_PUBLIC_EE_PROJECT: "custom-project",
      }),
    ).toEqual({
      clientId: "client-id.apps.googleusercontent.com",
      projectId: "custom-project",
      isConfigured: true,
    });
  });

  it("returns urlFormat when the descriptor already provides it", () => {
    expect(
      buildEarthEngineTileTemplate({
        urlFormat: "https://earthengine.example/tiles/{z}/{x}/{y}?token=abc",
      }),
    ).toBe("https://earthengine.example/tiles/{z}/{x}/{y}?token=abc");
  });

  it("derives a MapLibre tile template from a sampled Earth Engine URL", () => {
    const template = buildEarthEngineTileTemplate(
      { mapid: "map-id", token: "token" },
      () => "https://earthengine.example/tiles/5/17/23?token=abc",
    );

    expect(template).toBe(
      "https://earthengine.example/tiles/{z}/{x}/{y}?token=abc",
    );
  });
});
