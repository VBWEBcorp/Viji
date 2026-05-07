import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

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

const client = new MongoClient(URI);
await client.connect();
const db = client.db();

const users = await db.collection("users").find({}, { projection: { passwordHash: 0 } }).toArray();
console.log(`✓ ${users.length} utilisateur(s) dans la base "${db.databaseName}":\n`);
users.forEach((u) => {
  console.log(`- ${u.email}  [${u.role}]  (${u.name || "?"})`);
});

await client.close();
