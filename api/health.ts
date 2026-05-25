import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleOptions, json } from "./lib/http";

/** GET /api/health — quick check that API routes are deployed */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  const hasMongo = !!process.env.MONGODB_URI;
  const hasJwt = !!process.env.JWT_SECRET;

  return json(res, 200, {
    ok: true,
    api: true,
    mongoConfigured: hasMongo,
    jwtConfigured: hasJwt,
  });
}
