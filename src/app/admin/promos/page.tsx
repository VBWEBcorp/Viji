"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { PageHeader, Card, Badge, GoldButton, GhostButton, EmptyState } from "@/components/admin/ui";

interface PromoCode {
  _id: string;
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition";
const labelCls = "block text-[12px] font-medium text-gray-600 mb-1.5";

const emptyForm = {
  code: "",
  description: "",
  type: "percentage" as "percentage" | "fixed",
  value: 0,
  minOrderAmount: 0,
  maxUses: 0,
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: "",
  isActive: true,
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    const res = await fetch("/api/promos");
    const data = await res.json();
    setPromos(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function createPromo(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success("Code promo créé");
      setShowForm(false);
      setForm(emptyForm);
      fetchPromos();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  }

  async function deletePromo(id: string) {
    if (!confirm("Supprimer ce code promo ?")) return;
    await fetch("/api/promos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Code promo supprimé");
    fetchPromos();
  }

  return (
    <div>
      <PageHeader eyebrow="Promotions" title="Codes promo">
        <GoldButton onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> {showForm ? "Fermer" : "Nouveau code"}
        </GoldButton>
      </PageHeader>

      {showForm && (
        <Card className="p-5 sm:p-6 mb-6">
          <form onSubmit={createPromo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="PROMO2024"
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Promo de lancement"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
                  className={inputCls}
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (€)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Valeur *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Commande min (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Valide du *</label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Valide au *</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Max utilisations</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <GoldButton type="submit">Créer le code promo</GoldButton>
              <GhostButton onClick={() => setShowForm(false)}>Annuler</GhostButton>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : promos.length === 0 ? (
          <EmptyState
            icon={<Tag size={18} strokeWidth={1.5} />}
            title="Aucun code promo"
            description="Créez un code pour offrir une réduction à vos clientes."
          />
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--brand-gold)]/15">
                    {["Code", "Réduction", "Utilisations", "Validité", "Statut", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-gold)]/10">
                  {promos.map((promo) => (
                    <tr key={promo._id} className="hover:bg-[var(--brand-cream)]/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-[13px] font-semibold text-gray-900">{promo.code}</td>
                      <td className="px-5 py-4 text-[13px] text-gray-700">
                        {promo.type === "percentage" ? `${promo.value} %` : formatPrice(promo.value)}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-gray-500 tabular-nums">
                        {promo.currentUses}
                        {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                      </td>
                      <td className="px-5 py-4 text-[12px] text-gray-400">
                        {new Date(promo.validFrom).toLocaleDateString("fr-FR")} → {new Date(promo.validUntil).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={promo.isActive ? "green" : "gray"}>
                          {promo.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => deletePromo(promo._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className="md:hidden divide-y divide-[var(--brand-gold)]/10">
              {promos.map((promo) => (
                <div key={promo._id} className="flex items-start gap-3 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[14px] font-semibold text-gray-900">{promo.code}</span>
                      <Badge tone={promo.isActive ? "green" : "gray"}>
                        {promo.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-gray-700">
                      {promo.type === "percentage" ? `${promo.value} % de réduction` : `${formatPrice(promo.value)} de réduction`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {promo.currentUses}{promo.maxUses ? ` / ${promo.maxUses}` : ""} utilisé{promo.currentUses > 1 ? "s" : ""} · jusqu&apos;au {new Date(promo.validUntil).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePromo(promo._id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition shrink-0"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
