import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Subscriber from "@/models/Newsletter";
import { Types } from "mongoose";

// DELETE /api/newsletter/[id] — retirer un abonné (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    await connectDB();
    const sub = await Subscriber.findByIdAndDelete(id);
    if (!sub) {
      return NextResponse.json({ error: "Abonné introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter delete error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
