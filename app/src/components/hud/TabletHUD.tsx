"use client";

import CoordinatesPanel from "@/components/hud/CoordinatesPanel";
import IntelFeedPanel from "@/components/hud/IntelFeedPanel";
import ProfilePanel from "@/components/hud/ProfilePanel";
import SystemHeader from "@/components/hud/SystemHeader";
import TerrainControlsPanel from "@/components/hud/TerrainControlsPanel";
import TimeStatusPanel from "@/components/hud/TimeStatusPanel";

export default function TabletHUD() {
  return (
    <>
      <div className="absolute top-4 left-4 z-30">
        <SystemHeader compact />
      </div>

      <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 w-60">
        <TimeStatusPanel compact />
        <TerrainControlsPanel />
      </div>

      <div className="absolute bottom-4 left-4 z-30 scale-90 origin-bottom-left">
        <CoordinatesPanel />
      </div>

      <div className="absolute bottom-4 right-4 z-30 w-[360px]">
        <ProfilePanel widthClass="w-[360px]" />
      </div>

      <div className="absolute top-[13rem] right-4 z-30 w-60">
        <IntelFeedPanel />
      </div>
    </>
  );
}
