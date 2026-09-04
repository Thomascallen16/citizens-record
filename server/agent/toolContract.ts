import { z } from "zod";

/**
 * Provider-neutral contract for agent access to The Citizens Record.
 *
 * This intentionally contains read-only tools first. An MCP/A2A adapter can
 * expose this contract without giving an agent direct database access or
 * bypassing the application's authorization layer.
 */
export const agentToolDefinitions = [
  {
    name: "record.list",
    description: "List private records owned by the authenticated user.",
    access: "read",
    input: z.object({}),
  },
  {
    name: "record.get",
    description: "Get one private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
  {
    name: "source.list",
    description: "List sources belonging to a private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
  {
    name: "evidence.list",
    description: "List source-backed evidence belonging to a private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
  {
    name: "claim.list",
    description: "List canonical claims belonging to a private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
  {
    name: "finding.list",
    description: "List canonical findings belonging to a private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
  {
    name: "unknown.list",
    description: "List canonical unknowns belonging to a private record owned by the authenticated user.",
    access: "read",
    input: z.object({ recordId: z.number().int().positive() }),
  },
] as const;

export type AgentToolName = (typeof agentToolDefinitions)[number]["name"];

export function getAgentToolDefinition(name: string) {
  return agentToolDefinitions.find(tool => tool.name === name);
}
