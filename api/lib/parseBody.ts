import type { VercelRequest } from "@vercel/node";

/** Vercel serverless body limit is ~4.5MB */
export const MAX_BODY_BYTES = 4 * 1024 * 1024;

export function estimateBodyBytes(req: VercelRequest): number {
  const raw = req.body;
  if (raw == null) return 0;
  if (typeof raw === "string") return Buffer.byteLength(raw, "utf8");
  try {
    return Buffer.byteLength(JSON.stringify(raw), "utf8");
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

export function parseJsonBody<T>(req: VercelRequest): T {
  const raw = req.body;
  if (raw == null || raw === "") return {} as T;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return {} as T;
    }
  }
  return {} as T;
}
