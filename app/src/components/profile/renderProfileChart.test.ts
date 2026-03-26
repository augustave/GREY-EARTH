import { describe, expect, it } from "vitest";
import { buildProfileChartModel } from "@/components/profile/renderProfileChart";

describe("buildProfileChartModel", () => {
  it("returns stable chart geometry for a transect", () => {
    const model = buildProfileChartModel(
      [
        { distance: 0, elevation: 10 },
        { distance: 50, elevation: 30 },
        { distance: 100, elevation: 20 },
      ],
      100,
      50,
    );

    expect(model).not.toBeNull();
    expect(model?.points).toBe(
      "0,28.571428571428573 50,14.285714285714285 100,21.42857142857143",
    );
    expect(model?.maxElevation).toBe(30);
    expect(model?.totalDistance).toBe(100);
  });
});
