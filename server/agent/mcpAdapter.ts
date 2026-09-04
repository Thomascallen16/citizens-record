import { agentToolDefinitions, type AgentToolName } from "./toolContract";

export interface AgentExecutionContext {
  userId: number;
}

export interface AgentToolExecutor {
  execute(
    name: AgentToolName,
    input: Record<string, unknown>,
    context: AgentExecutionContext,
  ): Promise<unknown>;
}

/** Minimal structural interface implemented by the official MCP SDK server. */
export interface McpToolRegistrar {
  registerTool(
    name: string,
    options: {
      title?: string;
      description?: string;
      inputSchema?: unknown;
    },
    handler: (input: Record<string, unknown>) => Promise<{
      content: Array<{ type: "text"; text: string }>;
      structuredContent?: unknown;
    }>,
  ): unknown;
}

function jsonText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

/**
 * Register the provider-neutral Citizens Record contract with an MCP server.
 *
 * Authentication and authorization remain outside this adapter. The caller
 * supplies the authenticated user context and an executor that must enforce
 * record ownership before reading private data.
 */
export function registerAgentTools(
  server: McpToolRegistrar,
  executor: AgentToolExecutor,
  context: AgentExecutionContext,
) {
  for (const tool of agentToolDefinitions) {
    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: tool.input,
      },
      async input => {
        const result = await executor.execute(tool.name, input, context);
        return {
          content: [{ type: "text", text: jsonText(result) }],
          structuredContent: result,
        };
      },
    );
  }
}
