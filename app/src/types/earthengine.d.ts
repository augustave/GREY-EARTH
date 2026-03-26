export interface EarthEngineMapDescriptor {
  mapid?: string;
  token?: string;
  urlFormat?: string;
  url_format?: string;
  formatTileUrl?: (x: number, y: number, z: number) => string;
}

export interface EarthEngineMapOptions {
  min?: number;
  max?: number;
  gamma?: number | number[];
  bands?: string[];
  format?: string;
}

export interface EarthEngineImage {
  divide(value: number): EarthEngineImage;
  select(bands: string[]): EarthEngineImage;
  getMap(
    visParams: EarthEngineMapOptions,
    callback: (mapDescriptor: EarthEngineMapDescriptor) => void,
  ): void;
}

export interface EarthEngineImageCollection {
  filterBounds(bounds: unknown): EarthEngineImageCollection;
  filterDate(start: string, end: string): EarthEngineImageCollection;
  filter(filter: unknown): EarthEngineImageCollection;
  map(
    mapper: (image: EarthEngineImage) => EarthEngineImage,
  ): EarthEngineImageCollection;
  median(): EarthEngineImage;
}

export interface EarthEngineApi {
  ImageCollection: (assetId: string) => EarthEngineImageCollection;
  Geometry: {
    Rectangle: (coords: [number, number, number, number]) => unknown;
  };
  Filter: {
    lte: (property: string, value: number) => unknown;
  };
  initialize: (
    baseUrl?: string | null,
    tileUrl?: string | null,
    successCallback?: () => void,
    errorCallback?: (error: unknown) => void,
    xsrfToken?: string | null,
    project?: string | null,
  ) => void;
  data: {
    authenticateViaOauth: (
      clientId: string,
      successCallback: () => void,
      errorCallback?: (error: unknown) => void,
      extraScopes?: string[] | null,
      onImmediateFailed?: () => void,
      suppressDefaultScopes?: boolean,
    ) => void;
    authenticateViaPopup: (
      successCallback: () => void,
      errorCallback?: (error: unknown) => void,
      extraScopes?: string[] | null,
      suppressDefaultScopes?: boolean,
    ) => void;
    getTileUrl: (
      mapDescriptor: EarthEngineMapDescriptor,
      x: number,
      y: number,
      z: number,
    ) => string;
  };
}

declare global {
  interface Window {
    ee?: EarthEngineApi;
  }
}

export {};
