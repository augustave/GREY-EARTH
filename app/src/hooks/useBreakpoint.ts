"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");
    const desktopQuery = window.matchMedia("(min-width: 1280px)");

    const check = () => {
      if (mobileQuery.matches) setBreakpoint("mobile");
      else if (tabletQuery.matches) setBreakpoint("tablet");
      else if (desktopQuery.matches) setBreakpoint("desktop");
    };

    check();

    mobileQuery.addEventListener("change", check);
    tabletQuery.addEventListener("change", check);
    desktopQuery.addEventListener("change", check);

    return () => {
      mobileQuery.removeEventListener("change", check);
      tabletQuery.removeEventListener("change", check);
      desktopQuery.removeEventListener("change", check);
    };
  }, []);

  return breakpoint;
}
