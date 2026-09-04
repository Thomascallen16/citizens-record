import { z } from "zod";
import { agentToolDefinitions, type AgentToolName } from "./toolContract";

/**
 * Small structural subset of an MCP tool definition.
 *
 * This keeps the canonical application independent of the MCP SDK. A runtime
 * adapter can pass these definitions directly to an MCP server implementation
 * without moving authorization or domain logic into the protocol layer.
 */
export type McpToolDefinition = {
  name: AgentToolName;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: true;
  };
};

/**
 * Convert the provider-neutral Citizens Record contract into MCP-shaped tool
 * definitions. This is intentionally definition-only: no request can reach
 * the database through this module until an authenticated executor is wired
 * to the application-owned domain layer.
 */
export function getMcpToolDefinitions(): McpToolDefinition[] {
  return agentToolDefinitions.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.input) as Record<string, unknown>,
    annotations: {
      readOnlyHint: true,
    },
  }));
}

export function isMcpReadOnlyTool(name: string): name is AgentToolName {
  return agentToolDefinitions.some(tool => tool.name === name && tool.access === "read");
}
