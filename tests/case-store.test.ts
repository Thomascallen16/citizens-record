import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { discoveryStateLabel, kindLabel, nextDiscoveryState, statusLabel } from "../lib/case-store";

describe("CaseCompass evidence semantics", () => {
  it("keeps source status labels explicit and readable", () => {
    expect(statusLabel("SOURCE_UNAVAILABLE")).toBe("SOURCE UNAVAILABLE");
    expect(statusLabel("PRIMARY_RECORD")).toBe("PRIMARY RECORD");
    expect(kindLabel("MISSING_EVIDENCE")).toBe("MISSING EVIDENCE");
  });

  it("moves discovery tasks through a reviewable acquisition cycle", () => {
    expect(nextDiscoveryState("TODO")).toBe("REQUESTED");
    expect(nextDiscoveryState("REQUESTED")).toBe("NEEDS_REVIEW");
    expect(nextDiscoveryState("NEEDS_REVIEW")).toBe("RECEIVED");
    expect(nextDiscoveryState("RECEIVED")).toBe("TODO");
    expect(discoveryStateLabel("NEEDS_REVIEW")).toBe("NEEDS REVIEW");
  });
});
