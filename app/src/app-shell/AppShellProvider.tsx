"use client";

import type { ReactNode } from "react";
import { AnalysisStateProvider } from "@/app-shell/providers/AnalysisStateProvider";
import { EarthEngineProvider } from "@/app-shell/providers/EarthEngineProvider";
import { MapRuntimeProvider } from "@/app-shell/providers/MapRuntimeProvider";
import { RenderStateProvider } from "@/app-shell/providers/RenderStateProvider";
import { ViewportStateProvider } from "@/app-shell/providers/ViewportStateProvider";

export function AppShellProvider({ children }: { children: ReactNode }) {
  return (
    <ViewportStateProvider>
      <EarthEngineProvider>
        <AnalysisStateProvider>
          <RenderStateProvider>
            <MapRuntimeProvider>{children}</MapRuntimeProvider>
          </RenderStateProvider>
        </AnalysisStateProvider>
      </EarthEngineProvider>
    </ViewportStateProvider>
  );
}
