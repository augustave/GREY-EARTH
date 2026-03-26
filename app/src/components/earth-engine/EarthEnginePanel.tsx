"use client";

import {
  useEarthEngineActions,
  useEarthEngineState,
} from "@/app-shell/hooks";

function statusTone(status: ReturnType<typeof useEarthEngineState>["status"]) {
  switch (status) {
    case "ready":
      return "bg-sigint-green";
    case "error":
    case "unconfigured":
      return "bg-sigint-red";
    case "authenticating":
    case "loading":
      return "bg-sigint-amber";
    default:
      return "bg-white/20";
  }
}

export default function EarthEnginePanel() {
  const { signIn } = useEarthEngineActions();
  const { error, imageryLabel, isConfigured, projectId, status } =
    useEarthEngineState();

  return (
    <div className="panel-hardened w-60 overflow-hidden">
      <div className="panel-header-tactical justify-between">
        <span>Earth Engine</span>
        <div className="flex items-center gap-2">
          <span className={`status-indicator ${statusTone(status)}`} />
          <span className="opacity-50 font-mono text-[8px]">{status}</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 text-[9px] uppercase tracking-[0.08em] text-slate-300">
        <div className="text-[8px] text-slate-400 break-all">
          {imageryLabel ?? "Awaiting authenticated imagery session"}
        </div>
        <div className="text-[8px] text-slate-500 break-all">
          Project: {projectId}
        </div>
        {error ? (
          <div className="text-[8px] text-sigint-red normal-case tracking-normal">
            {error}
          </div>
        ) : null}
        {status !== "ready" ? (
          <button
            type="button"
            onClick={() => void signIn()}
            disabled={!isConfigured || status === "authenticating" || status === "loading"}
            className={`btn-tactical flex items-center justify-between ${
              status === "authenticating" || status === "loading" ? "active" : ""
            }`}
          >
            <span>
              {status === "authenticating" || status === "loading"
                ? "Linking Session"
                : "Sign In To Imagery"}
            </span>
            <span className="opacity-50 font-mono text-[8px]">EE</span>
          </button>
        ) : (
          <div className="text-[8px] text-sigint-green">
            Authenticated read-only imagery is active.
          </div>
        )}
      </div>
    </div>
  );
}
