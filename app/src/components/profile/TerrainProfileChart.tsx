import type { ProfileSample } from "@/app-shell/hooks";
import { buildProfileChartModel } from "@/components/profile/renderProfileChart";

export default function TerrainProfileChart({
  profileData,
  width = 300,
  height = 120,
}: {
  profileData: ProfileSample[];
  width?: number;
  height?: number;
}) {
  const chart = buildProfileChartModel(profileData, width, height);

  if (!chart) {
    return null;
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-sigint-green)"
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor="var(--color-sigint-green)"
            stopOpacity="0.05"
          />
        </linearGradient>
      </defs>

      {chart.gridFractions.map((fraction) => (
        <line
          key={fraction}
          x1="0"
          y1={height * fraction}
          x2={width}
          y2={height * fraction}
          stroke="var(--color-divider)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
      ))}

      {chart.seaLevelY !== null ? (
        <line
          x1="0"
          y1={chart.seaLevelY}
          x2={width}
          y2={chart.seaLevelY}
          stroke="var(--color-sigint-cyan)"
          strokeWidth="1"
          opacity="0.5"
        />
      ) : null}

      <path
        d={`M ${chart.points} L ${width},${height} L 0,${height} Z`}
        fill="url(#profileGradient)"
      />
      <polyline
        points={chart.points}
        fill="none"
        stroke="var(--color-sigint-green)"
        strokeWidth="1.5"
      />
      <text
        x="2"
        y={
          height -
          ((chart.maxElevation - chart.elevBottom) / chart.totalElevRange) *
            height -
          4
        }
        fill="var(--color-sigint-green)"
        fontSize="8"
        fontWeight="bold"
      >
        {chart.maxElevation.toFixed(1)}m
      </text>
    </svg>
  );
}
