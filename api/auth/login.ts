import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, USERS_COLLECTION } from "../lib/mongodb";
import { signToken } from "../lib/jwt";
import { handleOptions, json } from "../lib/http";
import { DEFAULT_PROFILE, type UserDocument } from "../lib/types";

/** Any 10-digit number — open access, no whitelist */
function normalizeMobile(input: string): string | null {
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = req.body as { mobile?: string };
    const mobile = normalizeMobile(body?.mobile ?? "");

    if (!mobile) {
      return json(res, 400, { error: "Enter a 10-digit mobile number" });
    }

    const db = await getDb();
    const users = db.collection<UserDocument>(USERS_COLLECTION);
    const now = new Date();

    const existing = await users.findOne({ mobile });
    if (!existing) {
      await users.insertOne({
        mobile,
        profile: { ...DEFAULT_PROFILE },
        connections: [],
        lastImportedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await users.updateOne({ mobile }, { $set: { updatedAt: now } });
    }

    const token = await signToken(mobile);

    return json(res, 200, {
      token,
      mobile,
      displayMobile: `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`,
    });
  } catch (err) {
    console.error("Login error:", err);
    const message =
      err instanceof Error ? err.message : "Login failed";
    return json(res, 500, { error: message });
  }
}
