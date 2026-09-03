import { describe, expect, it } from "vitest";
import { assertFindingSavePolicy, assertPrivateOwner } from "./canonicalPolicy";

describe("canonical finding policy", () => {
  it("rejects FACT without supporting evidence", () => {
    expect(() => assertFindingSavePolicy("FACT", 0)).toThrow(/requires at least one/);
  });

  it("accepts FACT with source-backed evidence", () => {
    expect(() => assertFindingSavePolicy("FACT", 1)).not.toThrow();
  });

  it("allows INFERENCE without supporting evidence", () => {
    expect(() => assertFindingSavePolicy("INFERENCE", 0)).not.toThrow();
  });
});

describe("canonical private ownership policy", () => {
  it("allows the owner", () => {
    expect(() => assertPrivateOwner(7, 7)).not.toThrow();
  });

  it("rejects a different user", () => {
    expect(() => assertPrivateOwner(8, 7)).toThrow(/access denied/);
  });
});
