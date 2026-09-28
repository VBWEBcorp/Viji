import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import EmailLog from "@/models/EmailLog";

/**
 * GET /api/emails/logs
 *
 * Journal des envois d'emails : qui, quand, quel sujet, parti ou refuse, et le
 * message d'erreur exact de Resend le cas echeant.
 *
 * Filtres : ?statut=echec, ?kind=confirmation-atelier, ?reference=RES-2608-0094,
 * ?recherche=<texte libre sur le destinataire ou le sujet>, ?limite=50.
 * ?html=1 joint le corps du message envoye.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const p = req.nextUrl.searchParams;
    const filtre: Record<string, unknown> = {};

    const statut = p.get("statut");
    if (statut === "envoye" || statut === "echec") filtre.status = statut;

    const kind = p.get("kind");
    if (kind) filtre.kind = kind;

    const reference = p.get("reference");
    if (reference) filtre.reference = reference;

    const recherche = p.get("recherche");
    if (recherche) {
      // Echappement : la saisie ne doit pas devenir une expression reguliere.
      const motif = recherche.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtre.$or = [
        { to: { $regex: motif, $options: "i" } },
        { subject: { $regex: motif, $options: "i" } },
      ];
    }

    const limite = Math.min(Math.max(Number(p.get("limite")) || 50, 1), 200);
    const avecHtml = p.get("html") === "1";

    const projection = avecHtml ? {} : { html: 0 };

    const [entrees, total, echecs] = await Promise.all([
      EmailLog.find(filtre, projection).sort({ createdAt: -1 }).limit(limite).lean(),
      EmailLog.countDocuments(filtre),
      EmailLog.countDocuments({ ...filtre, status: "echec" }),
    ]);

    return NextResponse.json({ entrees, total, echecs, limite });
  } catch (error) {
    console.error("GET /api/emails/logs error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
