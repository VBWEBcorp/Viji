"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

type Occurrence = {
  date: string;
  dateISO?: string;
  schedule: string;
  location: string;
};

type Session = {
  _id: string;
  slug: string;
  shortTitle: string;
  title: string;
  image: string;
  /** Liste des date+lieu (nouveau modèle). */
  occurrences?: Occurrence[];
  /** Champs legacy (anciens documents non encore migrés). */
  date?: string;
  schedule?: string;
  location?: string;
  price: number;
  isActive: boolean;
  order: number;
};

function getOccurrences(s: Session): Occurrence[] {
  if (s.occurrences && s.occurrences.length > 0) return s.occurrences;
  if (s.date && s.schedule && s.location) {
    return [{ date: s.date, schedule: s.schedule, location: s.location }];
  }
  return [];
}

function formatEUR(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function AdminAteliersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/ateliers/sessions?all=true", { cache: "no-store" });
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }

  async function toggleActive(s: Session) {
    const res = await fetch(`/api/ateliers/sessions/${s.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) {
      toast.success(s.isActive ? "Session masquée" : "Session activée");
      refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  }

  async function deleteSession(s: Session) {
    if (!confirm(`Supprimer définitivement « ${s.shortTitle} » ?`)) return;
    const res = await fetch(`/api/ateliers/sessions/${s.slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Session supprimée");
      refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Ateliers</p>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <CalendarDays size={22} className="text-gray-400" />
            Sessions atelier collectif
          </h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Ajoutez, modifiez ou masquez les sessions qui s&apos;affichent sur la page publique.
          </p>
        </div>
        <Link
          href="/admin/ateliers/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 text-[13px] font-medium rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={15} /> Nouvelle session
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-700 mb-3">Aucune session pour le moment.</p>
          <Link href="/admin/ateliers/new" className="text-[var(--brand-gold)] font-medium underline">
            Créer la première session
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-[12px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Lieu</th>
                <th className="px-4 py-3 font-medium text-right">Prix</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s._id} className={s.isActive ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt={s.shortTitle} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{s.shortTitle}</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-xs">{s.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(() => {
                      const occs = getOccurrences(s);
                      if (occs.length === 0) {
                        return <span className="text-gray-400 italic">Aucune date</span>;
                      }
                      const first = occs[0];
                      return (
                        <>
                          {first.date}
                          <br />
                          <span className="text-[12px] text-gray-400">{first.schedule}</span>
                          {occs.length > 1 && (
                            <span className="ml-2 inline-block bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                              +{occs.length - 1}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(() => {
                      const occs = getOccurrences(s);
                      const unique = Array.from(new Set(occs.map((o) => o.location)));
                      if (unique.length === 0) return <span className="text-gray-400">—</span>;
                      if (unique.length === 1) return unique[0];
                      return (
                        <>
                          {unique[0]}
                          <br />
                          <span className="text-[12px] text-gray-400">+{unique.length - 1} autre{unique.length - 1 > 1 ? "s" : ""}</span>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatEUR(s.price)}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Masquée
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(s)}
                      className="text-gray-500 hover:text-gray-900 p-1.5"
                      title={s.isActive ? "Masquer" : "Afficher"}
                    >
                      {s.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <Link
                      href={`/admin/ateliers/${s.slug}`}
                      className="text-gray-500 hover:text-gray-900 p-1.5 inline-block"
                      title="Modifier"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => deleteSession(s)}
                      className="text-gray-500 hover:text-red-600 p-1.5"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
