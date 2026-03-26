"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EarthEngineApi, EarthEngineImage } from "@/types/earthengine";
import {
  EARTH_ENGINE_PROJECT_ID_DEFAULT,
  EARTH_ENGINE_READONLY_SCOPE,
  EARTH_ENGINE_SCRIPT_SRC,
  buildEarthEngineTileTemplate,
  getEarthEngineClientConfig,
} from "@/lib/earth-engine/browser";

export type EarthEngineStatus =
  | "unconfigured"
  | "loading"
  | "idle"
  | "authenticating"
  | "ready"
  | "error";

interface EarthEngineStateValue {
  status: EarthEngineStatus;
  projectId: string;
  tileUrlTemplate: string | null;
  imageryLabel: string | null;
  error: string | null;
  isConfigured: boolean;
  isImageryActive: boolean;
}

interface EarthEngineActionsValue {
  signIn: () => Promise<void>;
}

const EarthEngineStateContext = createContext<
  EarthEngineStateValue | undefined
>(undefined);
const EarthEngineActionsContext = createContext<
  EarthEngineActionsValue | undefined
>(undefined);

const NYC_AOI: [number, number, number, number] = [-74.45, 40.3, -73.3, 41.15];
const EARTH_ENGINE_IMAGERY_LABEL = "Earth Engine / Sentinel-2 True Color";

function formatEarthEngineError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Earth Engine authentication failed.";
}

async function loadEarthEngineApi() {
  if (typeof window === "undefined") {
    throw new Error("Earth Engine is only available in the browser.");
  }

  if (window.ee) {
    return window.ee;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-earth-engine-api="true"]',
  );

  if (existingScript) {
    if (window.ee) {
      return window.ee;
    }

    await new Promise<void>((resolve, reject) => {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Earth Engine API script.")),
        { once: true },
      );
    });

    if (!window.ee) {
      throw new Error("Earth Engine API loaded without exposing window.ee.");
    }

    return window.ee;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EARTH_ENGINE_SCRIPT_SRC;
    script.async = true;
    script.dataset.earthEngineApi = "true";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Earth Engine API script.")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  if (!window.ee) {
    throw new Error("Earth Engine API loaded without exposing window.ee.");
  }

  return window.ee;
}

function buildNycTrueColorComposite(ee: EarthEngineApi): EarthEngineImage {
  return ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(ee.Geometry.Rectangle(NYC_AOI))
    .filterDate("2024-01-01", "2025-12-31")
    .filter(ee.Filter.lte("CLOUDY_PIXEL_PERCENTAGE", 20))
    .map((image) => image.divide(10000))
    .median()
    .select(["B4", "B3", "B2"]);
}

async function initializeEarthEngineImagery(ee: EarthEngineApi, projectId: string) {
  await new Promise<void>((resolve, reject) => {
    ee.initialize(
      null,
      null,
      () => resolve(),
      (error) => reject(error),
      null,
      projectId,
    );
  });

  const mapDescriptor = await new Promise<import("@/types/earthengine").EarthEngineMapDescriptor>(
    (resolve, reject) => {
      buildNycTrueColorComposite(ee).getMap(
        {
          bands: ["B4", "B3", "B2"],
          min: 0.02,
          max: 0.3,
          gamma: 1.1,
          format: "jpg",
        },
        (nextDescriptor) => {
          if (nextDescriptor) {
            resolve(nextDescriptor);
            return;
          }

          reject(new Error("Earth Engine did not return imagery tiles."));
        },
      );
    },
  );

  const tileUrlTemplate = buildEarthEngineTileTemplate(
    mapDescriptor,
    ee.data.getTileUrl,
  );

  if (!tileUrlTemplate) {
    throw new Error("Earth Engine tile URL format could not be derived.");
  }

  return {
    imageryLabel: EARTH_ENGINE_IMAGERY_LABEL,
    tileUrlTemplate,
  };
}

export function EarthEngineProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => getEarthEngineClientConfig(), []);
  const [status, setStatus] = useState<EarthEngineStatus>(
    config.isConfigured ? "loading" : "unconfigured",
  );
  const [tileUrlTemplate, setTileUrlTemplate] = useState<string | null>(null);
  const [imageryLabel, setImageryLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    config.isConfigured
      ? null
      : "Set NEXT_PUBLIC_EE_CLIENT_ID to enable Earth Engine sign-in.",
  );

  const finalizeSession = useCallback(async () => {
    const ee = await loadEarthEngineApi();
    const imagery = await initializeEarthEngineImagery(ee, config.projectId);
    setTileUrlTemplate(imagery.tileUrlTemplate);
    setImageryLabel(imagery.imageryLabel);
    setError(null);
    setStatus("ready");
  }, [config.projectId]);

  useEffect(() => {
    if (!config.isConfigured) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const ee = await loadEarthEngineApi();
        if (cancelled) {
          return;
        }

        ee.data.authenticateViaOauth(
          config.clientId as string,
          () => {
            if (cancelled) {
              return;
            }

            void finalizeSession().catch((nextError) => {
              if (cancelled) {
                return;
              }

              setStatus("error");
              setTileUrlTemplate(null);
              setImageryLabel(null);
              setError(formatEarthEngineError(nextError));
            });
          },
          (authError) => {
            if (cancelled) {
              return;
            }

            setStatus("error");
            setTileUrlTemplate(null);
            setImageryLabel(null);
            setError(formatEarthEngineError(authError));
          },
          [EARTH_ENGINE_READONLY_SCOPE],
          () => {
            if (cancelled) {
              return;
            }

            setStatus("idle");
            setTileUrlTemplate(null);
            setImageryLabel(null);
            setError(null);
          },
          true,
        );
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setTileUrlTemplate(null);
        setImageryLabel(null);
        setError(formatEarthEngineError(nextError));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.clientId, config.isConfigured, finalizeSession]);

  const signIn = useCallback(async () => {
    if (!config.isConfigured) {
      setStatus("unconfigured");
      setError("Set NEXT_PUBLIC_EE_CLIENT_ID to enable Earth Engine sign-in.");
      return;
    }

    setStatus("authenticating");
    setError(null);

    try {
      const ee = await loadEarthEngineApi();
      await new Promise<void>((resolve, reject) => {
        ee.data.authenticateViaPopup(
          () => resolve(),
          (popupError) => reject(popupError),
          [EARTH_ENGINE_READONLY_SCOPE],
          true,
        );
      });

      await finalizeSession();
    } catch (nextError) {
      setStatus("error");
      setTileUrlTemplate(null);
      setImageryLabel(null);
      setError(formatEarthEngineError(nextError));
    }
  }, [config.isConfigured, finalizeSession]);

  const stateValue = useMemo(
    () => ({
      status,
      projectId: config.projectId || EARTH_ENGINE_PROJECT_ID_DEFAULT,
      tileUrlTemplate,
      imageryLabel,
      error,
      isConfigured: config.isConfigured,
      isImageryActive: status === "ready" && Boolean(tileUrlTemplate),
    }),
    [config.isConfigured, config.projectId, error, imageryLabel, status, tileUrlTemplate],
  );

  const actionsValue = useMemo(
    () => ({
      signIn,
    }),
    [signIn],
  );

  return (
    <EarthEngineStateContext.Provider value={stateValue}>
      <EarthEngineActionsContext.Provider value={actionsValue}>
        {children}
      </EarthEngineActionsContext.Provider>
    </EarthEngineStateContext.Provider>
  );
}

export function useEarthEngineState() {
  const context = useContext(EarthEngineStateContext);
  if (!context) {
    throw new Error(
      "useEarthEngineState must be used within EarthEngineProvider",
    );
  }

  return context;
}

export function useEarthEngineActions() {
  const context = useContext(EarthEngineActionsContext);
  if (!context) {
    throw new Error(
      "useEarthEngineActions must be used within EarthEngineProvider",
    );
  }

  return context;
}
