import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const matches =
      query === "(min-width: 1280px)"
        ? true
        : query === "(min-width: 768px) and (max-width: 1279px)"
          ? false
          : false;

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
  },
});

afterEach(() => {
  cleanup();
});
