"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface TransectPoint {
  lng: number;
  lat: number;
}

export interface ProfileSample {
  distance: number;
  elevation: number;
}

export type AnalysisTool = "none" | "profile";
export type AnalysisStatus = "idle" | "querying" | "sampling";

interface SelectedQueryPoint {
  lng: number;
  lat: number;
}

interface AnalysisStateValue {
  activeTool: AnalysisTool;
  transectPoints: TransectPoint[];
  profileData: ProfileSample[] | null;
  selectedQueryPoint: SelectedQueryPoint | null;
  analysisStatus: AnalysisStatus;
}

interface AnalysisActionsValue {
  startTransectCapture: () => void;
  stopTransectCapture: () => void;
  setTransectPoints: (points: TransectPoint[]) => void;
  clearTransect: () => void;
  setProfileData: (data: ProfileSample[] | null) => void;
  setSelectedQueryPoint: (point: SelectedQueryPoint | null) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
}

const AnalysisStateContext = createContext<AnalysisStateValue | undefined>(
  undefined,
);
const AnalysisActionsContext = createContext<AnalysisActionsValue | undefined>(
  undefined,
);

export function AnalysisStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeTool, setActiveTool] = useState<AnalysisTool>("none");
  const [transectPoints, setTransectPoints] = useState<TransectPoint[]>([]);
  const [profileData, setProfileData] = useState<ProfileSample[] | null>(null);
  const [selectedQueryPoint, setSelectedQueryPoint] =
    useState<SelectedQueryPoint | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");

  const clearTransect = useCallback(() => {
    setTransectPoints([]);
    setProfileData(null);
    setActiveTool("none");
  }, []);

  const stateValue = useMemo(
    () => ({
      activeTool,
      transectPoints,
      profileData,
      selectedQueryPoint,
      analysisStatus,
    }),
    [
      activeTool,
      analysisStatus,
      profileData,
      selectedQueryPoint,
      transectPoints,
    ],
  );

  const actionsValue = useMemo(
    () => ({
      startTransectCapture: () => setActiveTool("profile"),
      stopTransectCapture: () => setActiveTool("none"),
      setTransectPoints,
      clearTransect,
      setProfileData,
      setSelectedQueryPoint,
      setAnalysisStatus,
    }),
    [clearTransect],
  );

  return (
    <AnalysisStateContext.Provider value={stateValue}>
      <AnalysisActionsContext.Provider value={actionsValue}>
        {children}
      </AnalysisActionsContext.Provider>
    </AnalysisStateContext.Provider>
  );
}

export function useAnalysisState() {
  const context = useContext(AnalysisStateContext);
  if (!context) {
    throw new Error(
      "useAnalysisState must be used within AnalysisStateProvider",
    );
  }

  return context;
}

export function useAnalysisActions() {
  const context = useContext(AnalysisActionsContext);
  if (!context) {
    throw new Error(
      "useAnalysisActions must be used within AnalysisStateProvider",
    );
  }

  return context;
}
