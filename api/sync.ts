import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runtimeConfig } from "./config";
import { getDb, USERS_COLLECTION } from "./lib/mongodb";
import { getBearerToken, verifyToken } from "./lib/jwt";
import { handleOptions, json, withApiGuard } from "./lib/http";
import {
  estimateBodyBytes,
  MAX_BODY_BYTES,
  parseJsonBody,
} from "./lib/parseBody";
import {
  DEFAULT_PROFILE,
  type AppData,
  type UserDocument,
} from "./lib/types";

export const config = runtimeConfig;

async function syncHandler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  if (estimateBodyBytes(req) > MAX_BODY_BYTES) {
    return json(res, 413, {
      error: "Sync payload too large (over 4MB). Try exporting fewer connections.",
    });
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) return json(res, 401, { error: "Unauthorized" });

  let auth: { mobile: string } | null = null;
  try {
    auth = await verifyToken(token);
  } catch (err) {
    console.error("Sync auth error:", err);
    return json(res, 500, { error: "Authentication error" });
  }
  if (!auth) return json(res, 401, { error: "Unauthorized" });

  try {
    const incoming = parseJsonBody<AppData>(req);
    if (!incoming?.connections) {
      return json(res, 400, { error: "Invalid data" });
    }

    const db = await getDb();
    const users = db.collection<UserDocument>(USERS_COLLECTION);
    const existing = await users.findOne({ mobile: auth.mobile });
    const now = new Date();

    const mergedConnections =
      incoming.connections.length >= (existing?.connections?.length ?? 0)
        ? incoming.connections
        : (existing?.connections ?? []);

    await users.updateOne(
      { mobile: auth.mobile },
      {
        $set: {
          mobile: auth.mobile,
          profile: {
            ...DEFAULT_PROFILE,
            ...(existing?.profile ?? {}),
            ...(incoming.profile ?? {}),
          },
          connections: mergedConnections,
          lastImportedAt:
            incoming.lastImportedAt ?? existing?.lastImportedAt ?? null,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return json(res, 200, {
      ok: true,
      connections: mergedConnections.length,
      mobile: auth.mobile,
    });
  } catch (err) {
    console.error("Sync error:", err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : "Sync failed",
    });
  }
}

export default withApiGuard(syncHandler);
