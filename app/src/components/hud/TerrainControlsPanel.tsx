"use client";

import {
  useRenderActions,
  useRenderState,
  useViewportActions,
  useViewportState,
} from "@/app-shell/hooks";
import {
  LAYER_LABELS,
  type RenderLayerId,
} from "@/domain/rendering";

const SURFACED_LAYERS: RenderLayerId[] = [
  "hillshade",
  "contours",
  "slope",
  "denied",
];

export default function TerrainControlsPanel() {
  const { viewMode } = useViewportState();
  const { setViewMode } = useViewportActions();
  const { requestedLayers, renderStateManifest } = useRenderState();
  const { toggleRenderLayer } = useRenderActions();

  return (
    <div className="panel-hardened w-60 overflow-hidden hillshade-grain">
      <div className="panel-header-tactical justify-between">
        <span>Terrain Controls</span>
        <span className="opacity-50 font-mono text-[8px]">
          {SURFACED_LAYERS.filter((layerId) => requestedLayers[layerId]).length}/
          {SURFACED_LAYERS.length} ACTIVE
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <button
          onClick={() => setViewMode(viewMode === "2D" ? "3D" : "2D")}
          className={`btn-tactical flex items-center justify-between group ${
            viewMode === "3D" ? "active" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 ${
                viewMode === "3D" ? "bg-sigint-green pulse-tactical" : "bg-white/20"
              }`}
            />
            3D Perspective
          </div>
          <span className="text-[7px] opacity-40 group-hover:opacity-100">
            F4
          </span>
        </button>
        <div className="h-px bg-divider my-1" />
        <div className="grid grid-cols-1 gap-1">
          {SURFACED_LAYERS.map((layerId) => (
            <button
              key={layerId}
              onClick={() => toggleRenderLayer(layerId)}
              className={`btn-tactical text-left flex items-center gap-2 ${
                requestedLayers[layerId] ? "active" : ""
              }`}
            >
              <div
                className={`w-1 h-3 ${
                  requestedLayers[layerId] ? "bg-sigint-green" : "bg-white/10"
                }`}
              />
              {LAYER_LABELS[layerId]}
            </button>
          ))}
        </div>
        {renderStateManifest.warnings.length > 0 ? (
          <div className="text-[8px] text-sigint-amber uppercase tracking-[0.2em] pt-2">
            {renderStateManifest.warnings.join(" | ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
