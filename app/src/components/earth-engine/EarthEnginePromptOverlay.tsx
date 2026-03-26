"use client";

import {
  useEarthEngineActions,
  useEarthEngineState,
} from "@/app-shell/hooks";

export default function EarthEnginePromptOverlay() {
  const { signIn } = useEarthEngineActions();
  const { error, isConfigured, projectId, status } = useEarthEngineState();

  if (status === "ready") {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-6">
      <div className="panel-hardened pointer-events-auto w-full max-w-md overflow-hidden">
        <div className="panel-header-tactical justify-between">
          <span>Earth Engine Imagery</span>
          <span className="opacity-50 font-mono text-[8px]">{status}</span>
        </div>
        <div className="p-5 flex flex-col gap-4 text-slate-200">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
              The live terrain base is available.
            </p>
            <p className="text-[13px] leading-relaxed text-slate-400">
              Sign in with the Google account that has Earth Engine access for
              project <span className="text-slate-200">{projectId}</span>.
            </p>
          </div>

          {error ? (
            <div className="text-[12px] text-sigint-red leading-relaxed">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void signIn()}
            disabled={
              !isConfigured || status === "authenticating" || status === "loading"
            }
            className={`btn-tactical active flex items-center justify-between text-[10px] ${
              status === "authenticating" || status === "loading"
                ? "opacity-80"
                : ""
            }`}
          >
            <span>
              {status === "authenticating" || status === "loading"
                ? "Opening Google Sign-In"
                : "Sign In To Google Earth Engine"}
            </span>
            <span className="opacity-60 font-mono text-[8px]">EE</span>
          </button>

          <p className="text-[11px] leading-relaxed text-slate-500">
            The Google popup only opens after a click. If nothing appears, check
            the browser popup blocker for this site.
          </p>
        </div>
      </div>
    </div>
  );
}
