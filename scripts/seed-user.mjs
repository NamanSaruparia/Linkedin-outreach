/**
 * Create / ensure user 8290656032 in MongoDB
 *
 * Usage:
 *   1. Add MONGODB_URI to .env.local (copy from Vercel or Atlas)
 *   2. npm run seed:user
 */

import { readFileSync, existsSync } from "fs";
import { MongoClient } from "mongodb";

const MOBILE = "8290656032";

const DEFAULT_PROFILE = {
  name: "",
  headline: "",
  education: "",
  skills: "",
  about: "",
  outreachPurpose:
    "live projects, internships, and hands-on opportunities where I can contribute and learn",
  outreachWhy:
    "I'm building my career and would value guidance from people whose work and journey I respect.",
  callToAction:
    "If you have anything coming up, know of openings, or would be open to a brief chat, I'd truly appreciate it.",
  tone: "professional",
  messageMode: "auto",
  messageTemplate: `Hi {firstName},

{hook}

I'm {yourName}, and I'm currently exploring opportunities to learn and contribute through live projects and internships.

I'd love to hear if you have anything coming up or could point me in the right direction.

Thank you for your time!

Best regards,
{yourName}`,
  templateAutoTweak: true,
};

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI — add it to .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("linkedin_outreach");
  const users = db.collection("users");
  const now = new Date();

  const existing = await users.findOne({ mobile: MOBILE });

  if (existing) {
    console.log(`User already exists: +91 ${MOBILE.slice(0, 5)} ${MOBILE.slice(5)}`);
    console.log(`  Connections: ${existing.connections?.length ?? 0}`);
  } else {
    await users.insertOne({
      mobile: MOBILE,
      profile: { ...DEFAULT_PROFILE },
      connections: [],
      lastImportedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created user: +91 ${MOBILE.slice(0, 5)} ${MOBILE.slice(5)}`);
  }
} finally {
  await client.close();
}
