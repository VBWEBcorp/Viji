import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "8 caractères minimum"),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Demandez-en un nouveau." },
        { status: 400 }
      );
    }

    user.passwordHash = password; // hashé par le pre-save hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET pour vérifier la validité d'un token (utilisé par la page de reset
// pour afficher un message d'erreur immédiat si le lien est mort).
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ valid: false }, { status: 400 });

    await connectDB();
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select("email");

    return NextResponse.json({ valid: !!user, email: user?.email || null });
  } catch (error) {
    console.error("GET /api/auth/reset-password error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
