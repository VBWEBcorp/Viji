// Quick diagnostic : list AtelierSession documents in dev DB.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

// Parse .env.local manually (no dotenv dependency required).
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI manquant dans .env.local");
  process.exit(1);
}

await mongoose.connect(uri);
const col = mongoose.connection.db.collection("ateliersessions");

const docs = await col.find({}).toArray();
console.log(`\nNombre total de documents : ${docs.length}\n`);

for (const d of docs) {
  console.log(`- ${d.slug}`);
  console.log(`    isActive : ${d.isActive}`);
  console.log(`    occurrences : ${Array.isArray(d.occurrences) ? d.occurrences.length : "—"}`);
  if (Array.isArray(d.occurrences) && d.occurrences.length > 0) {
    for (const o of d.occurrences) {
      console.log(`      • ${o.date} · ${o.schedule} · ${o.location}`);
    }
  }
  console.log(`    legacy date : ${d.date || "—"}`);
  console.log(`    legacy location : ${d.location || "—"}`);
  console.log("");
}

await mongoose.disconnect();
