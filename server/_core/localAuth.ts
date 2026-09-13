import { randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { users } from "../../drizzle/schema";
import { getDb, getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

const scrypt = promisify(scryptCallback);
const MIN_PASSWORD_LENGTH = 12;
const CREDENTIALS_TABLE_SQL = sql.raw(`CREATE TABLE IF NOT EXISTS auth_credentials (userId INT NOT NULL PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE, passwordHash TEXT NOT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT auth_credentials_user_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE)`);

type Session = { openId: string; name: string };

function sessionKey() {
  if (!ENV.cookieSecret || ENV.cookieSecret.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

async function ensureCredentialsTable() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable. Configure DATABASE_URL.");
  await db.execute(CREDENTIALS_TABLE_SQL);
  return db;
}

async function hashPassword(password: string) {
  const salt = randomUUID().replaceAll("-", "");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const expected = Buffer.from(encoded, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function issueSession(user: User) {
  return new SignJWT({ openId: user.openId, name: user.name || "" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(sessionKey());
}

export async function registerNativeUser(input: { name: string; email: string; password: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 1 || name.length > 200) throw new Error("Name is required.");
  if (!email.includes("@") || email.length > 320) throw new Error("Enter a valid email address.");
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);

  const db = await ensureCredentialsTable();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) throw new Error("An account with that email already exists.");

  const openId = `local_${randomUUID()}`;
  await upsertUser({ openId, name, email, loginMethod: "password", lastSignedIn: new Date() });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Account creation failed.");

  const passwordHash = await hashPassword(input.password);
  try {
    await db.execute(sql`INSERT INTO auth_credentials (userId, email, passwordHash) VALUES (${user.id}, ${email}, ${passwordHash})`);
  } catch (error) {
    await db.execute(sql`DELETE FROM users WHERE id = ${user.id}`);
    throw error;
  }
  return { user, token: await issueSession(user) };
}

export async function loginNativeUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const db = await ensureCredentialsTable();
  const result = await db.execute(sql`SELECT userId, passwordHash FROM auth_credentials WHERE email = ${email} LIMIT 1`) as any;
  const rows = Array.isArray(result) ? result[0] : result;
  const row = rows?.[0] as { userId: number; passwordHash: string } | undefined;
  if (!row || !(await verifyPassword(input.password, row.passwordHash))) throw new Error("Invalid email or password.");
  const user = (await db.select().from(users).where(eq(users.id, row.userId)).limit(1))[0];
  if (!user) throw new Error("Account no longer exists.");
  await db.execute(sql`UPDATE users SET lastSignedIn = CURRENT_TIMESTAMP WHERE id = ${user.id}`);
  return { user, token: await issueSession(user) };
}

export function setSessionCookie(res: Response, req: Request, token: string) {
  res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));
}

export async function authenticateNativeRequest(req: Request): Promise<User | null> {
  const cookies = parseCookieHeader(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    const openId = typeof payload.openId === "string" ? payload.openId : "";
    if (!openId) return null;
    return (await getUserByOpenId(openId)) ?? null;
  } catch {
    return null;
  }
}
