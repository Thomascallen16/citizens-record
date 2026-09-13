import type { Express, Request, Response } from "express";
import { loginNativeUser, registerNativeUser, setSessionCookie } from "./localAuth";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { authenticateNativeRequest } from "./localAuth";

function message(error: unknown) {
  return error instanceof Error ? error.message : "Authentication failed.";
}

export function registerNativeAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = await registerNativeUser({ name: String(req.body?.name || ""), email: String(req.body?.email || ""), password: String(req.body?.password || "") });
      setSessionCookie(res, req, result.token);
      res.json({ user: result.user });
    } catch (error) {
      const text = message(error);
      res.status(text.includes("already exists") ? 409 : 400).json({ error: text });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = await loginNativeUser({ email: String(req.body?.email || ""), password: String(req.body?.password || "") });
      setSessionCookie(res, req, result.token);
      res.json({ user: result.user });
    } catch (error) {
      res.status(401).json({ error: message(error) });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(_req), maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await authenticateNativeRequest(req);
      res.json({ user: user ?? null });
    } catch {
      res.json({ user: null });
    }
  });
}
