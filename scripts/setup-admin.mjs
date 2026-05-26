import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const URI = env.MONGODB_URI;
if (!URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const REAL_ADMIN = {
  email: env.ADMIN_EMAIL || "entremamanetmoicook@gmail.com",
  name: env.ADMIN_NAME || "Viji Tinot",
  password: env.ADMIN_PASSWORD || "change-me",
  role: "admin",
};

const client = new MongoClient(URI);
await client.connect();
const db = client.db();
const users = db.collection("users");

// 1. Supprimer les comptes démo
const demoEmails = ["admin@demo.com", "client@demo.com"];
const del = await users.deleteMany({ email: { $in: demoEmails } });
console.log(`✓ Comptes démo supprimés (${del.deletedCount})`);

// 2. Créer/upgrader le vrai admin de Viji
const hash = await bcrypt.hash(REAL_ADMIN.password, 12);
const result = await users.updateOne(
  { email: REAL_ADMIN.email },
  {
    $set: {
      email: REAL_ADMIN.email,
      name: REAL_ADMIN.name,
      role: REAL_ADMIN.role,
      passwordHash: hash,
      addresses: [],
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  { upsert: true }
);

if (result.upsertedCount > 0) {
  console.log(`✓ Compte admin créé pour ${REAL_ADMIN.email}`);
} else {
  console.log(`✓ Compte ${REAL_ADMIN.email} mis à jour (role admin, mot de passe rafraîchi)`);
}

// 3. Liste finale
const all = await users.find({}, { projection: { passwordHash: 0 } }).toArray();
console.log(`\nUtilisateurs présents (${all.length}):`);
all.forEach((u) => console.log(`  - ${u.email}  [${u.role}]  (${u.name || "?"})`));

await client.close();
