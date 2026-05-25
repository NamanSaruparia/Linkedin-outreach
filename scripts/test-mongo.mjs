/**
 * Test MongoDB connection from MONGODB_URI in env or .env.local
 */
import { readFileSync, existsSync } from "fs";
import { MongoClient } from "mongodb";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim();
      }
    }
  }
}

loadEnv();
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Set MONGODB_URI in .env.local or environment");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db("linkedin_outreach");
  const count = await db.collection("users").countDocuments();
  console.log("✓ MongoDB connected");
  console.log(`  Database: linkedin_outreach, users: ${count}`);
} catch (e) {
  console.error("✗ MongoDB failed:", e.message);
  process.exit(1);
} finally {
  await client.close();
}
