import { connectDB } from "./db";
import Content from "@/models/Content";

export type ContentMap = Record<string, string>;

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
