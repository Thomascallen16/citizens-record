import { TRPCError } from "@trpc/server";

export function requireOwnedRecord<T>(record: T | undefined, resource = "Case") {
  if (!record) throw new TRPCError({ code: "NOT_FOUND", message: `${resource} not found in this workspace.` });
  return record;
}
