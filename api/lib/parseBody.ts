import type { VercelRequest } from "@vercel/node";

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
