"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

export default function DevisForm() {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          date: data.get("date"),
          guests: data.get("guests"),
          message: data.get("message"),
          _gotcha: data.get("_gotcha"),
          formType: "devis",
        }),
      });

      if (res.ok) {
        toast.success("Demande envoyée. Réponse sous 48h.");
        form.reset();
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Impossible d'envoyer la demande");
    }

    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
        <Field name="name" label="Nom" required />
        <Field name="email" label="Email" type="email" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
        <Field name="phone" label="Téléphone" type="tel" />
        <Field name="date" label="Date envisagée" type="date" />
      </div>
      <Field name="guests" label="Nombre de convives" type="number" />

      <div>
        <label
          htmlFor="message"
          className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2"
        >
          Votre projet <span className="text-[var(--brand-gold)]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Décrivez votre événement, vos préférences, vos contraintes alimentaires…"
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition resize-none placeholder:text-gray-300"
        />
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="_gotcha"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <button
        type="submit"
        disabled={busy}
        className="mt-2 inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60"
      >
        {busy ? "Envoi en cours…" : <>Envoyer la demande <ArrowRight size={13} /></>}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2"
      >
        {label}
        {required && <span className="text-[var(--brand-gold)] ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
      />
    </div>
  );
}
