import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShellProvider } from "@/app-shell/AppShellProvider";
import {
  useAnalysisState,
  useMapRuntimeActions,
  useRenderState,
  useViewportActions,
  useViewportState,
} from "@/app-shell/hooks";
import ProfilePanel from "@/components/hud/ProfilePanel";
import TerrainControlsPanel from "@/components/hud/TerrainControlsPanel";
import { useMapLayerBindings } from "@/components/map/useMapLayerBindings";

function renderWithProviders(children: React.ReactNode) {
  return render(<AppShellProvider>{children}</AppShellProvider>);
}

function LayerBindingHarness({
  map,
}: {
  map: {
    setPaintProperty: ReturnType<typeof vi.fn>;
    setLayoutProperty: ReturnType<typeof vi.fn>;
    setTerrain: ReturnType<typeof vi.fn>;
  };
}) {
  const { setMap, setIsLoaded } = useMapRuntimeActions();
  const { renderStateManifest } = useRenderState();
  useMapLayerBindings();

  useEffect(() => {
    setMap(map as never);
    setIsLoaded(true);
  }, [map, setIsLoaded, setMap]);

  return (
    <>
      <TerrainControlsPanel />
      <div data-testid="active-layers">
        {renderStateManifest.layers_active.map((layer) => layer.id).join(",")}
      </div>
    </>
  );
}

function ViewportObserver() {
  const { center, zoom, viewMode } = useViewportState();
  const { updateViewport } = useViewportActions();

  useEffect(() => {
    updateViewport({
      center: { lng: -73.9, lat: 40.7 },
      zoom: 12.25,
    });
  }, [updateViewport]);

  return (
    <div data-testid="viewport-observer">
      {`${viewMode}|${center.lng.toFixed(1)}|${center.lat.toFixed(1)}|${zoom.toFixed(2)}`}
    </div>
  );
}

function AnalysisObserver() {
  const { activeTool } = useAnalysisState();
  return <div data-testid="analysis-tool">{activeTool}</div>;
}

describe("app shell integrations", () => {
  it("updates render state before map bindings apply visibility changes", async () => {
    const map = {
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
      setTerrain: vi.fn(),
    };

    renderWithProviders(<LayerBindingHarness map={map} />);

    expect(screen.getByTestId("active-layers").textContent).toContain("hillshade");

    fireEvent.click(screen.getByText("Denied Zones"));

    await waitFor(() => {
      expect(screen.getByTestId("active-layers").textContent).toContain("denied");
      expect(map.setLayoutProperty).toHaveBeenCalledWith(
        "denied",
        "visibility",
        "visible",
      );
    });
  });

  it("enters profile mode through analysis state actions", () => {
    renderWithProviders(
      <>
        <ProfilePanel />
        <AnalysisObserver />
      </>,
    );

    fireEvent.click(screen.getByText("New Transect [P]"));

    expect(screen.getByTestId("analysis-tool").textContent).toBe("profile");
  });

  it("switches 2D and 3D mode while preserving viewport state", async () => {
    renderWithProviders(
      <>
        <ViewportObserver />
        <TerrainControlsPanel />
      </>,
    );

    const before = screen.getByTestId("viewport-observer").textContent;
    fireEvent.click(screen.getByText("3D Perspective"));

    await waitFor(() => {
      const after = screen.getByTestId("viewport-observer").textContent;
      expect(after?.startsWith("3D|")).toBe(true);
      expect(after?.split("|").slice(1)).toEqual(before?.split("|").slice(1));
    });
  });
});
