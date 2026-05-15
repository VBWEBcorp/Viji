"use client";

import { useState } from "react";
import { ArrowRight, Check, Calendar, MapPin } from "lucide-react";

type Occurrence = {
  date: string;
  schedule: string;
  location: string;
};

interface Props {
  sessionSlug: string;
  sessionTitle: string;
  occurrences: Occurrence[];
}

export default function AtelierReservationForm({
  sessionSlug,
  sessionTitle,
  occurrences,
}: Props) {
  const hasMultiple = occurrences.length > 1;

  // Sélection visuelle : index numérique de l'occurrence choisie.
  // Présélectionne la 1re si une seule option, sinon laisse vide pour forcer un choix.
  const [occIndex, setOccIndex] = useState<number | null>(hasMultiple ? null : 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (occIndex === null) {
      setError("Choisissez une date.");
      return;
    }

    const chosen = occurrences[occIndex];
    if (!chosen) {
      setError("Date / lieu invalide.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ateliers/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionSlug,
          sessionTitle,
          sessionDate: `${chosen.date} · ${chosen.schedule}`,
          sessionLocation: chosen.location,
          name,
          phone,
          email,
          participants,
          notes,
          website,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue, réessayez.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
    } catch {
      setError("Erreur réseau, réessayez.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-10 px-6 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/20">
        <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
          <Check size={20} strokeWidth={1.5} />
        </div>
        <p className="font-serif italic text-[18px] text-gray-800 mb-2">
          Demande de réservation envoyée
        </p>
        <p className="text-[13px] text-gray-600 max-w-md mx-auto leading-relaxed">
          Je reviens vers vous très vite pour confirmer votre participation et les détails pratiques.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] w-px h-px"
        aria-hidden
      />

      {error && (
        <div className="px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic">
          {error}
        </div>
      )}

      {/* Sélecteur de date — dropdown WooCommerce-style */}
      <div>
        <label
          htmlFor="atelier-date"
          className="block text-[13px] font-medium text-gray-800 mb-2"
        >
          Date :
          <span className="text-[var(--brand-gold)] ml-1">*</span>
        </label>
        <div className="relative">
          <select
            id="atelier-date"
            required
            value={occIndex === null ? "" : String(occIndex)}
            onChange={(e) =>
              setOccIndex(e.target.value === "" ? null : parseInt(e.target.value, 10))
            }
            className="appearance-none w-full bg-white border border-gray-300 px-4 py-3 pr-10 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20 outline-none transition rounded-sm"
          >
            <option value="">Choisir une option</option>
            {occurrences.map((o, i) => (
              <option key={i} value={String(i)}>
                {o.date} – {o.location}
              </option>
            ))}
          </select>
          {/* Chevron custom (since appearance-none) */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            ▾
          </span>
        </div>

        {/* Récap visuel sous le select une fois la date choisie */}
        {occIndex !== null && occurrences[occIndex] && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-700">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} strokeWidth={1.7} className="text-[var(--brand-gold)]" />
              {occurrences[occIndex].date} · {occurrences[occIndex].schedule}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.7} className="text-[var(--brand-gold)]" />
              {occurrences[occIndex].location}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          Nombre de personnes <span className="text-[var(--brand-gold)] ml-1">*</span>
        </label>
        <input
          type="number"
          required
          min={1}
          max={20}
          value={participants}
          onChange={(e) => setParticipants(parseInt(e.target.value, 10) || 1)}
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nom complet" required value={name} onChange={setName} placeholder="Prénom Nom" autoComplete="name" />
        <Field label="Téléphone" type="tel" required value={phone} onChange={setPhone} placeholder="06 ..." autoComplete="tel" />
      </div>

      <Field label="Email (optionnel)" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" autoComplete="email" />

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          Notes / allergies (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Précisez vos restrictions, allergies, ou questions particulières."
          className="w-full px-3 py-3 bg-transparent border border-gray-200 text-[14px] text-gray-800 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300 leading-relaxed"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Envoi en cours…" : <>Réserver ma place <ArrowRight size={13} /></>}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
        {label}
        {required && <span className="text-[var(--brand-gold)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
      />
    </div>
  );
}
