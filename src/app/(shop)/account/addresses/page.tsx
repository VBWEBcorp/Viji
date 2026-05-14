"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { usePageTitle } from "@/lib/use-page-title";

interface Address {
  _id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  usePageTitle("Mes adresses");
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
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
            Livraison
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
            Mes <span className="italic text-[var(--brand-gold)]">adresses</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm({ street: "", city: "", zip: "", country: "FR" });
              setEditId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-6 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            <Plus size={13} /> Ajouter une adresse
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-8 mb-8 space-y-6"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
              Formulaire
            </p>
            <h3 className="font-serif text-2xl text-gray-900">
              {editId ? "Modifier l'adresse" : "Nouvelle adresse"}
            </h3>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              required
              placeholder="123 rue de la Paix"
              className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
                className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-5 pt-2">
            <button
              type="submit"
              className="bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
            >
              {editId ? "Enregistrer" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="text-[11px] uppercase tracking-[0.3em] text-gray-500 border-b border-gray-300 pb-1 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)] transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Addresses list */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-white border border-[var(--brand-gold)]/15 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
            <MapPin size={18} strokeWidth={1.5} />
          </div>
          <p className="font-serif italic text-2xl text-gray-900 mb-2">
            Aucune adresse enregistrée
          </p>
          <p className="text-[13px] text-gray-500 max-w-xs mx-auto leading-relaxed">
            Ajoutez une adresse pour accélérer vos prochaines commandes.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`relative bg-white border px-6 py-6 transition ${
                addr.isDefault
                  ? "border-[var(--brand-gold)]"
                  : "border-[var(--brand-gold)]/15"
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
                  <Check size={10} /> Par défaut
                </span>
              )}
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
                Adresse
              </p>
              <div className="font-serif text-[15px] text-gray-900 leading-relaxed mb-5 space-y-0.5">
                <p>{addr.street}</p>
                <p>
                  {addr.zip} {addr.city}
                </p>
                <p className="text-gray-500 italic">{addr.country}</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-[var(--brand-gold)]/10">
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr._id)}
                    className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
                  >
                    Définir par défaut
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => startEdit(addr)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[var(--brand-gold)] transition"
                    title="Modifier"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => deleteAddress(addr._id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
