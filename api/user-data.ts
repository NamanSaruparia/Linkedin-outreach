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

function toAppData(doc: UserDocument): AppData {
  return {
    profile: { ...DEFAULT_PROFILE, ...doc.profile },
    connections: doc.connections ?? [],
    lastImportedAt: doc.lastImportedAt ?? null,
  };
}

async function userDataHandler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  let auth: { mobile: string } | null = null;
  try {
    const token = getBearerToken(req.headers.authorization);
    if (token) auth = await verifyToken(token);
  } catch (err) {
    console.error("Auth error:", err);
    return json(res, 500, { error: "Authentication error" });
  }

  if (!auth) {
    return json(res, 401, { error: "Unauthorized" });
  }

  if (req.method === "PUT" && estimateBodyBytes(req) > MAX_BODY_BYTES) {
    return json(res, 413, {
      error:
        "Data too large to save (over 4MB). Export a backup, then re-import a smaller batch.",
    });
  }

  try {
    const db = await getDb();
    const users = db.collection<UserDocument>(USERS_COLLECTION);

    if (req.method === "GET") {
      const doc = await users.findOne({ mobile: auth.mobile });
      if (!doc) {
        return json(res, 200, {
          profile: DEFAULT_PROFILE,
          connections: [],
          lastImportedAt: null,
        } satisfies AppData);
      }
      return json(res, 200, toAppData(doc));
    }

    if (req.method === "PUT") {
      const body = parseJsonBody<AppData>(req);
      if (!body?.profile) {
        return json(res, 400, { error: "Invalid data" });
      }

      const now = new Date();
      await users.updateOne(
        { mobile: auth.mobile },
        {
          $set: {
            profile: { ...DEFAULT_PROFILE, ...body.profile },
            connections: body.connections ?? [],
            lastImportedAt: body.lastImportedAt ?? null,
            updatedAt: now,
          },
          $setOnInsert: {
            mobile: auth.mobile,
            createdAt: now,
          },
        },
        { upsert: true }
      );

      return json(res, 200, { ok: true, updatedAt: now.toISOString() });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Data API error:", err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : "Server error",
    });
  }
}

export default withApiGuard(userDataHandler);
