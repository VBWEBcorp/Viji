"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

export default function DevisForm() {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    // Mailto fallback for now — can wire to Resend/Formspree later
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name");
    const email = data.get("email");
    const phone = data.get("phone");
    const date = data.get("date");
    const guests = data.get("guests");
    const message = data.get("message");

    const body = encodeURIComponent(
      `Nom : ${name}\nEmail : ${email}\nTéléphone : ${phone}\nDate : ${date}\nNombre de convives : ${guests}\n\n${message}`
    );
    const subject = encodeURIComponent(`Demande de devis traiteur · ${name}`);
    window.location.href = `mailto:contact@entre-maman-et-moi.fr?subject=${subject}&body=${body}`;

    setTimeout(() => {
      toast.success("Votre client mail va s'ouvrir");
      setBusy(false);
      form.reset();
    }, 500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="name" label="Nom" required />
        <Field name="email" label="Email" type="email" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="phone" label="Téléphone" />
        <Field name="date" label="Date envisagée" type="date" />
      </div>
      <Field name="guests" label="Nombre de convives" type="number" />

      <div>
        <label htmlFor="message" className="block text-[13px] text-gray-700 mb-2">
          Votre projet
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Décrivez votre événement, vos préférences, vos contraintes alimentaires…"
          className="w-full px-4 py-3 border border-gray-200 text-[13px] focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[12px] uppercase tracking-widest font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-50"
      >
        <Send size={14} />
        {busy ? "Envoi..." : "Envoyer la demande"}
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
      <label htmlFor={name} className="block text-[13px] text-gray-700 mb-2">
        {label}
        {required && <span className="text-[var(--brand-gold)]">&nbsp;*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-3 border border-gray-200 text-[13px] focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none transition"
      />
    </div>
  );
}
