"use client";

import { useViewportState } from "@/app-shell/hooks";
import DesktopHUD from "@/components/hud/DesktopHUD";
import MobileHUD from "@/components/hud/MobileHUD";
import TabletHUD from "@/components/hud/TabletHUD";

export default function HUDOverlay() {
  const { breakpoint } = useViewportState();

  if (breakpoint === "desktop") {
    return <DesktopHUD />;
  }

  if (breakpoint === "tablet") {
    return <TabletHUD />;
  }

  return <MobileHUD />;
}
