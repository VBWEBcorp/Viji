"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { Card } from "@/components/admin/ui";

/**
 * Journal des envois d'emails.
 *
 * Sans lui, un email refusé par Resend ne laissait aucune trace visible : le
 * parcours de commande se terminait normalement et le client ne recevait rien.
 * Chaque tentative est désormais consultable ici, avec le message d'erreur
 * exact quand l'envoi n'est pas parti.
 */

interface Entree {
  _id: string;
  to: string;
  from: string;
  subject: string;
  status: "envoye" | "echec";
  error?: string;
  resendId?: string;
  kind?: string;
  reference?: string;
  delivery?: "accepte" | "remis" | "differe" | "rejete" | "plainte";
  deliveryDetail?: string;
  createdAt: string;
}

/**
 * Ce que Resend a fait du message après l'avoir accepté. Tant que le webhook
 * n'est pas branché, la colonne reste vide : accepté n'est pas reçu.
 */
const REMISE: Record<string, { texte: string; classe: string }> = {
  accepte: { texte: "Pris en charge", classe: "text-gray-500" },
  remis: { texte: "Reçu", classe: "text-green-700 font-medium" },
  differe: { texte: "Différé", classe: "text-amber-600" },
  rejete: { texte: "Rejeté", classe: "text-red-600 font-medium" },
  plainte: { texte: "Signalé indésirable", classe: "text-red-600 font-medium" },
};

const LIBELLE_TYPE: Record<string, string> = {
  "confirmation-atelier": "Confirmation atelier (client)",
  "notification-atelier": "Notification atelier (boutique)",
  "confirmation-traiteur": "Confirmation Click & Collect (client)",
  "notification-traiteur": "Notification Click & Collect (boutique)",
  "confirmation-commande": "Confirmation commande (client)",
  "notification-commande": "Notification commande (boutique)",
  "envoi-en-masse": "Envoi en masse",
  "test-admin": "Test depuis l'admin",
};

function dateLisible(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function JournalEmails() {
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [total, setTotal] = useState(0);
  const [echecs, setEchecs] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [seulementEchecs, setSeulementEchecs] = useState(false);
  const [recherche, setRecherche] = useState("");

  // Compteur incrémenté par le bouton « Actualiser » : il relance l'effet sans
  // dupliquer la logique de chargement.
  const [rafraichissement, setRafraichissement] = useState(0);

  useEffect(() => {
    let annule = false;

    const params = new URLSearchParams({ limite: "50" });
    if (seulementEchecs) params.set("statut", "echec");
    if (recherche.trim()) params.set("recherche", recherche.trim());

    fetch(`/api/emails/logs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (annule || data.error) return;
        setEntrees(data.entrees || []);
        setTotal(data.total || 0);
        setEchecs(data.echecs || 0);
      })
      .catch(() => {
        // Le journal est un outil de lecture : en cas d'incident réseau, on
        // laisse la liste précédente à l'écran plutôt qu'un écran vide.
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [seulementEchecs, recherche, rafraichissement]);

  function actualiser() {
    setChargement(true);
    setRafraichissement((n) => n + 1);
  }

  return (
    <Card className="p-5 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-lg sm:text-xl text-gray-900">
            Journal des envois
          </h2>
          <p className="text-[12px] text-gray-400 mt-1">
            Chaque email que le site a tenté d&apos;envoyer, parti ou refusé. Un
            envoi refusé n&apos;interrompt jamais une commande : c&apos;est ici
            qu&apos;il devient visible.
          </p>
        </div>

        <button
          type="button"
          onClick={actualiser}
          disabled={chargement}
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.2em] text-gray-500 hover:text-[var(--brand-gold)] transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={chargement ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un destinataire ou un sujet"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
          />
        </div>

        <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={seulementEchecs}
            onChange={(e) => setSeulementEchecs(e.target.checked)}
            className="w-4 h-4 accent-[var(--brand-gold)]"
          />
          Échecs uniquement
        </label>

        <span className="text-[12px] text-gray-400">
          {total} envoi{total > 1 ? "s" : ""}
          {echecs > 0 && (
            <span className="text-red-600 font-medium"> · {echecs} refusé{echecs > 1 ? "s" : ""}</span>
          )}
        </span>
      </div>

      {entrees.length === 0 ? (
        <p className="text-[13px] text-gray-400 py-8 text-center">
          {chargement
            ? "Chargement…"
            : "Aucun envoi enregistré pour le moment. Le journal se remplit au premier email envoyé par le site."}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-[var(--brand-gold)]/15">
                <th className="py-2 pr-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Date</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Destinataire</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Sujet</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Type</th>
                <th className="py-2 pr-3 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Envoi</th>
                <th className="py-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Réception</th>
              </tr>
            </thead>
            <tbody>
              {entrees.map((e) => (
                <tr key={e._id} className="border-b border-gray-50 align-top">
                  <td className="py-3 pr-3 text-[12px] text-gray-500 whitespace-nowrap">
                    {dateLisible(e.createdAt)}
                  </td>
                  <td className="py-3 pr-3 text-[13px] text-gray-900 break-all">
                    {e.to}
                  </td>
                  <td className="py-3 pr-3 text-[13px] text-gray-600">
                    {e.subject}
                    {e.reference && (
                      <span className="block text-[11px] text-gray-400 mt-0.5">
                        {e.reference}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-[12px] text-gray-500">
                    {e.kind ? LIBELLE_TYPE[e.kind] || e.kind : "—"}
                  </td>
                  <td className="py-3 pr-3 text-[12px]">
                    {e.status === "envoye" ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700">
                        <CheckCircle2 size={13} /> Envoyé
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                          <AlertTriangle size={13} /> Refusé
                        </span>
                        {e.error && (
                          <p className="text-[11px] text-red-500 leading-snug max-w-xs">
                            {e.error}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-[12px]">
                    {e.status === "echec" ? (
                      <span className="text-gray-300">—</span>
                    ) : e.delivery ? (
                      <div className="space-y-1">
                        <span className={REMISE[e.delivery]?.classe || "text-gray-500"}>
                          {REMISE[e.delivery]?.texte || e.delivery}
                        </span>
                        {e.deliveryDetail && (
                          <p className="text-[11px] text-gray-400 leading-snug max-w-xs">
                            {e.deliveryDetail}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400" title="Resend a accepté le message, mais aucun accusé de réception n'est encore arrivé.">
                        En attente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {echecs > 0 && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100">
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-700 leading-relaxed">
            Des envois ont été refusés. La cause la plus fréquente est
            l&apos;adresse d&apos;expéditeur : tant qu&apos;elle utilise le
            domaine de test de Resend, seule l&apos;adresse du titulaire du
            compte peut recevoir. Elle se change dans Réglages, onglet Clés API.
          </p>
        </div>
      )}
    </Card>
  );
}
