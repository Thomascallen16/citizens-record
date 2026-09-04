import type { Request, Response } from "express";
import { getMcpToolDefinitions } from "./mcpAdapter";
import { executeMcpTool } from "./mcpExecutor";
import type { User } from "../../drizzle/schema";

const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2025-03-26",
  "2025-06-18",
]);

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown,
) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function allowedHosts(): Set<string> {
  const configured = process.env.MCP_ALLOWED_HOSTS?.split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  if (configured?.length) return new Set(configured);
  return new Set(["localhost", "127.0.0.1", "[::1]"]);
}

function validateHostAndOrigin(req: Request, res: Response): boolean {
  const hosts = allowedHosts();
  const host = req.get("host")?.split(":")[0]?.toLowerCase();
  if (!host || !hosts.has(host)) {
    res.status(403).json({ error: "MCP host is not allowed." });
    return false;
  }

  const origin = req.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(",")
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
      const originAllowed = allowedOrigins?.length
        ? allowedOrigins.includes(origin.toLowerCase())
        : hosts.has(originHost);
      if (!originAllowed) {
        res.status(403).json({ error: "MCP origin is not allowed." });
        return false;
      }
    } catch {
      res.status(403).json({ error: "Invalid MCP origin." });
      return false;
    }
  }

  return true;
}

function protocolVersion(req: Request): string {
  const requested = req.get("mcp-protocol-version");
  return requested && SUPPORTED_PROTOCOL_VERSIONS.has(requested)
    ? requested
    : "2025-03-26";
}

async function authenticate(req: Request): Promise<User | null> {
  try {
    const { sdk } = await import("../_core/sdk");
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export async function handleMcpRequest(req: Request, res: Response) {
  if (!validateHostAndOrigin(req, res)) return;

  const user = await authenticate(req);
  if (!user) {
    res.setHeader("WWW-Authenticate", "Bearer");
    res.status(401).json({ error: "MCP authentication required." });
    return;
  }

  res.setHeader("MCP-Protocol-Version", protocolVersion(req));
  res.setHeader("Cache-Control", "no-store");

  const body = req.body as JsonRpcRequest | undefined;
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    res.status(400).json(jsonRpcError(null, -32600, "Invalid JSON-RPC request."));
    return;
  }

  if (body.method === "notifications/initialized") {
    res.status(202).end();
    return;
  }

  if (body.method === "initialize") {
    res.json(
      jsonRpcResult(body.id, {
        protocolVersion: protocolVersion(req),
        capabilities: { tools: {} },
        serverInfo: { name: "citizens-record", version: "1.0.0" },
      }),
    );
    return;
  }

  if (body.method === "tools/list") {
    res.json(
      jsonRpcResult(body.id, {
        tools: getMcpToolDefinitions().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        })),
      }),
    );
    return;
  }

  if (body.method === "tools/call") {
    const params = body.params ?? {};
    const name = params.name;
    if (typeof name !== "string") {
      res.json(jsonRpcError(body.id, -32602, "tools/call requires a tool name."));
      return;
    }

    try {
      const result = await executeMcpTool(name, params.arguments ?? {}, {
        req,
        res,
        user,
      });
      res.json(
        jsonRpcResult(body.id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "MCP tool execution failed.";
      res.json(jsonRpcError(body.id, -32000, message));
    }
    return;
  }

  res.json(jsonRpcError(body.id, -32601, `Method not found: ${body.method}`));
}
