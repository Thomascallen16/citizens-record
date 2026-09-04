import { describe, expect, it } from "vitest";
import { executeMcpTool } from "./mcpExecutor";

const context = {
  req: {} as never,
  res: {} as never,
  user: { id: 1 } as never,
};

describe("MCP executor", () => {
  it("rejects tools outside the provider-neutral read-only contract", async () => {
    await expect(
      executeMcpTool("record.delete", {}, context),
    ).rejects.toThrow("MCP tool is not permitted");
  });

  it("validates tool input before creating an application caller", async () => {
    await expect(
      executeMcpTool("record.get", { recordId: 0 }, context),
    ).rejects.toThrow();
  });
});
