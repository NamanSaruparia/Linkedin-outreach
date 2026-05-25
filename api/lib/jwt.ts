import crypto from "node:crypto";

const SECRET = process.env.JWT_SECRET;

function getSecret(): string {
  if (!SECRET || SECRET.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 characters)");
  }
  return SECRET;
}

function base64urlJson(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

export async function signToken(mobile: string): Promise<string> {
  const header = base64urlJson({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlJson({
    mobile,
    iat: now,
    exp: now + 30 * 24 * 3600,
  });
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export async function verifyToken(
  token: string
): Promise<{ mobile: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { mobile?: unknown; exp?: number };

    if (typeof data.exp === "number" && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const mobile = data.mobile;
    if (typeof mobile !== "string" || mobile.length !== 10) return null;
    return { mobile };
  } catch {
    return null;
  }
}

export function getBearerToken(
  authHeader: string | undefined
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
