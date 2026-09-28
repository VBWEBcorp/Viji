import { NextRequest, NextResponse } from "next/server";
import {
  getDisponibilite,
  getEtatCanal,
  libelleDateRetour,
  type Canal,
} from "@/lib/disponibilite";

const CANAUX: Canal[] = ["traiteurEmporter", "ateliers", "boutique"];

function estCanal(valeur: string | null): valeur is Canal {
  return valeur !== null && (CANAUX as string[]).includes(valeur);
}

/**
 * GET /api/disponibilite            → etat des trois canaux + mode vacances
 * GET /api/disponibilite?canal=...  → etat d'un seul canal
 *
 * Etat public d'ouverture des canaux de vente, pour les ecrans rendus cote
 * navigateur (le tunnel de commande, le bandeau d'absence) qui ne peuvent pas
 * lire les reglages directement. Lecture seule et sans donnee sensible : le
 * message renvoye est justement celui destine aux visiteurs.
 */
export async function GET(req: NextRequest) {
  try {
    const demande = req.nextUrl.searchParams.get("canal");
    if (estCanal(demande)) {
      return NextResponse.json(await getEtatCanal(demande));
    }

    const dispo = await getDisponibilite();
    const [traiteurEmporter, ateliers, boutique] = await Promise.all(
      CANAUX.map((c) => getEtatCanal(c))
    );

    return NextResponse.json({
      modeVacances: dispo.modeVacances,
      message: dispo.message,
      retour: dispo.dateRetour ? libelleDateRetour(dispo.dateRetour) : "",
      canaux: { traiteurEmporter, ateliers, boutique },
    });
  } catch (error) {
    console.error("GET /api/disponibilite error:", error);
    // En cas d'incident, on n'affiche pas de fermeture : le verrou serveur des
    // routes de paiement reste de toute facon en place.
    return NextResponse.json({ ouvert: true, modeVacances: false });
  }
}
