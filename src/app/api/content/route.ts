import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Content from "@/models/Content";

/**
 * Vide le cache de rendu de tout le site (toutes les routes sous le layout
 * racine) pour que les modifications de contenu — y compris le footer présent
 * sur chaque page — apparaissent immédiatement après enregistrement.
 */
function revalidateSite() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // revalidation best-effort : ne bloque jamais la sauvegarde.
  }
}

// GET /api/content — Liste ou single par key
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const content = await Content.findOne({ key }).lean();
      return NextResponse.json(content || { key, value: "" });
    }

    const contents = await Content.find().sort({ key: 1 }).lean();
    return NextResponse.json(contents);
  } catch (error) {
    console.error("GET /api/content error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/content — Créer ou mettre à jour (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const content = await Content.findOneAndUpdate(
      { key: body.key },
      {
        ...body,
        updatedBy: session.user.id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    revalidateSite();
    return NextResponse.json(content);
  } catch (error) {
    console.error("POST /api/content error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/content
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { key } = await req.json();

    await Content.findOneAndDelete({ key });
    revalidateSite();
    return NextResponse.json({ message: "Contenu supprimé" });
  } catch (error) {
    console.error("DELETE /api/content error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
