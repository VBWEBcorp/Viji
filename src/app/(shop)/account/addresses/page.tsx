"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Address {
  _id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ street: "", city: "", zip: "", country: "FR" });

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    setAddresses(data.addresses || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, addressId: editId } : form;

    const res = await fetch("/api/account/addresses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editId ? "Adresse modifiée" : "Adresse ajoutée");
      setShowForm(false);
      setEditId(null);
      setForm({ street: "", city: "", zip: "", country: "FR" });
      fetchAddresses();
    } else {
      toast.error("Erreur");
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm("Supprimer cette adresse ?")) return;
    await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: id }),
    });
    toast.success("Adresse supprimée");
    fetchAddresses();
  }

  async function setDefault(id: string) {
    await fetch("/api/account/addresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: id, isDefault: true }),
    });
    toast.success("Adresse par défaut mise à jour");
    fetchAddresses();
  }

  function startEdit(addr: Address) {
    setForm({ street: addr.street, city: addr.city, zip: addr.zip, country: addr.country });
    setEditId(addr._id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes adresses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos adresses de livraison</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm({ street: "", city: "", zip: "", country: "FR" });
              setEditId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            <Plus size={16} /> Ajouter
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">
            {editId ? "Modifier l'adresse" : "Nouvelle adresse"}
          </h3>
          <div>
            <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Adresse</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              required
              placeholder="123 rue de la Paix"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Code postal</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Ville</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
            >
              {editId ? "Enregistrer" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="text-sm text-gray-500 px-4 py-2.5 hover:text-gray-700 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Addresses list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <MapPin size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500 mb-1">Aucune adresse enregistree</p>
          <p className="text-xs text-gray-400">Ajoutez une adresse pour accelerer vos commandes</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`bg-white rounded-2xl border p-5 relative transition ${
                addr.isDefault ? "border-gray-900" : "border-gray-100"
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Check size={10} /> Par defaut
                </span>
              )}
              <div className="text-sm text-gray-600 space-y-0.5 mb-4">
                <p className="font-medium text-gray-900">{addr.street}</p>
                <p>{addr.zip} {addr.city}</p>
                <p>{addr.country}</p>
              </div>
              <div className="flex items-center gap-2">
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr._id)}
                    className="text-[12px] text-gray-500 hover:text-gray-700 transition"
                  >
                    Définir par défaut
                  </button>
                )}
                <button
                  onClick={() => startEdit(addr)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteAddress(addr._id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
