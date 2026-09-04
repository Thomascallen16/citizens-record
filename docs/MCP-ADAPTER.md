# MCP Adapter Boundary

**Status:** MCP adapter seam, September 4, 2026

The Citizens Record exposes a provider-neutral agent contract in `server/agent/toolContract.ts`. `server/agent/mcpAdapter.ts` is the first protocol adapter: it converts that contract into MCP-shaped tool definitions.

## What this layer does

- maps canonical tool names and descriptions to MCP tool definitions;
- derives JSON Schema from the existing Zod input schemas;
- marks every currently exposed tool as read-only;
- provides a single allow-list check for runtime dispatch.

## What this layer does not do

- authenticate callers;
- authorize access to records;
- query the database directly;
- create, update, delete, or otherwise mutate records;
- own provenance, privacy, audit, or evidence policy.

Those responsibilities stay in the application/domain layer.

## Next step

Wire the MCP transport to an authenticated application-owned executor. That executor should resolve the authenticated user and call the same canonical domain operations used by the application rather than duplicating database queries in the protocol adapter.

The current MCP TypeScript SDK v2 uses `@modelcontextprotocol/server` and recommends Streamable HTTP for remote servers. We deliberately keep the SDK dependency out of this seam so the canonical application remains protocol- and vendor-neutral while the transport choice is finalized.
