import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import AtelierSession from "@/models/AtelierSession";

const programBlockSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

const occurrenceSchema = z.object({
  date: z.string().min(1).max(80),
  dateISO: z.string().optional().or(z.literal("")),
  schedule: z.string().min(1).max(80),
  location: z.string().min(1).max(200),
});

const sessionUpdateSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Slug invalide").optional(),
  shortTitle: z.string().min(1).max(120).optional(),
  title: z.string().min(1).max(200).optional(),
  image: z.string().url().optional(),
  occurrences: z.array(occurrenceSchema).min(1).optional(),
  price: z.number().int().min(0).optional(),
  intro: z.string().min(1).max(2000).optional(),
  menu: z.string().min(1).max(1000).optional(),
  program: z.array(programBlockSchema).optional(),
  notes: z.array(programBlockSchema).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

/**
 * GET /api/ateliers/sessions/[slug] — public, retourne la session par slug.
 * Les sessions désactivées ne sont visibles que par l'admin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const sessionAuth = await auth();
    const isAdmin = sessionAuth?.user.role === "admin";

    const filter: Record<string, unknown> = { slug };
    if (!isAdmin) filter.isActive = true;

    const session = await AtelierSession.findOne(filter).lean();
    if (!session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("GET /api/ateliers/sessions/[slug] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/ateliers/sessions/[slug] — admin uniquement.
 * Permet de changer n'importe quel champ, y compris le slug.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionAuth = await auth();
    if (!sessionAuth || sessionAuth.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;
    const body = await req.json();
    const data = sessionUpdateSchema.parse(body);

    // Si le slug change, vérifier qu'il n'y a pas déjà une autre session avec.
    if (data.slug && data.slug !== slug) {
      const conflict = await AtelierSession.findOne({ slug: data.slug });
      if (conflict) {
        return NextResponse.json(
          { error: "Une autre session utilise déjà ce slug" },
          { status: 409 }
        );
      }
    }

    const updated = await AtelierSession.findOneAndUpdate(
      { slug },
      { $set: data },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("PUT /api/ateliers/sessions/[slug] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/ateliers/sessions/[slug] — admin uniquement.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sessionAuth = await auth();
    if (!sessionAuth || sessionAuth.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const deleted = await AtelierSession.findOneAndDelete({ slug });
    if (!deleted) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/ateliers/sessions/[slug] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
