"use client";

import { useSyncExternalStore } from "react";

export function formatUTC(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function subscribe(onStoreChange: () => void, intervalMs: number) {
  const id = window.setInterval(onStoreChange, intervalMs);
  return () => window.clearInterval(id);
}

export function useClock(intervalMs = 1000): string {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(onStoreChange, intervalMs),
    () => formatUTC(new Date()),
    () => "0000-00-00 00:00:00Z",
  );
}
