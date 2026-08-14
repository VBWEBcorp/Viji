import mongoose from "mongoose";

import { connectDB } from "@/lib/db";

// Fichiers texte servis à la racine du site (llms.txt) et tenus à jour par PHARE
// (outil SEO de l'agence) via l'action `file` de /api/phare/publish.
//
// Pourquoi la base et non public/ : le site tourne en hébergement serverless, où
// le système de fichiers est en lecture seule. Un dépôt écrit dans public/ ne
// survivrait pas à la requête, et un fichier statique de public/ masquerait la
// route qui le sert. La version du dépôt reste le repli : si la base est vide ou
// injoignable, /llms.txt répond quand même.

const COLLECTION = "siteFiles";

// Type (et non interface) : le pilote MongoDB exige un type indexable.
export type SiteFile = {
  path: string;
  content: string;
  contentType: string;
  updatedAt: Date;
};

// Liste blanche : la route de réception ne doit pas devenir un dépôt de fichiers
// arbitraires à la racine du site.
const ALLOWED_PATHS = new Set(["llms.txt"]);

export function normalizeSiteFilePath(path: string): string {
  return path.trim().replace(/^\/+/, "").toLowerCase();
}

export function isAllowedSiteFile(path: string): boolean {
  return ALLOWED_PATHS.has(normalizeSiteFilePath(path));
}

async function siteFiles() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Connexion à la base de données indisponible");
  return db.collection<SiteFile>(COLLECTION);
}

/** Contenu déposé par PHARE, ou `null` si rien n'a jamais été déposé. */
export async function readSiteFile(path: string): Promise<string | null> {
  const doc = await (await siteFiles()).findOne({ path: normalizeSiteFilePath(path) });
  return doc?.content?.trim() ? doc.content : null;
}

/** Dépôt (ou remplacement) d'un fichier de la racine. Upsert par chemin. */
export async function writeSiteFile(file: {
  path: string;
  content: string;
  contentType?: string;
}): Promise<void> {
  await (await siteFiles()).updateOne(
    { path: normalizeSiteFilePath(file.path) },
    {
      $set: {
        content: file.content,
        contentType: file.contentType?.trim() || "text/plain; charset=utf-8",
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}
