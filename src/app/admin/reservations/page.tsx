"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { CalendarCheck, ChevronRight, X, Phone, Mail, MapPin, Users, Calendar, Clock } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState, GoldButton, GhostButton } from "@/components/admin/ui";

type Status = "pending" | "confirmed" | "done" | "cancelled";
type Tone = "gold" | "green" | "amber" | "red" | "gray" | "blue";

interface ReservationItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Reservation {
  _id: string;
  reservationNumber: string;
  type: "atelier" | "traiteur";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  atelierTitle?: string;
  sessionDate?: string;
  sessionLocation?: string;
  participants?: number;
  items?: ReservationItem[];
  pickupDate?: string;
  pickupTime?: string;
  notes?: string;
  amount: number;
  status: Status;
  createdAt: string;
}

const statusMap: Record<Status, { label: string; tone: Tone }> = {
  pending: { label: "À préparer", tone: "amber" },
  confirmed: { label: "Confirmée", tone: "blue" },
  done: { label: "Terminée", tone: "green" },
  cancelled: { label: "Annulée", tone: "gray" },
};

const STATUS_ORDER: Status[] = ["pending", "confirmed", "done", "cancelled"];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"" | "atelier" | "traiteur">("");
  const [statusFilter, setStatusFilter] = useState<"" | Status>("");
  const [selected, setSelected] = useState<Reservation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/reservations?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setReservations(data.reservations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: Status) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReservations((list) => list.map((r) => (r._id === id ? { ...r, status: updated.status } : r)));
      setSelected((s) => (s && s._id === id ? { ...s, status: updated.status } : s));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Activité"
        title="Réservations"
        subtitle={loading ? undefined : `${reservations.length} réservation${reservations.length > 1 ? "s" : ""}`}
      />

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip active={typeFilter === ""} onClick={() => setTypeFilter("")}>Tous</FilterChip>
        <FilterChip active={typeFilter === "atelier"} onClick={() => setTypeFilter("atelier")}>Ateliers</FilterChip>
        <FilterChip active={typeFilter === "traiteur"} onClick={() => setTypeFilter("traiteur")}>Traiteur</FilterChip>
        <span className="w-px bg-[var(--brand-gold)]/20 mx-1" />
        <FilterChip active={statusFilter === ""} onClick={() => setStatusFilter("")}>Tous statuts</FilterChip>
        {STATUS_ORDER.map((s) => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {statusMap[s].label}
          </FilterChip>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={18} strokeWidth={1.5} />}
            title="Aucune réservation"
            description="Les réservations payées (ateliers et traiteur) apparaîtront ici."
          />
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--brand-gold)]/15">
                    {["Réservation", "Type", "Client", "Détail", "Montant", "Statut", "Date", ""].map((h, i, arr) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${i === arr.length - 1 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-gold)]/10">
                  {reservations.map((r) => (
                    <tr
                      key={r._id}
                      onClick={() => setSelected(r)}
                      className="hover:bg-[var(--brand-cream)]/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 font-serif text-[14px] text-gray-900">{r.reservationNumber}</td>
                      <td className="px-5 py-4">
                        <Badge tone={r.type === "atelier" ? "gold" : "blue"}>
                          {r.type === "atelier" ? "Atelier" : "Traiteur"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] text-gray-700">{r.customerName}</p>
                        <p className="text-[11px] text-gray-400">{r.customerPhone}</p>
                      </td>
                      <td className="px-5 py-4 text-[12px] text-gray-500 max-w-[220px] truncate">
                        {r.type === "atelier"
                          ? `${r.atelierTitle || ""}${r.participants ? ` · ${r.participants} pers.` : ""}`
                          : `${r.items?.length || 0} plat(s) · ${r.pickupDate || ""} ${r.pickupTime || ""}`}
                      </td>
                      <td className="px-5 py-4 font-serif text-[14px] text-gray-900">{formatPrice(r.amount)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={statusMap[r.status].tone}>{statusMap[r.status].label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-[12px] text-gray-400">{formatDate(r.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <ChevronRight size={16} className="text-[var(--brand-gold)]/40 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className="md:hidden divide-y divide-[var(--brand-gold)]/10">
              {reservations.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-[var(--brand-cream)]/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge tone={r.type === "atelier" ? "gold" : "blue"}>
                        {r.type === "atelier" ? "Atelier" : "Traiteur"}
                      </Badge>
                      <span className="font-serif text-[15px] text-gray-900 ml-auto">{formatPrice(r.amount)}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 truncate">{r.customerName}</p>
                    <p className="text-[12px] text-gray-400 truncate mb-2">
                      {r.reservationNumber} · {formatDate(r.createdAt)}
                    </p>
                    <Badge tone={statusMap[r.status].tone}>{statusMap[r.status].label}</Badge>
                  </div>
                  <ChevronRight size={16} className="text-[var(--brand-gold)]/40 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {selected && (
        <DetailModal
          reservation={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition ${
        active
          ? "bg-[var(--brand-gold)] text-white border-[var(--brand-gold)]"
          : "border-[var(--brand-gold)]/25 text-gray-500 hover:border-[var(--brand-gold)]/50"
      }`}
    >
      {children}
    </button>
  );
}

function DetailModal({
  reservation: r,
  onClose,
  onUpdateStatus,
}: {
  reservation: Reservation;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Status) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border border-[var(--brand-gold)]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--brand-gold)]/15 sticky top-0 bg-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
              {r.type === "atelier" ? "Atelier" : "Traiteur · Click & Collect"}
            </p>
            <h2 className="font-serif text-xl text-gray-900">{r.reservationNumber}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Statut + montant */}
          <div className="flex items-center justify-between">
            <Badge tone={statusMap[r.status].tone}>{statusMap[r.status].label}</Badge>
            <span className="font-serif text-2xl text-gray-900">{formatPrice(r.amount)}</span>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Client</p>
            <p className="text-[15px] text-gray-900">{r.customerName}</p>
            <p className="flex items-center gap-2 text-[13px] text-gray-600">
              <Phone size={13} className="text-[var(--brand-gold)]" />
              <a href={`tel:${r.customerPhone}`} className="hover:underline">{r.customerPhone}</a>
            </p>
            {r.customerEmail && (
              <p className="flex items-center gap-2 text-[13px] text-gray-600">
                <Mail size={13} className="text-[var(--brand-gold)]" />
                <a href={`mailto:${r.customerEmail}`} className="hover:underline">{r.customerEmail}</a>
              </p>
            )}
          </div>

          {/* Détail atelier */}
          {r.type === "atelier" && (
            <div className="space-y-2 border-t border-[var(--brand-gold)]/10 pt-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Atelier</p>
              <p className="font-serif text-[16px] text-gray-900">{r.atelierTitle}</p>
              {r.sessionDate && (
                <p className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Calendar size={13} className="text-[var(--brand-gold)]" /> {r.sessionDate}
                </p>
              )}
              {r.sessionLocation && (
                <p className="flex items-center gap-2 text-[13px] text-gray-600">
                  <MapPin size={13} className="text-[var(--brand-gold)]" /> {r.sessionLocation}
                </p>
              )}
              {r.participants && (
                <p className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Users size={13} className="text-[var(--brand-gold)]" /> {r.participants} participant(s)
                </p>
              )}
            </div>
          )}

          {/* Détail traiteur */}
          {r.type === "traiteur" && (
            <div className="space-y-2 border-t border-[var(--brand-gold)]/10 pt-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Retrait</p>
              <p className="flex items-center gap-2 text-[13px] text-gray-600">
                <Calendar size={13} className="text-[var(--brand-gold)]" /> {r.pickupDate}
                <Clock size={13} className="text-[var(--brand-gold)] ml-2" /> {r.pickupTime}
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-3">Plats</p>
              <ul className="divide-y divide-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/10">
                {r.items?.map((it, i) => (
                  <li key={i} className="flex justify-between px-3 py-2 text-[13px]">
                    <span className="text-gray-700">{it.name} × {it.quantity}</span>
                    <span className="text-gray-900">{formatPrice(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <div className="border-t border-[var(--brand-gold)]/10 pt-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1.5">Notes / allergies</p>
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}

          {/* Gestion du statut */}
          <div className="border-t border-[var(--brand-gold)]/10 pt-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">Changer le statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) =>
                s === r.status ? (
                  <GoldButton key={s} onClick={() => {}}>{statusMap[s].label}</GoldButton>
                ) : (
                  <GhostButton key={s} onClick={() => onUpdateStatus(r._id, s)}>
                    {statusMap[s].label}
                  </GhostButton>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
