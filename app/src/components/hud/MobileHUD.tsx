"use client";

import EarthEnginePanel from "@/components/earth-engine/EarthEnginePanel";
import ProfilePanel from "@/components/hud/ProfilePanel";
import SystemHeader from "@/components/hud/SystemHeader";
import TerrainControlsPanel from "@/components/hud/TerrainControlsPanel";
import TimeStatusPanel from "@/components/hud/TimeStatusPanel";
 
export default function MobileHUD() {
  return (
    <>
      <div className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between gap-3">
        <div className="pointer-events-none">
          <SystemHeader compact />
        </div>
        <div className="max-w-[12rem]">
          <TimeStatusPanel compact />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-3">
        <EarthEnginePanel />
        <TerrainControlsPanel />
        <ProfilePanel widthClass="w-full" />
      </div>
    </>
  );
}
