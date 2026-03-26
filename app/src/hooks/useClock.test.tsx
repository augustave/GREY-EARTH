import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatUTC, useClock } from "@/hooks/useClock";

function ClockHarness() {
  const time = useClock(1000);
  return <span>{time}</span>;
}

describe("useClock", () => {
  it("formats UTC timestamps in zulu form", () => {
    expect(formatUTC(new Date("2026-03-26T12:34:56.000Z"))).toBe(
      "2026-03-26 12:34:56Z",
    );
  });

  it("ticks forward without hydration-only placeholder state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:34:56.000Z"));

    render(<ClockHarness />);
    expect(screen.getByText("2026-03-26 12:34:56Z")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("2026-03-26 12:34:57Z")).toBeTruthy();

    vi.useRealTimers();
  });
});
