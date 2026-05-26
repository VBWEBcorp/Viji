import { connectDB } from "./db";
import Content from "@/models/Content";
import { CONTENT_DEFAULTS } from "./content/registry";

export type ContentMap = Record<string, string>;

/**
 * Lecteur de contenu pour les pages publiques (server components).
 *
 * Charge tous les contenus enregistrés en base, puis renvoie une fonction
 * `t(key)` qui retourne la valeur enregistrée si présente, sinon la valeur par
 * défaut du registre (le texte/l'image réel actuel). Ainsi une page affiche
 * toujours quelque chose, et l'admin contrôle réellement le rendu dès qu'une
 * valeur est sauvegardée.
 *
 * Usage :
 *   const t = await getContent();
 *   <h1>{t("home_hero_title")}</h1>
 */
export async function getContent(): Promise<(key: string) => string> {
  const map: ContentMap = {};
  try {
    await connectDB();
    const docs = await Content.find().lean();
    docs.forEach((d) => {
      if (d.value != null) map[d.key] = d.value as string;
    });
  } catch {
    // En cas d'échec DB, on retombe entièrement sur les défauts.
  }
  return (key: string): string => {
    const v = map[key];
    if (v != null && String(v).trim().length > 0) return v;
    return CONTENT_DEFAULTS[key]?.default ?? "";
  };
}

/**
 * Fetch multiple content blocks at once. Use in server components.
 * Returns a map of key → value. Missing keys are simply absent from the map.
 */
export async function getContents(keys: string[]): Promise<ContentMap> {
  await connectDB();
  const docs = await Content.find({ key: { $in: keys } }).lean();
  const map: ContentMap = {};
  docs.forEach((d) => {
    if (d.value) map[d.key] = d.value;
  });
  return map;
}

/**
 * Helper to read from a ContentMap with a fallback.
 */
export function c(map: ContentMap, key: string, fallback: string): string {
  const v = map[key];
  return v && v.trim().length > 0 ? v : fallback;
}
