import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not configured");
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    global._mongoClient = client;
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined;
      global._mongoClient = undefined;
      throw err;
    });
  }

  const client = await global._mongoClientPromise;
  return client.db("linkedin_outreach");
}

export const USERS_COLLECTION = "users";
