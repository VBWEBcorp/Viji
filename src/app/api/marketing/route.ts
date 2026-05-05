import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Marketing from "@/models/Marketing";

// GET /api/marketing
export async function GET() {
  try {
    await connectDB();
    let marketing = await Marketing.findOne().lean();

    if (!marketing) {
      marketing = await Marketing.create({});
    }

    return NextResponse.json(marketing);
  } catch (error) {
    console.error("GET /api/marketing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/marketing
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    let marketing = await Marketing.findOne();
    if (marketing) {
      Object.assign(marketing, body);
      await marketing.save();
    } else {
      marketing = await Marketing.create(body);
    }

    return NextResponse.json(marketing);
  } catch (error) {
    console.error("POST /api/marketing error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
