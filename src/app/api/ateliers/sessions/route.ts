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

const sessionSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  shortTitle: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  image: z.string().url(),
  occurrences: z.array(occurrenceSchema).min(1, "Au moins une date+lieu requise"),
  price: z.number().int().min(0),
  intro: z.string().min(1).max(2000),
  menu: z.string().min(1).max(1000),
  program: z.array(programBlockSchema).default([]),
  notes: z.array(programBlockSchema).default([]),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

/**
 * GET /api/ateliers/sessions
 * Liste publique : sessions actives uniquement, triées par date ISO ascendante
 * (puis par ordre manuel). L'admin peut passer `?all=true` pour voir les
 * sessions désactivées aussi.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    const session = await auth();
    const isAdmin = session?.user.role === "admin";

    const filter: Record<string, unknown> = {};
    if (!all || !isAdmin) filter.isActive = true;

    const sessions = await AtelierSession.find(filter)
      .sort({ dateISO: 1, order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/ateliers/sessions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/ateliers/sessions — admin uniquement.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const data = sessionSchema.parse(body);

    const existing = await AtelierSession.findOne({ slug: data.slug });
    if (existing) {
      return NextResponse.json(
        { error: "Une session avec ce slug existe déjà" },
        { status: 409 }
      );
    }

    const created = await AtelierSession.create(data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/ateliers/sessions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
