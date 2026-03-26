"use client";

import CoordinatesPanel from "@/components/hud/CoordinatesPanel";
import EarthEnginePanel from "@/components/earth-engine/EarthEnginePanel";
import IntelFeedPanel from "@/components/hud/IntelFeedPanel";
import ProfilePanel from "@/components/hud/ProfilePanel";
import SystemHeader from "@/components/hud/SystemHeader";
import TerrainControlsPanel from "@/components/hud/TerrainControlsPanel";
import TimeStatusPanel from "@/components/hud/TimeStatusPanel";

export default function DesktopHUD() {
  return (
    <>
      <div className="absolute top-6 left-6 z-30 pointer-events-none">
        <SystemHeader />
      </div>

      <div className="absolute bottom-6 left-6 z-30">
        <CoordinatesPanel />
      </div>

      <div className="absolute top-6 right-6 z-30 flex flex-col gap-4 items-end">
        <TimeStatusPanel />
        <TerrainControlsPanel />
        <EarthEnginePanel />
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-30 w-72">
        <IntelFeedPanel />
      </div>

      <div className="absolute bottom-6 right-6 z-30">
        <ProfilePanel widthClass="w-[480px]" />
      </div>
    </>
  );
}
