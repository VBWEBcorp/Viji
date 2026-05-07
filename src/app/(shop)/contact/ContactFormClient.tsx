"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

export default function ContactFormClient() {
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
          subject: data.get("subject"),
          message: data.get("message"),
          _gotcha: data.get("_gotcha"),
          formType: "contact",
        }),
      });

      if (res.ok) {
        toast.success("Message envoyé. Réponse sous 48h.");
        form.reset();
      } else {
        const json = await res.json().catch(() => null);
        toast.error(json?.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Impossible d'envoyer le message");
    }

    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
        <Field name="name" label="Nom" required />
        <Field name="email" label="Email" type="email" required />
      </div>
      <Field name="subject" label="Sujet" required />
      <div>
        <label
          htmlFor="message"
          className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2"
        >
          Message <span className="text-[var(--brand-gold)]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition resize-none placeholder:text-gray-300"
          placeholder="Votre message…"
        />
      </div>

      {/* Honeypot anti-spam (caché aux humains, rempli par les bots) */}
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
        {busy ? "Envoi en cours…" : <>Envoyer le message <ArrowRight size={13} /></>}
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
