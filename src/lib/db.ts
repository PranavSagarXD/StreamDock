import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __streamdock_mongo: { client: MongoClient | null; promise: Promise<MongoClient> | null } | undefined;
}

const g = globalThis as typeof globalThis & {
  __streamdock_mongo?: { client: MongoClient | null; promise: Promise<MongoClient> | null };
};

if (!g.__streamdock_mongo) g.__streamdock_mongo = { client: null, promise: null };

async function getClient(): Promise<MongoClient> {
  const store = g.__streamdock_mongo!;
  if (store.client) return store.client;
  if (!store.promise) {
    const uri = env.MONGODB_URI();
    store.promise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
    }).connect();
  }
  store.client = await store.promise;
  return store.client;
}

let indexesEnsured = false;

export async function db(): Promise<Db> {
  const client = await getClient();
  const database = client.db(env.DB_NAME());
  if (!indexesEnsured) {
    indexesEnsured = true;
    ensureIndexes(database).catch(console.error);
  }
  return database;
}

async function ensureIndexes(database: Db) {
  await Promise.all([
    database.collection(COLLECTIONS.sessions).createIndex({ sid: 1 }, { unique: true }),
    database.collection(COLLECTIONS.sessions).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection(COLLECTIONS.admins).createIndex({ githubLogin: 1 }, { unique: true }),
    database.collection(COLLECTIONS.siteRequests).createIndex({ submittedAt: -1 }),
    database.collection(COLLECTIONS.siteRequests).createIndex({ status: 1, submittedAt: -1 }),
    database.collection(COLLECTIONS.auditLog).createIndex({ at: -1 }),
    database.collection(COLLECTIONS.cache).createIndex({ key: 1 }, { unique: true }),
  ]);
}

export const COLLECTIONS = {
  sessions: "sessions",
  admins: "admins",
  auditLog: "auditLog",
  siteRequests: "siteRequests",
  cache: "cache",
} as const;


