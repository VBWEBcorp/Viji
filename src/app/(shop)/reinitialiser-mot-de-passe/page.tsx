"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePageTitle } from "@/lib/use-page-title";

function ResetPasswordContent() {
  usePageTitle("Nouveau mot de passe");
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenStatus("valid");
          setEmail(data.email);
        } else {
          setTokenStatus("invalid");
        }
      })
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      // Connexion automatique avec le nouveau mot de passe
      if (data.email) {
        const result = await signIn("credentials", {
          email: data.email,
          password,
          redirect: false,
        });
        if (result?.ok) {
          router.push("/account");
          return;
        }
      }
      router.push("/login");
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
            Nouveau<br />
            <span className="italic text-[var(--brand-gold)]">mot de passe</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-8" />
        </div>

        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
          {tokenStatus === "checking" && (
            <p className="font-serif italic text-center text-gray-500 text-[14px]">Vérification du lien…</p>
          )}

          {tokenStatus === "invalid" && (
            <div className="text-center">
              <p className="font-serif text-[15px] text-gray-700 leading-relaxed mb-7">
                Ce lien est invalide ou a expiré. Demandez un nouveau lien de réinitialisation.
              </p>
              <Link
                href="/mot-de-passe-oublie"
                className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
              >
                Demander un nouveau lien
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {tokenStatus === "valid" && (
            <>
              {email && (
                <p className="font-serif italic text-[13px] text-gray-600 mb-7 leading-relaxed text-center">
                  Pour le compte <span className="not-italic font-medium text-gray-900">{email}</span>
                </p>
              )}

              {error && (
                <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Confirmer
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Enregistrement…" : <>Définir le mot de passe <ArrowRight size={13} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-[var(--brand-cream)]/30 min-h-[80vh] flex items-center justify-center"><p className="font-serif italic text-gray-500">Chargement…</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
