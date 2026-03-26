"use client";

import type { ReactNode } from "react";
import { AnalysisStateProvider } from "@/app-shell/providers/AnalysisStateProvider";
import { MapRuntimeProvider } from "@/app-shell/providers/MapRuntimeProvider";
import { RenderStateProvider } from "@/app-shell/providers/RenderStateProvider";
import { ViewportStateProvider } from "@/app-shell/providers/ViewportStateProvider";

export function AppShellProvider({ children }: { children: ReactNode }) {
  return (
    <ViewportStateProvider>
      <AnalysisStateProvider>
        <RenderStateProvider>
          <MapRuntimeProvider>{children}</MapRuntimeProvider>
        </RenderStateProvider>
      </AnalysisStateProvider>
    </ViewportStateProvider>
  );
}
