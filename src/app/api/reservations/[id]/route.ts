import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Reservation from "@/models/Reservation";
import { doitConfirmerVirement, envoyerVirementRecu, type ReservationVirement } from "@/lib/virement-recu";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "done", "cancelled"]),
});

// GET /api/reservations/[id] — détail (admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const reservation = await Reservation.findById(id).lean();
    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    return NextResponse.json(reservation);
  } catch (error) {
    console.error("GET /api/reservations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/reservations/[id] — mise à jour du statut (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { status } = patchSchema.parse(body);

    // L'état d'avant dit si le client doit apprendre que son virement est arrivé ;
    // la condition sur le statut évite deux mails pour deux clics.
    const avant = await Reservation.findOneAndUpdate(
      { _id: id, status: { $ne: status } },
      { status },
      { new: false }
    ).lean<ReservationVirement>();
    const reservation = await Reservation.findById(id).lean();
    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    let clientPrevenu = false;
    if (avant && doitConfirmerVirement(avant, status)) {
      try {
        clientPrevenu = await envoyerVirementRecu(avant);
      } catch (err) {
        console.error("Mail « virement bien reçu » non envoyé:", err);
      }
    }
    return NextResponse.json({ ...reservation, clientPrevenu });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PATCH /api/reservations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
