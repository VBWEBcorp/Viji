"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";

interface Props {
  /** Identifie l'origine de l'inscription côté admin (footer, popup…). */
  source?: string;
  /** Libellé du bouton (par défaut « S'inscrire »). */
  cta?: string;
  className?: string;
}

export default function NewsletterSignup({
  source = "site",
  cta = "S'inscrire",
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setMessage(
          data.alreadySubscribed
            ? "Vous êtes déjà inscrite. Merci !"
            : "Merci ! Votre inscription est confirmée."
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "L'inscription a échoué, veuillez réessayer.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur réseau, veuillez réessayer.");
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 text-[var(--brand-gold)] text-[13px] font-medium",
          className
        )}
      >
        <span className="w-7 h-7 rounded-full border border-[var(--brand-gold)]/40 flex items-center justify-center shrink-0">
          <Check size={13} />
        </span>
        <span className="font-serif italic text-[15px]">{message}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full sm:w-auto", className)}
      noValidate
    >
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Votre adresse e-mail"
          aria-label="Votre adresse e-mail"
          className="h-[50px] w-full sm:w-72 min-w-0 bg-white border border-[var(--brand-gold)]/30 px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/15"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex h-[50px] shrink-0 items-center justify-center gap-3 bg-[var(--brand-gold)] text-white text-[11px] uppercase tracking-[0.3em] font-medium px-7 hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              {cta}
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </>
          )}
        </button>
      </div>
      {status === "error" && (
        <p className="text-[12px] text-red-600 mt-2">{message}</p>
      )}
    </form>
  );
}
