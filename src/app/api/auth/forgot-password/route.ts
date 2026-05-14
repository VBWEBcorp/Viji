import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendEmail } from "@/lib/resend";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await User.findOne({ email: email.toLowerCase() });

    // Réponse identique en cas d'utilisateur introuvable, pour ne pas révéler
    // l'existence ou non d'un compte (énumération d'emails).
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
      await user.save();

      const origin = req.nextUrl.origin;
      const link = `${origin}/reinitialiser-mot-de-passe?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe – Entre Maman et Moi",
        html: resetEmailHtml(user.name, link),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function resetEmailHtml(name: string, link: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#faf6ee; margin:0; padding:0;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:48px 32px;">
    <p style="font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:#b08438; margin:0 0 20px;">Entre Maman et Moi</p>
    <h1 style="font-family:Georgia, serif; font-size:28px; color:#111827; margin:0 0 24px;">Bonjour ${escapeHtml(name)},</h1>
    <p style="font-size:15px; line-height:1.7; color:#374151;">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau (lien valable 1 heure) :</p>
    <p style="margin:32px 0;">
      <a href="${link}" style="display:inline-block; background:#b08438; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:13px; letter-spacing:0.2em; text-transform:uppercase;">Choisir mon mot de passe</a>
    </p>
    <p style="font-size:13px; color:#6b7280; line-height:1.7;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
    <p style="font-size:13px; color:#6b7280; word-break:break-all; margin-top:24px;">Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:<br/>${link}</p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}
