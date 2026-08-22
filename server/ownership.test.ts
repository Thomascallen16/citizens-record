import { describe, expect, it } from "vitest";
import { requireOwnedRecord } from "./ownership";

describe("workspace ownership guard", () => {
  it("returns an owned record and rejects a missing cross-workspace record", () => {
    expect(requireOwnedRecord({ id: 7 }, "Case")).toEqual({ id: 7 });
    expect(() => requireOwnedRecord(undefined, "Case")).toThrow("Case not found in this workspace.");
  });
});
