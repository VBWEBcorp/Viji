import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Reservation from "@/models/Reservation";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/reservations — liste paginée (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(sp.get("limit") || "20", 10));
    const type = sp.get("type") || "";
    const status = sp.get("status") || "";
    const search = sp.get("search") || "";

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [
        { reservationNumber: rx },
        { customerName: rx },
        { customerEmail: rx },
        { customerPhone: rx },
        { atelierTitle: rx },
      ];
    }

    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Reservation.countDocuments(query),
    ]);

    return NextResponse.json({
      reservations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
