"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur serveur");
      setLoading(false);
    }
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
            Créez votre<br />
            <span className="italic text-[var(--brand-gold)]">compte</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-8" />
        </div>

        {/* Card */}
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
          <p className="font-serif italic text-[14px] text-gray-600 text-center mb-9 leading-relaxed">
            Pour commander, suivre vos achats<br />
            et accéder à votre espace personnel.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              id="name"
              label="Nom complet"
              type="text"
              value={name}
              onChange={setName}
              autoComplete="name"
              placeholder="Viji Tinot"
              required
            />
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="vous@exemple.com"
              required
            />
            <Field
              id="password"
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              required
              minLength={8}
            />
            <Field
              id="confirmPassword"
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Création en cours…" : <>Créer mon compte <ArrowRight size={13} /></>}
            </button>
          </form>

          <p className="mt-8 text-[11px] text-gray-400 text-center leading-relaxed">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/pages/cgv" className="underline underline-offset-2 hover:text-[var(--brand-gold)] transition">
              conditions d&apos;utilisation
            </Link>
            .
          </p>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="font-serif italic text-[15px] text-gray-600">
            Déjà un compte&nbsp;?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center mt-3 text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
        placeholder={placeholder}
      />
    </div>
  );
}
