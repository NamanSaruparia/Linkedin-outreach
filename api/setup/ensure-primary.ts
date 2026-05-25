import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, USERS_COLLECTION } from "../lib/mongodb";
import { handleOptions, json } from "../lib/http";
import { DEFAULT_PROFILE, type UserDocument } from "../lib/types";

const PRIMARY_MOBILE = "8290656032";

/** One-time: GET /api/setup/ensure-primary?key=YOUR_SEED_SECRET */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const secret = process.env.SEED_SECRET;
  const key = typeof req.query.key === "string" ? req.query.key : "";

  if (!secret || key !== secret) {
    return json(res, 403, { error: "Forbidden" });
  }

  try {
    const db = await getDb();
    const users = db.collection<UserDocument>(USERS_COLLECTION);
    const now = new Date();

    const existing = await users.findOne({ mobile: PRIMARY_MOBILE });

    if (!existing) {
      await users.insertOne({
        mobile: PRIMARY_MOBILE,
        profile: { ...DEFAULT_PROFILE },
        connections: [],
        lastImportedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      return json(res, 200, {
        ok: true,
        action: "created",
        mobile: PRIMARY_MOBILE,
        displayMobile: `+91 ${PRIMARY_MOBILE.slice(0, 5)} ${PRIMARY_MOBILE.slice(5)}`,
      });
    }

    return json(res, 200, {
      ok: true,
      action: "already_exists",
      mobile: PRIMARY_MOBILE,
      connections: existing.connections?.length ?? 0,
    });
  } catch (err) {
    console.error("Ensure primary user:", err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : "Failed",
    });
  }
}
