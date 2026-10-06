import { describe, expect, it } from "vitest";
import { getMcpToolDefinitions, isMcpReadOnlyTool } from "./mcpAdapter";

describe("MCP adapter seam", () => {
  it("maps the canonical agent contract to MCP-shaped definitions", () => {
    const tools = getMcpToolDefinitions();

    expect(tools.map(tool => tool.name)).toEqual([
      "record.list",
      "record.get",
      "source.list",
      "evidence.list",
      "claim.list",
      "finding.list",
      "finding.get",
      "unknown.list",
      "audit.list",
    ]);

    expect(tools.every(tool => tool.annotations.readOnlyHint)).toBe(true);
    expect(tools.find(tool => tool.name === "record.get")?.inputSchema).toMatchObject({
      type: "object",
      properties: {
        recordId: {
          type: "integer",
        },
      },
      required: ["recordId"],
    });
    expect(tools.find(tool => tool.name === "finding.get")?.inputSchema).toMatchObject({
      type: "object",
      properties: {
        recordId: { type: "integer" },
        findingId: { type: "integer" },
      },
      required: ["recordId", "findingId"],
    });
  });

  it("rejects unknown or write-oriented tool names", () => {
    expect(isMcpReadOnlyTool("record.list")).toBe(true);
    expect(isMcpReadOnlyTool("audit.list")).toBe(true);
    expect(isMcpReadOnlyTool("record.delete")).toBe(false);
    expect(isMcpReadOnlyTool("record.update")).toBe(false);
  });
});
