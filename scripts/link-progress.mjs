/**
 * Push a JSON backup to MongoDB for mobile 8290656032
 *
 * Usage:
 *   1. Export backup from the app (Import → Backup JSON), or save as data/backup.json
 *   2. Set MONGODB_URI in .env.local
 *   3. node scripts/link-progress.mjs
 *   4. node scripts/link-progress.mjs path/to/backup.json
 */

import { readFileSync, existsSync } from "fs";
import { MongoClient } from "mongodb";

const TARGET_MOBILE = "8290656032";
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
  messageTemplate: "",
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
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

const backupPath =
  process.argv[2] || "data/backup.json";

if (!existsSync(backupPath)) {
  console.error(`File not found: ${backupPath}`);
  console.error("Export JSON from the app or pass a path argument.");
  process.exit(1);
}

const data = JSON.parse(readFileSync(backupPath, "utf8"));
const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("linkedin_outreach");
  const now = new Date();

  const doc = {
    mobile: TARGET_MOBILE,
    profile: { ...DEFAULT_PROFILE, ...data.profile },
    connections: data.connections ?? [],
    lastImportedAt: data.lastImportedAt ?? null,
    updatedAt: now,
    createdAt: now,
  };

  await db.collection("users").updateOne(
    { mobile: TARGET_MOBILE },
    { $set: doc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  console.log(
    `Linked ${doc.connections.length} connections to +91 ${TARGET_MOBILE.slice(0, 5)} ${TARGET_MOBILE.slice(5)}`
  );
} finally {
  await client.close();
}
