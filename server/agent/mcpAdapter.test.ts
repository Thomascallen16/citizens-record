import { describe, expect, it, vi } from "vitest";
import { agentToolDefinitions } from "./toolContract";
import { registerAgentTools } from "./mcpAdapter";

describe("MCP agent adapter", () => {
  it("registers every provider-neutral read tool", () => {
    const registerTool = vi.fn();
    const server = { registerTool };
    const executor = { execute: vi.fn().mockResolvedValue({ ok: true }) };

    registerAgentTools(server, executor, { userId: 42 });

    expect(registerTool).toHaveBeenCalledTimes(agentToolDefinitions.length);
    expect(registerTool.mock.calls.map(([name]) => name)).toEqual(
      agentToolDefinitions.map(tool => tool.name),
    );
  });

  it("passes authenticated context and tool input to the executor", async () => {
    const handler = vi.fn();
    const server = { registerTool: handler };
    const executor = { execute: vi.fn().mockResolvedValue({ id: 7 }) };

    registerAgentTools(server, executor, { userId: 42 });

    const recordGet = handler.mock.calls.find(([name]) => name === "record.get");
    expect(recordGet).toBeDefined();

    const result = await recordGet[2]({ recordId: 7 });

    expect(executor.execute).toHaveBeenCalledWith(
      "record.get",
      { recordId: 7 },
      { userId: 42 },
    );
    expect(result).toEqual({
      content: [{ type: "text", text: '{\n  "id": 7\n}' }],
      structuredContent: { id: 7 },
    });
  });
});
