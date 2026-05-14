"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import { usePageTitle } from "@/lib/use-page-title";

export default function LoginPage() {
  usePageTitle("Connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (!result || result.error) {
        setLoading(false);
        setError(result?.error || "Email ou mot de passe incorrect");
        return;
      }

      // Polling /api/auth/session pour récupérer le rôle (et router admin/client)
      let destination = "/";
      for (let i = 0; i < 5; i++) {
        try {
          const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
          const session = await sessionRes.json();
          if (session?.user?.role) {
            destination = session.user.role === "admin" ? "/admin" : "/account";
            break;
          }
        } catch {
          // ignore, retry
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      setLoading(false);
      window.location.href = destination;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    void handleLogin(email, password);
    return false;
  }

  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh] py-20 md:py-28 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
            Espace client
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
            Bonjour à<br />
            <span className="italic text-[var(--brand-gold)]">nouveau</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-8" />
        </div>

        {/* Card */}
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
          {error && (
            <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic text-center">
              {error}
            </div>
          )}

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

            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours…" : <>Se connecter <ArrowRight size={13} /></>}
            </button>

            <div className="text-center pt-1">
              <Link
                href="/mot-de-passe-oublie"
                className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-0.5 hover:border-[var(--brand-gold)] transition"
              >
                Mot de passe oublié&nbsp;?
              </Link>
            </div>
          </form>
        </div>

        {/* Footer — pas de lien d'inscription : un compte est créé automatiquement à la commande */}
        <div className="mt-10 text-center">
          <p className="font-serif italic text-[13px] text-gray-500">
            Pas encore de compte&nbsp;?<br />
            Il sera créé automatiquement lors de votre première commande, et un email vous permettra de choisir votre mot de passe.
          </p>
        </div>
      </div>
    </div>
  );
}
