"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Shield, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError("Email ou mot de passe incorrect");
      return;
    }

    // Determine destination based on the freshly-issued session role.
    let destination = "/";
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (session?.user?.role === "admin") destination = "/admin";
    } catch {
      // fall through to "/"
    }

    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleLogin(email, password);
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
          {/* Demo logins */}
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-4 text-center">
            Accès démo
          </p>
          <div className="space-y-3 mb-10">
            <button
              onClick={() => handleLogin("admin@demo.com", "demo1234")}
              disabled={loading}
              className="group w-full flex items-center gap-4 px-4 py-3.5 bg-[var(--brand-gold)] text-white hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Shield size={15} strokeWidth={1.5} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[12px] uppercase tracking-[0.25em] font-medium">Connexion Admin</p>
                <p className="text-[11px] text-white/70 font-serif italic mt-0.5">Accès au back-office</p>
              </div>
              <ArrowRight size={14} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handleLogin("client@demo.com", "demo1234")}
              disabled={loading}
              className="group w-full flex items-center gap-4 px-4 py-3.5 bg-white border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] hover:bg-[var(--brand-cream)] transition disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--brand-cream)] flex items-center justify-center shrink-0">
                <User size={15} strokeWidth={1.5} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[12px] uppercase tracking-[0.25em] font-medium">Connexion Client</p>
                <p className="text-[11px] text-gray-500 font-serif italic mt-0.5">Espace, commandes, favoris</p>
              </div>
              <ArrowRight size={14} className="text-[var(--brand-gold)]/50 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[var(--brand-gold)]/20" />
            <span className="font-serif italic text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-[var(--brand-gold)]/20" />
          </div>

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
          </form>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="font-serif italic text-[15px] text-gray-600">
            Pas encore de compte&nbsp;?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center mt-3 text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
