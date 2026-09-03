import type { Express } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { evidenceItems } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type StorageAuthorizationLookup = (
  userId: number,
  key: string,
) => Promise<boolean>;

const lookupOwnedReadyStorageKey: StorageAuthorizationLookup = async (userId, key) => {
  const database = await db.getDb();
  if (!database) return false;

  const rows = await database
    .select({ id: evidenceItems.id })
    .from(evidenceItems)
    .where(
      and(
        eq(evidenceItems.userId, userId),
        eq(evidenceItems.storageKey, key),
        eq(evidenceItems.state, "READY"),
        isNull(evidenceItems.deletedAt),
      ),
    )
    .limit(1);

  return rows.length > 0;
};

export async function isStorageKeyAuthorized(
  userId: number,
  key: string,
  lookup: StorageAuthorizationLookup = lookupOwnedReadyStorageKey,
): Promise<boolean> {
  return lookup(userId, key);
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const user = await sdk.authenticateRequest(req);
      if (user.isCron || !(await isStorageKeyAuthorized(user.id, key))) {
        res.status(403).send("Forbidden");
        return;
      }

      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
