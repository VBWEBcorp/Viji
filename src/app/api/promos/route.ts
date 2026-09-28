import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import PromoCode from "@/models/PromoCode";
import { z } from "zod";

// GET /api/promos
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(promos);
  } catch (error) {
    console.error("GET /api/promos error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const promoSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("Indiquez le montant de la réduction"),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional(),
  validFrom: z.string(),
  validUntil: z.string(),
  isActive: z.boolean().optional(),
});

// POST /api/promos
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const validated = promoSchema.parse(body);

    if (validated.type === "percentage" && validated.value > 100) {
      return NextResponse.json(
        { error: "Un pourcentage ne peut pas dépasser 100 %" },
        { status: 400 }
      );
    }

    await connectDB();

    const code = validated.code.trim().toUpperCase();
    if (await PromoCode.exists({ code })) {
      return NextResponse.json(
        { error: `Le code ${code} existe déjà` },
        { status: 400 }
      );
    }

    // Les dates arrivent en « AAAA-MM-JJ ». Lues telles quelles, elles
    // tombent à minuit : un code « valable jusqu'au 31/12 » cessait de marcher
    // dès le matin du 31. On couvre donc la journée entière (heure de Paris).
    const debut = debutJourParis(validated.validFrom);
    const fin = finJourParis(validated.validUntil);
    if (fin < debut) {
      return NextResponse.json(
        { error: "La date de fin est avant la date de début" },
        { status: 400 }
      );
    }

    const promo = await PromoCode.create({
      ...validated,
      code,
      validFrom: debut,
      validUntil: fin,
      value: validated.type === "fixed" ? validated.value * 100 : validated.value,
      minOrderAmount: validated.minOrderAmount
        ? validated.minOrderAmount * 100
        : undefined,
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/promos error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/promos : activer / désactiver un code sans le supprimer.
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, isActive } = await req.json();
    if (typeof id !== "string" || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await connectDB();
    const promo = await PromoCode.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    if (!promo) {
      return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
    }
    return NextResponse.json(promo);
  } catch (error) {
    console.error("PATCH /api/promos error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** Décalage de Paris par rapport à UTC à une date donnée (+1 h ou +2 h). */
function decalageParis(d: Date): number {
  const paris = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return paris.getTime() - utc.getTime();
}

function debutJourParis(jour: string): Date {
  const utc = new Date(`${jour.slice(0, 10)}T00:00:00Z`);
  return new Date(utc.getTime() - decalageParis(utc));
}

function finJourParis(jour: string): Date {
  const utc = new Date(`${jour.slice(0, 10)}T23:59:59Z`);
  return new Date(utc.getTime() - decalageParis(utc));
}

// DELETE /api/promos
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { id } = await req.json();
    await PromoCode.findByIdAndDelete(id);
    return NextResponse.json({ message: "Code promo supprimé" });
  } catch (error) {
    console.error("DELETE /api/promos error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
