import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import SiteSettings from "@/models/SiteSettings";
import { invalidateApiKeysCache } from "@/lib/apikeys";

// GET /api/settings
export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne().lean();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    let settings = await SiteSettings.findOne();

    if (settings) {
      Object.assign(settings, body);
      await settings.save();
    } else {
      settings = await SiteSettings.create(body);
    }

    // Invalider le cache des clés API
    invalidateApiKeysCache();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
