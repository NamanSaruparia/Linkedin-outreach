import type { VercelRequest, VercelResponse } from "@vercel/node";

export function setCors(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function setStatus(res: VercelResponse, code: number): void {
  if (typeof res.status === "function") {
    res.status(code);
  } else {
    res.statusCode = code;
  }
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  setCors(res);
  if (req.method === "OPTIONS") {
    setStatus(res, 204);
    res.end();
    return true;
  }
  return false;
}

export function json(
  res: VercelResponse,
  status: number,
  body: unknown
): void {
  setCors(res);
  setStatus(res, status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/** Prevent unhandled crashes from showing Vercel's generic 500 page */
export function withApiGuard(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error("API unhandled error:", err);
      if (!res.headersSent) {
        json(res, 500, {
          error: err instanceof Error ? err.message : "Internal server error",
        });
      }
    }
  };
}
