import { describe, expect, it } from "vitest";
import { agentToolDefinitions, getAgentToolDefinition } from "./toolContract";

describe("agent tool contract", () => {
  it("exposes only the initial read-only tools", () => {
    expect(agentToolDefinitions.map(tool => tool.name)).toEqual([
      "record.list",
      "record.get",
      "source.list",
      "evidence.list",
      "claim.list",
      "finding.list",
      "unknown.list",
    ]);
    expect(agentToolDefinitions.every(tool => tool.access === "read")).toBe(true);
  });

  it("requires a positive record id for record-scoped tools", () => {
    const tool = getAgentToolDefinition("record.get");
    expect(tool).toBeDefined();
    expect(tool!.input.safeParse({ recordId: 12 }).success).toBe(true);
    expect(tool!.input.safeParse({ recordId: 0 }).success).toBe(false);
    expect(tool!.input.safeParse({ recordId: -1 }).success).toBe(false);
    expect(tool!.input.safeParse({ recordId: "12" }).success).toBe(false);
  });

  it("does not resolve unknown tool names", () => {
    expect(getAgentToolDefinition("record.delete")).toBeUndefined();
  });
});
