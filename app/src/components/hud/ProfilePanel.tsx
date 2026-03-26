"use client";

import {
  useAnalysisActions,
  useAnalysisState,
} from "@/app-shell/hooks";
import TerrainProfileChart from "@/components/profile/TerrainProfileChart";

export default function ProfilePanel({
  widthClass = "w-80",
}: {
  widthClass?: string;
}) {
  const { activeTool, profileData, transectPoints } = useAnalysisState();
  const { clearTransect, startTransectCapture } = useAnalysisActions();

  const isCapturing = activeTool === "profile";
  const hasProfile = Boolean(profileData && profileData.length > 1);

  return (
    <div
      className={`${widthClass} transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]`}
    >
      <div className="panel-hardened hillshade-grain">
        <div className="panel-header-tactical justify-between">
          <span>Terrain Profile Analysis</span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                isCapturing ? clearTransect() : startTransectCapture()
              }
              className={`px-3 py-0.5 text-[8px] font-bold border transition-all uppercase tracking-widest ${
                isCapturing
                  ? "bg-sigint-green/20 border-sigint-green text-sigint-green shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white"
              }`}
            >
              {isCapturing ? "Abort Capture" : "New Transect [P]"}
            </button>
          </div>
        </div>
        <div className={`p-4 transition-all duration-500 ${hasProfile ? "h-48" : "h-24"}`}>
          {hasProfile && profileData ? (
            <div className="h-full flex flex-col gap-3">
              <div className="flex-1 bg-black/40 border border-white/5 p-2 rounded-sm relative overflow-hidden">
                <div className="texture-noise absolute inset-0" />
                <TerrainProfileChart profileData={profileData} width={440} height={120} />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="data-label">Total Distance</span>
                    <span className="text-xs font-bold text-white">
                      {(profileData[profileData.length - 1].distance / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="data-label">Peak Elevation</span>
                    <span className="text-xs font-bold text-sigint-green">
                      {Math.max(...profileData.map((sample) => sample.elevation)).toFixed(1)} m
                    </span>
                  </div>
                </div>
                <button className="text-[8px] text-sigint-green font-bold uppercase tracking-[0.2em] border-b border-sigint-green/30 pb-0.5 hover:border-sigint-green">
                  Export Telemetry
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-full h-px bg-white/10 relative">
                <div className="absolute inset-0 bg-sigint-green/20 blur-sm" />
              </div>
              <span className="text-[9px] text-white/30 uppercase tracking-[0.3em] font-black text-center">
                {isCapturing
                  ? transectPoints.length === 1
                    ? "Awaiting Endpoint..."
                    : "Awaiting Field Inputs..."
                  : "Analysis Engine Idle"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
