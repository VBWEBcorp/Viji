"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

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

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    minOrderAmount: 0,
    maxUses: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    isActive: true,
  });

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
      setForm({
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        minOrderAmount: 0,
        maxUses: 0,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: "",
        isActive: true,
      });
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Codes promo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          <Plus size={18} /> Nouveau code
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createPromo}
          className="bg-white rounded-xl border p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
                placeholder="PROMO2024"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Promo de lancement"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "percentage" | "fixed",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Valeur *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) =>
                  setForm({ ...form, value: parseFloat(e.target.value) || 0 })
                }
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Commande min (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Valide du *
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Valide au *
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  setForm({ ...form, validUntil: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max utilisations
              </label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxUses: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800"
          >
            Créer le code promo
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : promos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun code promo.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Réduction</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">Validité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promos.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-sm">
                    {promo.code}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {promo.type === "percentage"
                      ? `${promo.value}%`
                      : formatPrice(promo.value)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {promo.currentUses}
                    {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(promo.validFrom).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(promo.validUntil).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        promo.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {promo.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deletePromo(promo._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
