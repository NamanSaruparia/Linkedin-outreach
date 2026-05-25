import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runtimeConfig } from "./config";
import { handleOptions, json } from "./lib/http";
import { getDb } from "./lib/mongodb";

export const config = runtimeConfig;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const mongoConfigured = !!process.env.MONGODB_URI;
  const jwtConfigured =
    !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16;

  let mongoConnected = false;
  let mongoError: string | undefined;

  if (mongoConfigured) {
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      mongoConnected = true;
    } catch (err) {
      mongoError =
        err instanceof Error ? err.message : "MongoDB connection failed";
    }
  }

  return json(res, 200, {
    ok: mongoConnected && jwtConfigured,
    api: true,
    version: 3,
    mongoConfigured,
    mongoConnected,
    mongoError,
    jwtConfigured,
  });
}
