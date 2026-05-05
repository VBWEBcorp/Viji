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
  value: z.number().min(0),
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

    await connectDB();

    const promo = await PromoCode.create({
      ...validated,
      code: validated.code.toUpperCase(),
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
