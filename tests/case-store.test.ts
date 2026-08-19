import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { discoveryCategories, discoveryStateLabel, kindLabel, nextDiscoveryState, statusLabel, timePrecisionLabel } from "../lib/case-store";

describe("CaseCompass evidence semantics", () => {
  it("keeps source status labels explicit and readable", () => {
    expect(statusLabel("SOURCE_UNAVAILABLE")).toBe("SOURCE UNAVAILABLE");
    expect(statusLabel("PRIMARY_RECORD")).toBe("PRIMARY RECORD");
    expect(kindLabel("MISSING_EVIDENCE")).toBe("MISSING EVIDENCE");
  });

  it("moves discovery tasks through expected, request, receipt, review, and unresolved-location states", () => {
    expect(nextDiscoveryState("EXPECTED")).toBe("REQUESTED");
    expect(nextDiscoveryState("REQUESTED")).toBe("RECEIVED");
    expect(nextDiscoveryState("RECEIVED")).toBe("REVIEWED");
    expect(nextDiscoveryState("REVIEWED")).toBe("POSSIBLY_MISSING");
    expect(nextDiscoveryState("POSSIBLY_MISSING")).toBe("EXPECTED");
    expect(discoveryStateLabel("POSSIBLY_MISSING")).toBe("POSSIBLY MISSING");
  });

  it("keeps uncertainty and discovery categories explicit instead of asserting unsupported conclusions", () => {
    expect(timePrecisionLabel("CONFLICTING")).toBe("CONFLICTING");
    expect(timePrecisionLabel("APPROXIMATE")).toBe("APPROXIMATE");
    expect(discoveryCategories).toContain("Dispatch audio");
    expect(discoveryCategories).toContain("Search warrant");
  });
});
