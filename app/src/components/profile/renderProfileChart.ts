import type { ProfileSample } from "@/app-shell/hooks";

export interface ProfileChartModel {
  points: string;
  maxElevation: number;
  minElevation: number;
  totalDistance: number;
  seaLevelY: number | null;
  gridFractions: number[];
  elevBottom: number;
  totalElevRange: number;
}

export function buildProfileChartModel(
  profileData: ProfileSample[],
  width: number,
  height: number,
): ProfileChartModel | null {
  if (profileData.length < 2) {
    return null;
  }

  const minElevation = Math.min(...profileData.map((sample) => sample.elevation));
  const maxElevation = Math.max(...profileData.map((sample) => sample.elevation));
  const elevBottom = Math.min(-20, minElevation - 20);
  const elevTop = maxElevation + 20;
  const totalElevRange = elevTop - elevBottom;
  const totalDistance = profileData[profileData.length - 1].distance;

  const points = profileData
    .map((sample) => {
      const x = (sample.distance / totalDistance) * width;
      const y =
        height - ((sample.elevation - elevBottom) / totalElevRange) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const seaLevelY =
    elevBottom < 0 && elevTop > 0
      ? height - ((0 - elevBottom) / totalElevRange) * height
      : null;

  return {
    points,
    maxElevation,
    minElevation,
    totalDistance,
    seaLevelY,
    gridFractions: [0, 0.25, 0.5, 0.75, 1],
    elevBottom,
    totalElevRange,
  };
}
