import { CalendarClock } from "lucide-react";
import Link from "next/link";
import type { EtatCanal } from "@/lib/disponibilite";

/**
 * Panneau affiché à la place d'un formulaire de commande quand le canal est
 * suspendu depuis l'admin.
 *
 * Le parti pris : on n'escamote pas la page. Le visiteur voit le menu, les
 * ateliers, les tarifs, et comprend seulement qu'il ne peut pas commander
 * maintenant, avec la date de reprise si elle est renseignée. Une page qui
 * disparaît coûte du référencement et laisse le visiteur sans explication.
 */
export default function CanalFerme({
  etat,
  contact = true,
}: {
  etat: EtatCanal;
  /** Affiche le renvoi vers la page contact sous le message. */
  contact?: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto text-center border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/50 px-6 sm:px-10 py-12">
      <div className="w-12 h-12 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-6">
        <CalendarClock size={18} strokeWidth={1.5} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] font-medium mb-3">
        Pause
      </p>
      <h2 className="font-serif text-2xl md:text-[28px] text-gray-900 mb-4">
        {etat.titre}
      </h2>
      <div className="w-8 h-px bg-[var(--brand-gold)]/40 mx-auto mb-6" />

      <p className="text-[14px] text-gray-600 leading-relaxed">{etat.message}</p>

      {etat.retour && (
        <p className="mt-5 text-[13px] text-gray-900">
          Reprise des commandes le{" "}
          <span className="text-[var(--brand-gold)] font-medium">{etat.retour}</span>.
        </p>
      )}

      {contact && (
        <p className="mt-8 pt-6 border-t border-[var(--brand-gold)]/15 text-[13px] text-gray-500">
          Une question ?{" "}
          <Link
            href="/contact"
            className="text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] underline underline-offset-4 transition"
          >
            Écrivez-nous
          </Link>
          , nous vous répondrons dès notre retour.
        </p>
      )}
    </div>
  );
}
