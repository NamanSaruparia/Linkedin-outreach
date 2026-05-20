import { SignJWT, jwtVerify } from "jose";

const SECRET = process.env.JWT_SECRET;

function getSecretKey(): Uint8Array {
  if (!SECRET || SECRET.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(SECRET);
}

export async function signToken(mobile: string): Promise<string> {
  return new SignJWT({ mobile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifyToken(
  token: string
): Promise<{ mobile: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const mobile = payload.mobile;
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
