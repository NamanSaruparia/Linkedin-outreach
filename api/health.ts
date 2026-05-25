import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runtimeConfig } from "./config";
import { handleOptions, json, withApiGuard } from "./lib/http";
import { getDb } from "./lib/mongodb";
import { signToken } from "./lib/jwt";

export const config = runtimeConfig;

async function healthHandler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const mongoConfigured = !!process.env.MONGODB_URI;
  const jwtConfigured =
    !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16;

  let mongoConnected = false;
  let mongoError: string | undefined;
  let jwtWorks = false;
  let jwtError: string | undefined;

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

  if (jwtConfigured) {
    try {
      await signToken("0000000000");
      jwtWorks = true;
    } catch (err) {
      jwtError = err instanceof Error ? err.message : "JWT sign failed";
    }
  }

  return json(res, 200, {
    ok: mongoConnected && jwtWorks,
    api: true,
    version: 4,
    mongoConfigured,
    mongoConnected,
    mongoError,
    jwtConfigured: jwtWorks,
    jwtError,
  });
}

export default withApiGuard(healthHandler);
