"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { usePageTitle } from "@/lib/use-page-title";

export default function ProfilePage() {
  usePageTitle("Mes informations");
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      toast.success("Informations mises à jour");
      update({ name });
    } else {
      toast.error("Erreur");
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setChangingPassword(true);
    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      toast.success("Mot de passe modifié");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
    setChangingPassword(false);
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
          Profil
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Mes <span className="italic text-[var(--brand-gold)]">informations</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        <p className="font-serif italic text-[14px] text-gray-500 mt-7 max-w-md">
          Gérez vos coordonnées et la sécurité de votre compte.
        </p>
      </div>

      {/* Profile info */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-8"
      >
        <div className="mb-7">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
            Section
          </p>
          <h2 className="font-serif text-2xl text-gray-900">Coordonnées</h2>
        </div>

        <div className="space-y-6 max-w-lg">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-400 cursor-not-allowed"
            />
            <p className="font-serif italic text-[11px] text-gray-400 mt-2">
              L&apos;email ne peut pas être modifié
            </p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : <>Enregistrer <ArrowRight size={13} /></>}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-8"
      >
        <div className="mb-7">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
            Sécurité
          </p>
          <h2 className="font-serif text-2xl text-gray-900">Mot de passe</h2>
        </div>

        <div className="space-y-6 max-w-lg">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 caractères"
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="mt-2 inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60"
          >
            {changingPassword ? "Modification…" : <>Modifier le mot de passe <ArrowRight size={13} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
