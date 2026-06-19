import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Newsletter";
import { verifyUnsubscribeToken } from "@/lib/newsletter";
import { SHOP_NAME, EMAIL_COLORS, esc } from "@/lib/email-layout";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "/").replace(/\/$/, "");
const C = EMAIL_COLORS;

function htmlPage(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;background:${C.cream};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">
    <div style="max-width:480px;margin:64px auto;padding:0 16px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:12px;letter-spacing:0.5em;text-transform:uppercase;color:${C.gold};margin:0 0 24px;">${esc(SHOP_NAME)}</p>
      <div style="background:#fff;border:1px solid ${C.border};border-radius:16px;padding:40px 32px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:${C.ink};">${esc(title)}</h1>
        <p style="margin:0 0 24px;color:${C.body};font-size:15px;line-height:1.7;">${body}</p>
        <a href="${SITE_URL || "/"}" style="display:inline-block;background:${C.gold};color:#fff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;padding:13px 28px;border-radius:10px;">Retour à la boutique</a>
      </div>
    </div>
  </body>
</html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

// GET /api/newsletter/unsubscribe — désinscription via lien signé (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("e") || "").trim().toLowerCase();
    const token = searchParams.get("t") || "";

    if (!email || !token || !verifyUnsubscribeToken(email, token)) {
      return htmlPage(
        "Lien invalide",
        "Ce lien de désinscription est invalide ou a expiré. Vous pouvez nous contacter directement si besoin.",
        400
      );
    }

    await connectDB();
    await Subscriber.updateOne({ email }, { status: "unsubscribed" });

    return htmlPage(
      "Désinscription confirmée",
      `L'adresse <strong>${esc(
        email
      )}</strong> ne recevra plus nos e-mails. Vous pouvez vous réinscrire à tout moment depuis le site.`
    );
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return htmlPage("Une erreur est survenue", "Veuillez réessayer plus tard.", 500);
  }
}
