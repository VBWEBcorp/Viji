"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
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
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes informations</h1>
      <p className="text-sm text-gray-500 mb-6">Gérez vos informations personnelles et votre mot de passe</p>

      {/* Profile info */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <User size={16} /> Informations personnelles
        </h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">L&apos;email ne peut pas etre modifie</p>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Telephone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving ? "Sauvegardé..." : <><Check size={14} /> Enregistrer</>}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Lock size={16} /> Changer le mot de passe
        </h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 caracteres"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Confirmer</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {changingPassword ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}
