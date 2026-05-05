import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import User from "@/models/User";

// PUT /api/account/profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { name, phone } = await req.json();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    console.error("PUT /api/account/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
