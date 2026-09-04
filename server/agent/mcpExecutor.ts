import type { Response, Request } from "express";
import type { User } from "../../drizzle/schema";
import { appRouter } from "../routers";
import { getAgentToolDefinition, type AgentToolName } from "./toolContract";
import { isMcpReadOnlyTool } from "./mcpAdapter";

export type McpExecutionContext = {
  req: Request;
  res: Response;
  user: User;
};

/**
 * Execute an agent tool through the application's existing tRPC/domain layer.
 *
 * MCP never receives database access. The authenticated Express request and
 * user are passed into the existing app router caller, so canonical ownership
 * checks, validation, and audit behavior remain authoritative in one place.
 */
export async function executeMcpTool(
  name: string,
  input: unknown,
  context: McpExecutionContext,
) {
  if (!isMcpReadOnlyTool(name)) {
    throw new Error(`MCP tool is not permitted: ${name}`);
  }

  const definition = getAgentToolDefinition(name);
  if (!definition) throw new Error(`Unknown MCP tool: ${name}`);

  const parsed = definition.input.parse(input);
  const caller = appRouter.createCaller({
    req: context.req,
    res: context.res,
    user: context.user,
  });

  switch (name as AgentToolName) {
    case "record.list":
      return caller.canonical.records.list();
    case "record.get":
      return caller.canonical.records.get(parsed);
    case "source.list":
      return caller.canonical.sources.list(parsed);
    case "evidence.list":
      return caller.canonical.evidence.list(parsed);
    case "claim.list":
      return caller.canonical.claims.list(parsed);
    case "finding.list":
      return caller.canonical.findings.list(parsed);
    case "unknown.list":
      return caller.canonical.unknowns.list(parsed);
  }
}
