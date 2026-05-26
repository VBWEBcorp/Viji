import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { checkBalance, GiftCardError } from "@/lib/giftcard";
import { z } from "zod";

const schema = z.object({
  code: z.string().trim().min(1, "Code requis"),
});

// POST /api/gift-cards/check-balance — vérifie le solde d'une carte (public)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code } = schema.parse(body);

    const result = await checkBalance(code);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/gift-cards/check-balance error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
