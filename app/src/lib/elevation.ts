"use client";

// LRU Cache for tiles
const TILE_CACHE = new Map<string, ImageData>();
const MAX_CACHE_SIZE = 50;

interface ElevationResult {
  elevation_m: number;
  slope_deg: number | null;
  aspect_deg: number | null;
  source: "terrarium" | "cache";
}

/**
 * Converts Lng/Lat to slippy map tile coordinates
 */
export function getTileCoords(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const lat_rad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/**
 * Gets pixel coordinates within a tile (256x256)
 */
export function getPixelCoords(lng: number, lat: number, zoom: number, tx: number, ty: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const lat_rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI) / 2) * n;
  
  const px = Math.floor((x - tx) * 256);
  const py = Math.floor((y - ty) * 256);
  
  return { px, py };
}

/**
 * Decodes elevation from Terrarium RGB
 * height = (R * 256 + G + B / 256) - 32768
 */
export function decodeElevation(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

export async function fetchTile(x: number, y: number, z: number): Promise<ImageData | null> {
  const key = `${z}/${x}/${y}`;
  if (TILE_CACHE.has(key)) {
    return TILE_CACHE.get(key)!;
  }

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 256, 256);
    
    // Manage cache
    if (TILE_CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = TILE_CACHE.keys().next().value;
      if (firstKey !== undefined) TILE_CACHE.delete(firstKey);
    }
    TILE_CACHE.set(key, data);
    
    return data;
  } catch (e) {
    console.error(`Failed to fetch elevation tile ${key}`, e);
    return null;
  }
}

export async function queryElevation(lng: number, lat: number, zoom: number = 15): Promise<ElevationResult | null> {
  const { x, y } = getTileCoords(lng, lat, zoom);
  const data = await fetchTile(x, y, zoom);
  
  if (!data) return null;
  
  const { px, py } = getPixelCoords(lng, lat, zoom, x, y);
  
  // Clamp pixel coords
  const cpx = Math.max(0, Math.min(255, px));
  const cpy = Math.max(0, Math.min(255, py));
  
  const idx = (cpy * 256 + cpx) * 4;
  const r = data.data[idx];
  const g = data.data[idx + 1];
  const b = data.data[idx + 2];
  
  const elevation = decodeElevation(r, g, b);

  // Compute slope using finite difference if possible
  // We need 4 neighbors. For simplicity, we just use the current tile.
  let slope_deg: number | null = null;
  if (cpx > 0 && cpx < 255 && cpy > 0 && cpy < 255) {
    const res = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom); // approx meters per pixel
    
    const getElev = (ox: number, oy: number) => {
      const i = ((cpy + oy) * 256 + (cpx + ox)) * 4;
      return decodeElevation(data.data[i], data.data[i+1], data.data[i+2]);
    };
    
    const dzdx = (getElev(1, 0) - getElev(-1, 0)) / (2 * res);
    const dzdy = (getElev(0, 1) - getElev(0, -1)) / (2 * res);
    const slope = Math.sqrt(dzdx*dzdx + dzdy*dzdy);
    slope_deg = Math.atan(slope) * 180 / Math.PI;
  }

  return {
    elevation_m: elevation,
    slope_deg,
    aspect_deg: null,
    source: TILE_CACHE.has(`${zoom}/${x}/${y}`) ? "cache" : "terrarium",
  };
}

/**
 * Samples elevation along a transect between two points
 */
export async function sampleTransect(
  start: { lng: number; lat: number },
  end: { lng: number; lat: number },
  samples: number = 300
) {
  const profile: { distance: number; elevation: number }[] = [];
  
  // Calculate total distance (Haversine approx)
  const R = 6371e3; // Earth radius in meters
  const φ1 = start.lat * Math.PI / 180;
  const φ2 = end.lat * Math.PI / 180;
  const Δφ = (end.lat - start.lat) * Math.PI / 180;
  const Δλ = (end.lng - start.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const totalDistance = R * c;

  for (let i = 0; i < samples; i++) {
    const fraction = i / (samples - 1);
    const lng = start.lng + (end.lng - start.lng) * fraction;
    const lat = start.lat + (end.lat - start.lat) * fraction;
    
    const result = await queryElevation(lng, lat, 14); // Use zoom 14 for regional context
    if (result) {
      profile.push({
        distance: totalDistance * fraction,
        elevation: result.elevation_m
      });
    }
  }

  return profile;
}

export function getSlopeLabel(deg: number): string {
  if (deg < 3) return "FLAT";
  if (deg < 10) return "GENTLE";
  if (deg < 20) return "MODERATE";
  if (deg < 30) return "STEEP";
  if (deg < 45) return "SEVERE";
  return "CLIFF";
}
