import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  uri: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function resolveUri(): Promise<string> {
  if (cached.uri) return cached.uri;

  const envUri = process.env.MONGODB_URI;
  if (envUri) {
    cached.uri = envUri;
    return envUri;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  // Dev fallback: spin up an in-memory MongoDB so the app can render without setup.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create();
  cached.uri = mem.getUri();
  console.log("[db] No MONGODB_URI set — using in-memory MongoDB:", cached.uri);
  return cached.uri;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = resolveUri().then(async (uri) => {
      const conn = await mongoose.connect(uri, { bufferCommands: false });
      // Compte admin depuis les variables d'env (dev ET prod) — idempotent.
      const { ensureAdminUser } = await import("./ensureAdmin");
      await ensureAdminUser();
      // Auto-seed in dev (in-memory or real Atlas). Production is protected inside the seed function.
      if (process.env.NODE_ENV !== "production") {
        const { ensureDevSeed } = await import("./devSeed");
        await ensureDevSeed(uri);
      }
      return conn;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
