import { NextRequest, NextResponse } from "next/server";
import { getShippingRates } from "@/lib/sendcloud";

// GET /api/shipping?country=FR&weight=500
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country") || "FR";
    const weight = parseInt(searchParams.get("weight") || "500");

    const rates = await getShippingRates(country, weight);

    return NextResponse.json(rates);
  } catch (error) {
    console.error("GET /api/shipping error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
