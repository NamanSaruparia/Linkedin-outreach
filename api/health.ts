import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runtimeConfig } from "./config";
import { handleOptions, json } from "./lib/http";

export const config = runtimeConfig;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  return json(res, 200, {
    ok: true,
    api: true,
    version: 2,
    mongoConfigured: !!process.env.MONGODB_URI,
    jwtConfigured: !!process.env.JWT_SECRET,
  });
}
