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

/**
 * Le jeu de donnees de demonstration n'a le droit de s'executer que sur une
 * base locale (serveur en memoire ou MongoDB installe sur le poste). Toute
 * autre base est consideree comme reelle et laissee intacte, sauf demande
 * explicite via ALLOW_DEV_SEED=1.
 */
export function seedAutorise(uri: string): boolean {
  if (process.env.ALLOW_DEV_SEED === "1") return true;

  const local = /(^|@|\/\/)(localhost|127\.0\.0\.1|\[::1\])[:\/]/.test(uri);
  if (!local) {
    console.warn(
      "[db] Base distante detectee : jeu de donnees de demonstration ignore. " +
        "Il ecraserait les produits et reglages reels. Forcer avec ALLOW_DEV_SEED=1."
    );
  }
  return local;
}

/**
 * Options de connexion pour un site serverless sur un cluster partagé
 * (500 connexions au total, une vingtaine de sites) : peu de connexions par
 * instance, rendues dès qu'elles ne servent plus, et un échec rapide plutôt
 * qu'une requête qui attend 30 s.
 */
const OPTIONS_CONNEXION = {
  bufferCommands: false,
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30_000,
  serverSelectionTimeoutMS: 8_000,
} as const;

/** Erreur passagère (réseau, TLS, cluster saturé) : un nouvel essai a du sens. */
export function erreurReseau(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  const nom = e?.name ?? "";
  const message = e?.message ?? "";
  return (
    /MongoNetwork|MongoServerSelection|MongooseServerSelection|MongoPoolCleared|MongoTopologyClosed/.test(
      nom
    ) || /ECONNRESET|ETIMEDOUT|EPIPE|socket|tlsv1|SSL alert/i.test(message)
  );
}

async function ouvrir(uri: string): Promise<typeof mongoose> {
  try {
    return await mongoose.connect(uri, OPTIONS_CONNEXION);
  } catch (err) {
    if (!erreurReseau(err)) throw err;
    // Un seul nouvel essai, après une courte pause.
    console.warn("[db] Connexion échouée, nouvel essai :", (err as Error).message);
    await mongoose.disconnect().catch(() => {});
    await new Promise((r) => setTimeout(r, 400));
    return mongoose.connect(uri, OPTIONS_CONNEXION);
  }
}

export async function connectDB() {
  if (cached.conn) {
    // 0 = déconnectée : la connexion en cache est morte, on en rouvre une.
    if (mongoose.connection.readyState !== 0) return cached.conn;
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = resolveUri().then(async (uri) => {
      const conn = await ouvrir(uri);
      // Compte admin depuis les variables d'env (dev ET prod) — idempotent.
      const { ensureAdminUser } = await import("./ensureAdmin");
      await ensureAdminUser();
      // Jeu de donnees de demonstration : uniquement sur une base locale.
      //
      // Il ne se contente pas de remplir une base vide : il reecrit les noms,
      // descriptions, prix et images des produits du catalogue, remet les
      // reglages de contact, et recree les sessions d'atelier supprimees. Sur
      // une base de developpement jetable, c'est commode. Sur la base de
      // production, un simple `next dev` lance sur le poste d'un developpeur
      // ecrasait les prix modifies depuis l'admin et faisait reapparaitre des
      // ateliers retires du site, en direct, puisque les pages du catalogue
      // sont en rendu dynamique.
      //
      // On ne l'execute donc que sur une base locale, ou sur demande explicite
      // via ALLOW_DEV_SEED=1 (base de test distante, par exemple).
      if (process.env.NODE_ENV !== "production" && seedAutorise(uri)) {
        const { ensureDevSeed } = await import("./devSeed");
        await ensureDevSeed(uri);
      }
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Ne jamais garder une promesse rejetée : sinon toutes les requêtes
    // suivantes de l'instance échouent sans réessayer (panne du 18/11/2026).
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
  return cached.conn;
}
