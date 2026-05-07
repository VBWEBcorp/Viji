import { readFileSync } from "node:fs";

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

const ACCOUNT_ID = env.R2_ACCOUNT_ID;
const TOKEN = env.CLOUDFLARE_API_TOKEN;
const BUCKET = env.R2_BUCKET_NAME;

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/domains/managed`,
  { headers: { Authorization: `Bearer ${TOKEN}` } }
);

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
