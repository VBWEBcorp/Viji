import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/indexing — Notify search engines of new/updated content
 *
 * Strategies (du plus fiable au plus simple):
 *
 * 1. Google Indexing API (necessite un Service Account Google)
 *    - Configurer GOOGLE_INDEXING_KEY en JSON dans .env
 *    - Le plus rapide : indexation en minutes
 *
 * 2. Google Sitemap Ping (gratuit, pas de cle)
 *    - GET https://www.google.com/ping?sitemap=URL_SITEMAP
 *    - Google lit ensuite le sitemap et decouvre les nouvelles pages
 *
 * 3. IndexNow (Bing, Yandex, Naver, Seznam)
 *    - POST/GET vers les endpoints IndexNow
 *    - Gratuit, pas de cle specifique requise
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { url, type } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const results: Record<string, string> = {};

    // 1. Google Indexing API (si la cle est configuree)
    const googleKey = process.env.GOOGLE_INDEXING_KEY;
    if (googleKey) {
      try {
        const keyData = JSON.parse(googleKey);
        const token = await getGoogleAccessToken(keyData);

        const res = await fetch(
          "https://indexing.googleapis.com/v3/urlNotifications:publish",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              url,
              type: type || "URL_UPDATED",
            }),
          }
        );

        if (res.ok) {
          results.google_indexing = "ok";
        } else {
          const err = await res.text();
          results.google_indexing = `error: ${err}`;
        }
      } catch (e) {
        results.google_indexing = `error: ${e}`;
      }
    } else {
      results.google_indexing = "skipped (no GOOGLE_INDEXING_KEY)";
    }

    // 2. Google Sitemap Ping
    if (baseUrl) {
      try {
        await fetch(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap.xml`)}`
        );
        results.google_sitemap_ping = "ok";
      } catch {
        results.google_sitemap_ping = "error";
      }
    }

    // 3. IndexNow (Bing + others)
    if (baseUrl) {
      try {
        const indexNowPayload = {
          host: new URL(baseUrl).hostname,
          urlList: [url],
        };

        await fetch("https://api.indexnow.org/IndexNow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(indexNowPayload),
        });
        results.indexnow = "ok";
      } catch {
        results.indexnow = "error";
      }
    }

    return NextResponse.json({
      message: "Notifications d'indexation envoyees",
      results,
    });
  } catch (error) {
    console.error("POST /api/indexing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Obtenir un access token Google via un Service Account
 * Necessite GOOGLE_INDEXING_KEY = JSON du service account
 */
async function getGoogleAccessToken(keyData: {
  client_email: string;
  private_key: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Import crypto for JWT signing
  const crypto = await import("crypto");

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const claimB64 = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signInput = `${headerB64}.${claimB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signInput);
  const signature = sign.sign(keyData.private_key, "base64url");

  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
