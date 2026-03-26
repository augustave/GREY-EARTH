import type { StyleSpecification } from "maplibre-gl";

export const DATUM_LNG = -73.9629;
export const DATUM_LAT = 40.6851;

export function createBaseStyle(): StyleSpecification {
  return {
    version: 8,
    name: "SIGINT-TERRAIN Dark",
    sources: {
      "terrain-rgb": {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 15,
      },
      "terrain-hillshade-src": {
        type: "raster",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/normal/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 15,
      },
      "transect-source": {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
      "denied-zones": {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [-74.05, 40.65],
                    [-74.05, 40.7],
                    [-74.0, 40.7],
                    [-74.0, 40.65],
                    [-74.05, 40.65],
                  ],
                ],
              },
              properties: {},
            },
          ],
        },
      },
    },
    layers: [
      {
        id: "terrain-substrate",
        type: "background",
        paint: {
          "background-color": "#0a0c0b",
          "background-opacity": 1,
        },
      },
      {
        id: "hillshade",
        type: "raster",
        source: "terrain-hillshade-src",
        paint: {
          "raster-opacity": 0.62,
          "raster-brightness-min": 0.12,
          "raster-brightness-max": 0.82,
          "raster-contrast": 0.42,
          "raster-saturation": -1,
        },
      },
      {
        id: "transect-line",
        type: "line",
        source: "transect-source",
        paint: {
          "line-color": "#00ff41",
          "line-width": 1.5,
          "line-dasharray": [4, 2],
        },
      },
      {
        id: "denied",
        type: "fill",
        source: "denied-zones",
        layout: { visibility: "none" },
        paint: {
          "fill-color": "rgba(255, 45, 45, 0.15)",
          "fill-outline-color": "rgba(255, 45, 45, 0.3)",
        },
      },
      {
        id: "denied-outline",
        type: "line",
        source: "denied-zones",
        layout: { visibility: "none" },
        paint: {
          "line-color": "rgba(255, 45, 45, 0.45)",
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
      },
    ],
    terrain: {
      source: "terrain-rgb",
      exaggeration: 3,
    },
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  };
}
