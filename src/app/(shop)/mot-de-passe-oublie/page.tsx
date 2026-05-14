"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { usePageTitle } from "@/lib/use-page-title";

export default function ForgotPasswordPage() {
  usePageTitle("Mot de passe oublié");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
    } catch {
      setError("Erreur réseau, réessayez");
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh] py-20 md:py-28 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
            Espace client
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
            Mot de passe<br />
            <span className="italic text-[var(--brand-gold)]">oublié</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-8" />
        </div>

        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-6">
                <Check size={20} strokeWidth={1.5} />
              </div>
              <p className="font-serif text-[15px] text-gray-700 leading-relaxed">
                Si un compte existe pour cette adresse, vous recevrez un email avec un lien de réinitialisation dans quelques instants.
              </p>
              <Link
                href="/login"
                className="inline-block mt-8 text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic text-center">
                  {error}
                </div>
              )}

              <p className="font-serif italic text-[13px] text-gray-600 mb-7 leading-relaxed">
                Indiquez l&apos;adresse email associée à votre compte, nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
                    placeholder="vous@exemple.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Envoi en cours…" : <>Envoyer le lien <ArrowRight size={13} /></>}
                </button>
              </form>
            </>
          )}
        </div>

        {!done && (
          <div className="mt-10 text-center">
            <Link
              href="/login"
              className="font-serif italic text-[13px] text-gray-500 hover:text-[var(--brand-gold)] transition"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
