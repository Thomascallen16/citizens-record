# Authenticated MCP Execution

The Citizens Record now exposes a stateless authenticated MCP HTTP endpoint at `/mcp`.

## Security boundary

1. Express receives the request and validates the Host/Origin policy.
2. The existing `sdk.authenticateRequest` authenticates the caller.
3. Only the provider-neutral read-only tools from `server/agent/toolContract.ts` are executable.
4. Tool arguments are validated by the same Zod contracts used by the agent surface.
5. `mcpExecutor.ts` creates an application `appRouter` caller with the authenticated user.
6. Canonical procedures perform the existing ownership checks and database access.

MCP therefore has no database credentials and no second copy of ownership logic.

## Endpoint configuration

`MCP_ALLOWED_HOSTS` is a comma-separated list of hostnames accepted by `/mcp`.
When unset, local development accepts `localhost`, `127.0.0.1`, and `[::1]`.

`MCP_ALLOWED_ORIGINS` optionally restricts browser Origin values. When unset, a
present Origin must resolve to an allowed MCP host.

For a public deployment, configure both values explicitly for the production
host and browser origin rather than relying on the local defaults.

## Current scope

The first execution slice is intentionally read-only:

- `record.list`
- `record.get`
- `source.list`
- `evidence.list`
- `claim.list`
- `finding.list`
- `unknown.list`

Writes, background jobs, evidence ingestion, and agent-side mutations are not
exposed through MCP by this change.
