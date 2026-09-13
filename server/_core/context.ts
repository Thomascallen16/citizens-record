import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateNativeRequest } from "./localAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try { user = await authenticateNativeRequest(opts.req); }
  catch (error) { console.error("[Auth] Context authentication failed:", error); }
  return { req: opts.req, res: opts.res, user };
}
