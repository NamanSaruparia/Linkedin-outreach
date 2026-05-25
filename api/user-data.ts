import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runtimeConfig } from "./config";
import { getDb, USERS_COLLECTION } from "./lib/mongodb";
import { getBearerToken, verifyToken } from "./lib/jwt";
import { handleOptions, json } from "./lib/http";
import { parseJsonBody } from "./lib/parseBody";
import {
  DEFAULT_PROFILE,
  type AppData,
  type UserDocument,
} from "./lib/types";

export const config = runtimeConfig;

async function authenticate(
  req: VercelRequest
): Promise<{ mobile: string } | null> {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  return verifyToken(token);
}

function toAppData(doc: UserDocument): AppData {
  return {
    profile: { ...DEFAULT_PROFILE, ...doc.profile },
    connections: doc.connections ?? [],
    lastImportedAt: doc.lastImportedAt ?? null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const auth = await authenticate(req);
  if (!auth) {
    return json(res, 401, { error: "Unauthorized" });
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
