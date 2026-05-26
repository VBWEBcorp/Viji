"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Pencil, Trash2, Eye, EyeOff, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, Card, Badge, GoldButton, EmptyState } from "@/components/admin/ui";

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
  occurrences?: Occurrence[];
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

function uniqueLocations(occs: Occurrence[]): string[] {
  return Array.from(new Set(occs.map((o) => o.location).filter(Boolean)));
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

  const activeCount = sessions.filter((s) => s.isActive).length;

  return (
    <div>
      <PageHeader
        eyebrow="Ateliers"
        title="Sessions collectives"
        subtitle={
          loading
            ? undefined
            : `${sessions.length} session${sessions.length > 1 ? "s" : ""} · ${activeCount} visible${activeCount > 1 ? "s" : ""} sur le site`
        }
      >
        <GoldButton href="/admin/ateliers/new">
          <Plus size={14} /> Nouvelle session
        </GoldButton>
      </PageHeader>

      {loading ? (
        <Card className="p-12 text-center text-gray-400 text-sm">Chargement…</Card>
      ) : sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={18} strokeWidth={1.5} />}
            title="Aucune session pour le moment"
            description="Créez votre première session d'atelier collectif."
            action={
              <GoldButton href="/admin/ateliers/new">
                <Plus size={14} /> Créer une session
              </GoldButton>
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop : tableau */}
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--brand-gold)]/15">
                    {["Session", "Dates", "Lieu", "Prix", "Statut", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${i === 3 ? "text-right" : i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-gold)]/10">
                  {sessions.map((s) => {
                    const occs = getOccurrences(s);
                    const locs = uniqueLocations(occs);
                    return (
                      <tr
                        key={s._id}
                        className={`hover:bg-[var(--brand-cream)]/40 transition-colors ${s.isActive ? "" : "opacity-55"}`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {s.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.image} alt={s.shortTitle} className="w-12 h-12 object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{s.shortTitle}</p>
                              <p className="text-[12px] text-gray-400 truncate max-w-[260px]">{s.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {occs.length === 0 ? (
                            <span className="text-gray-400 italic text-[13px]">Aucune date</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-[13px]">{occs[0].date}</p>
                                <p className="text-[12px] text-gray-400">{occs[0].schedule}</p>
                              </div>
                              {occs.length > 1 && <Badge tone="gold">+{occs.length - 1}</Badge>}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-[13px] text-gray-700">
                          {locs.length === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : locs.length === 1 ? (
                            locs[0]
                          ) : (
                            <>
                              {locs[0]}
                              <span className="block text-[12px] text-gray-400">
                                +{locs.length - 1} autre{locs.length - 1 > 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-serif text-[15px] text-gray-900">
                          {formatEUR(s.price)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={s.isActive ? "green" : "gray"}>
                            {s.isActive ? "Active" : "Masquée"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleActive(s)}
                            className="p-2 text-gray-400 hover:text-[var(--brand-gold)] transition"
                            title={s.isActive ? "Masquer" : "Afficher"}
                          >
                            {s.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <Link
                            href={`/admin/ateliers/${s.slug}`}
                            className="inline-flex p-2 text-gray-400 hover:text-[var(--brand-gold)] transition"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => deleteSession(s)}
                            className="p-2 text-gray-400 hover:text-red-600 transition"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile : cartes */}
          <div className="md:hidden space-y-3">
            {sessions.map((s) => {
              const occs = getOccurrences(s);
              const locs = uniqueLocations(occs);
              return (
                <Card key={s._id} className={`overflow-hidden ${s.isActive ? "" : "opacity-60"}`}>
                  <div className="flex gap-3 p-4">
                    {s.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt={s.shortTitle} className="w-16 h-16 object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-[16px] text-gray-900 leading-tight">{s.shortTitle}</p>
                        <span className="font-serif text-[15px] text-gray-900 shrink-0">{formatEUR(s.price)}</span>
                      </div>
                      <div className="mt-2">
                        <Badge tone={s.isActive ? "green" : "gray"}>
                          {s.isActive ? "Active" : "Masquée"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Dates & lieux */}
                  <div className="px-4 pb-3 space-y-1.5">
                    {occs.length === 0 ? (
                      <p className="text-[13px] text-gray-400 italic">Aucune date programmée</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-[13px] text-gray-700">
                          <CalendarDays size={14} className="text-[var(--brand-gold)] shrink-0" />
                          <span>
                            {occs[0].date} · <span className="text-gray-400">{occs[0].schedule}</span>
                          </span>
                          {occs.length > 1 && <Badge tone="gold">+{occs.length - 1}</Badge>}
                        </div>
                        {locs.length > 0 && (
                          <div className="flex items-center gap-2 text-[13px] text-gray-700">
                            <MapPin size={14} className="text-[var(--brand-gold)] shrink-0" />
                            <span className="truncate">
                              {locs[0]}
                              {locs.length > 1 && (
                                <span className="text-gray-400"> +{locs.length - 1}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Barre d'actions */}
                  <div className="flex border-t border-[var(--brand-gold)]/15 divide-x divide-[var(--brand-gold)]/15">
                    <Link
                      href={`/admin/ateliers/${s.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] uppercase tracking-[0.15em] text-gray-600 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/40 transition"
                    >
                      <Pencil size={14} /> Modifier
                    </Link>
                    <button
                      onClick={() => toggleActive(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] uppercase tracking-[0.15em] text-gray-600 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/40 transition"
                    >
                      {s.isActive ? <><EyeOff size={14} /> Masquer</> : <><Eye size={14} /> Afficher</>}
                    </button>
                    <button
                      onClick={() => deleteSession(s)}
                      className="flex items-center justify-center gap-1.5 px-5 py-3 text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
