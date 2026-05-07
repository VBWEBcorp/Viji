import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";

// Load .env.local manually (this script runs outside Next.js)
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
const ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const BUCKET = env.R2_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
  console.error("Missing R2 env vars in .env.local");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

try {
  await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  console.log(`✓ Bucket "${BUCKET}" already exists.`);
} catch {
  try {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`✓ Bucket "${BUCKET}" created on Cloudflare R2.`);
    console.log("  → Open https://dash.cloudflare.com → R2 → " + BUCKET);
    console.log("  → Settings → Public Access → Allow, then paste the pub-xxx.r2.dev URL into R2_PUBLIC_URL.");
  } catch (e) {
    console.error("Failed to create bucket:", e.message);
    process.exit(1);
  }
}
