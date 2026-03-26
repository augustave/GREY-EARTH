export const EARTH_ENGINE_PROJECT_ID_DEFAULT = "gen-lang-client-0431154803";
export const EARTH_ENGINE_SCRIPT_SRC =
  "https://ajax.googleapis.com/ajax/libs/earthengine/0.1.365/earthengine-api.min.js";
export const EARTH_ENGINE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/earthengine.readonly";
export const EARTH_ENGINE_SOURCE_ID = "earth-engine-imagery";
export const EARTH_ENGINE_LAYER_ID = "earth-engine-imagery";

const SAMPLE_TILE = {
  x: 17,
  y: 23,
  z: 5,
};

export interface EarthEngineClientConfig {
  clientId: string | null;
  projectId: string;
  isConfigured: boolean;
}

export interface EarthEngineMapDescriptor {
  mapid?: string;
  token?: string;
  urlFormat?: string;
  url_format?: string;
  formatTileUrl?: (x: number, y: number, z: number) => string;
}

export function getEarthEngineClientConfig(
  env = process.env,
): EarthEngineClientConfig {
  const clientId = env.NEXT_PUBLIC_EE_CLIENT_ID?.trim() || null;
  const projectId =
    env.NEXT_PUBLIC_EE_PROJECT?.trim() || EARTH_ENGINE_PROJECT_ID_DEFAULT;

  return {
    clientId,
    projectId,
    isConfigured: Boolean(clientId),
  };
}

export function buildEarthEngineTileTemplate(
  mapDescriptor: EarthEngineMapDescriptor,
  getTileUrl?: (
    mapId: EarthEngineMapDescriptor,
    x: number,
    y: number,
    z: number,
  ) => string,
): string | null {
  const urlFormat = mapDescriptor.urlFormat ?? mapDescriptor.url_format;
  if (typeof urlFormat === "string" && urlFormat.length > 0) {
    return urlFormat;
  }

  if (typeof mapDescriptor.formatTileUrl === "function") {
    return mapDescriptor.formatTileUrl(
      SAMPLE_TILE.x,
      SAMPLE_TILE.y,
      SAMPLE_TILE.z,
    )
      .replace(`/${SAMPLE_TILE.z}/${SAMPLE_TILE.x}/${SAMPLE_TILE.y}`, "/{z}/{x}/{y}")
      .replace(`z=${SAMPLE_TILE.z}`, "z={z}")
      .replace(`x=${SAMPLE_TILE.x}`, "x={x}")
      .replace(`y=${SAMPLE_TILE.y}`, "y={y}");
  }

  if (!getTileUrl) {
    return null;
  }

  const sampleTileUrl = getTileUrl(
    mapDescriptor,
    SAMPLE_TILE.x,
    SAMPLE_TILE.y,
    SAMPLE_TILE.z,
  );

  return sampleTileUrl
    .replace(`/${SAMPLE_TILE.z}/${SAMPLE_TILE.x}/${SAMPLE_TILE.y}`, "/{z}/{x}/{y}")
    .replace(`z=${SAMPLE_TILE.z}`, "z={z}")
    .replace(`x=${SAMPLE_TILE.x}`, "x={x}")
    .replace(`y=${SAMPLE_TILE.y}`, "y={y}");
}
