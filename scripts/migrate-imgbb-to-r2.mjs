/**
 * Migre vers le bucket R2 du client toutes les images ImgBB encore référencées
 * en base (produits, catégories, articles, sessions d'atelier, commandes...).
 *
 * Le commit e1029b2 avait migré les images écrites en dur dans le code, mais pas
 * celles stockées en base — et il a retiré i.ibb.co des domaines autorisés dans
 * next.config.ts. Résultat : toutes les images venant de la base étaient refusées
 * par next/image et s'affichaient cassées.
 *
 * Mêmes précautions que la première migration :
 *   - le nom du fichier dérive de l'identifiant ImgBB, donc relancer ne crée pas
 *     de doublons et retrouve les fichiers déjà déposés ;
 *   - une image qui ne répond nulle part n'est PAS réécrite : on garde l'ancienne
 *     adresse plutôt que d'en écrire une morte ;
 *   - rien n'est écrit en base tant que toutes les images n'ont pas été traitées.
 *
 * Usage : node scripts/migrate-imgbb-to-r2.mjs [--dry-run]
 */
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";

const DRY_RUN = process.argv.includes("--dry-run");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const PUBLIC_URL = env.R2_PUBLIC_URL;
const BUCKET = env.R2_BUCKET_NAME;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const CONTENT_TYPES = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", avif: "image/avif",
};

/** https://i.ibb.co/vCvRn5N0/Chutney-Tomate.jpg -> images/vCvRn5N0-chutney-tomate.jpg */
function r2KeyFor(imgbbUrl) {
  const { pathname } = new URL(imgbbUrl);
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[0];
  const file = decodeURIComponent(parts[parts.length - 1]);
  const dot = file.lastIndexOf(".");
  const base = (dot === -1 ? file : file.slice(0, dot))
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const ext = dot === -1 ? "jpg" : file.slice(dot + 1).toLowerCase();
  return `images/${id}-${base}.${ext}`;
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyToR2(imgbbUrl, key) {
  const res = await fetch(imgbbUrl);
  if (!res.ok) throw new Error(`ImgBB a répondu ${res.status}`);
  const body = Buffer.from(await res.arrayBuffer());
  const ext = key.slice(key.lastIndexOf(".") + 1);
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: res.headers.get("content-type") || CONTENT_TYPES[ext] || "image/jpeg",
  }));
  return body.length;
}

/** Parcourt un document et renvoie les chemins des chaînes contenant une URL ImgBB. */
function findImgbbPaths(node, path, out) {
  if (typeof node === "string") {
    if (/^https?:\/\/i\.ibb\.co\//i.test(node.trim())) out.push({ path, url: node.trim() });
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => findImgbbPaths(v, path ? `${path}.${i}` : String(i), out));
    return out;
  }
  if (node && typeof node === "object" && node.constructor === Object) {
    for (const [k, v] of Object.entries(node)) findImgbbPaths(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db();

// ---- 1. Inventaire ---------------------------------------------------------
const collections = await db.listCollections().toArray();
const updates = []; // { collection, id, path, url }
for (const c of collections) {
  for (const doc of await db.collection(c.name).find({}).toArray()) {
    for (const hit of findImgbbPaths(doc, "", [])) {
      updates.push({ collection: c.name, id: doc._id, ...hit });
    }
  }
}

const distinct = [...new Set(updates.map((u) => u.url))];
console.log(`${distinct.length} image(s) ImgBB distincte(s) sur ${updates.length} emplacement(s) en base.\n`);

// ---- 2. Dépôt dans le bucket (rien n'est écrit en base à ce stade) ----------
const mapping = new Map();
const failed = [];

for (const url of distinct) {
  const key = r2KeyFor(url);
  try {
    if (await existsInR2(key)) {
      console.log(`  déjà dans le bucket   ${key}`);
    } else if (DRY_RUN) {
      const head = await fetch(url, { method: "HEAD" });
      if (!head.ok) throw new Error(`ImgBB a répondu ${head.status}`);
      console.log(`  à déposer             ${key}`);
    } else {
      const size = await copyToR2(url, key);
      console.log(`  déposé (${String(Math.round(size / 1024)).padStart(5)} Ko)   ${key}`);
    }
    mapping.set(url, `${PUBLIC_URL}/${key}`);
  } catch (err) {
    console.log(`  ÉCHEC                 ${url}\n      ${err.message}`);
    failed.push({ url, reason: err.message });
  }
}

// ---- 3. Réécriture de la base ---------------------------------------------
if (failed.length) {
  console.log(`\n${failed.length} image(s) introuvable(s) : la base n'est PAS modifiée.`);
  console.log("Corrigez ces images d'abord, plutôt que d'écrire des adresses mortes.");
  await client.close();
  process.exit(1);
}

if (DRY_RUN) {
  console.log(`\n[dry-run] ${updates.length} emplacement(s) seraient réécrits. Rien n'a été modifié.`);
  await client.close();
  process.exit(0);
}

const byDoc = new Map();
for (const u of updates) {
  const k = `${u.collection}|${u.id}`;
  if (!byDoc.has(k)) byDoc.set(k, { collection: u.collection, id: u.id, set: {} });
  byDoc.get(k).set[u.path] = mapping.get(u.url);
}

let written = 0;
for (const { collection, id, set } of byDoc.values()) {
  const res = await db.collection(collection).updateOne({ _id: id }, { $set: set });
  written += res.modifiedCount;
}

console.log(`\n${written} document(s) mis à jour, ${updates.length} adresse(s) réécrite(s).`);
await client.close();
