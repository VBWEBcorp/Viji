"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import SeoPanel from "./SeoPanel";

interface Category {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  category: string;
  images: { url: string; alt: string; order: number }[];
  variants: {
    name: string;
    options: { value: string; priceModifier: number; stock: number; sku: string }[];
  }[];
  stock: number;
  sku: string;
  weight: number;
  fulfillmentType: "self" | "dropship";
  isActive: boolean;
  isFeatured: boolean;
  seo: { metaTitle: string; metaDescription: string };
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  slug?: string;
}

const defaultData: ProductFormData = {
  name: "",
  description: "",
  shortDescription: "",
  price: 0,
  compareAtPrice: 0,
  category: "",
  images: [],
  variants: [],
  stock: 0,
  sku: "",
  weight: 0,
  fulfillmentType: "self",
  isActive: true,
  isFeatured: false,
  seo: { metaTitle: "", metaDescription: "" },
};

export default function ProductForm({ initialData, slug }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({
    ...defaultData,
    ...initialData,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!slug;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function updateField<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...form.images];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push({
            url: data.url,
            alt: form.name || file.name,
            order: newImages.length,
          });
        } else {
          const data = await res.json();
          toast.error(data.error || "Erreur upload");
        }
      } catch {
        toast.error("Erreur lors de l'upload");
      }
    }

    updateField("images", newImages);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    updateField(
      "images",
      form.images.filter((_, i) => i !== index)
    );
  }

  function addVariant() {
    updateField("variants", [
      ...form.variants,
      { name: "", options: [{ value: "", priceModifier: 0, stock: 0, sku: "" }] },
    ]);
  }

  function removeVariant(index: number) {
    updateField(
      "variants",
      form.variants.filter((_, i) => i !== index)
    );
  }

  function updateVariant(index: number, key: string, value: string) {
    const updated = [...form.variants];
    (updated[index] as Record<string, unknown>)[key] = value;
    updateField("variants", updated);
  }

  function addVariantOption(variantIndex: number) {
    const updated = [...form.variants];
    updated[variantIndex].options.push({
      value: "",
      priceModifier: 0,
      stock: 0,
      sku: "",
    });
    updateField("variants", updated);
  }

  function removeVariantOption(variantIndex: number, optionIndex: number) {
    const updated = [...form.variants];
    updated[variantIndex].options = updated[variantIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    updateField("variants", updated);
  }

  function updateVariantOption(
    variantIndex: number,
    optionIndex: number,
    key: string,
    value: string | number
  ) {
    const updated = [...form.variants];
    (updated[variantIndex].options[optionIndex] as Record<string, unknown>)[key] = value;
    updateField("variants", updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing ? `/api/products/${slug}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Math.round(form.price * 100),
          compareAtPrice: form.compareAtPrice
            ? Math.round(form.compareAtPrice * 100)
            : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const productSlug = data.slug || slug;

        // Ping Google pour indexation
        if (productSlug) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          fetch("/api/indexing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: `${appUrl}/products/${productSlug}`, type: "URL_UPDATED" }),
          }).catch(() => {});
        }

        toast.success(isEditing ? "Produit mis à jour. Indexation Google lancée" : "Produit créé. Indexation Google lancée");
        router.push("/admin/products");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur serveur");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Informations principales */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Informations</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description courte
          </label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description complète *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie *
          </label>
          <select
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          >
            <option value="">Sélectionner...</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prix */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Prix & Stock</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix barré (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.compareAtPrice || ""}
              onChange={(e) =>
                updateField("compareAtPrice", parseFloat(e.target.value) || 0)
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) =>
                updateField("stock", parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poids (g)
            </label>
            <input
              type="number"
              min="0"
              value={form.weight}
              onChange={(e) =>
                updateField("weight", parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Images</h2>

        <div>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
            <div className="text-center">
              {uploading ? (
                <p className="text-sm text-gray-500">Upload en cours...</p>
              ) : (
                <>
                  <Plus size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Cliquer ou glisser des images</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5MB</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {form.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variantes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">Variantes</h2>
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
          >
            <Plus size={16} /> Ajouter une variante
          </button>
        </div>

        {form.variants.map((variant, vi) => (
          <div key={vi} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={variant.name}
                onChange={(e) => updateVariant(vi, "name", e.target.value)}
                placeholder="Nom (ex: Taille, Couleur)"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => removeVariant(vi)}
                className="p-1 text-red-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {variant.options.map((option, oi) => (
              <div key={oi} className="flex items-center gap-2 pl-4">
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) =>
                    updateVariantOption(vi, oi, "value", e.target.value)
                  }
                  placeholder="Valeur (ex: M, L, XL)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <input
                  type="number"
                  value={option.stock}
                  onChange={(e) =>
                    updateVariantOption(
                      vi,
                      oi,
                      "stock",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="Stock"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={option.priceModifier}
                  onChange={(e) =>
                    updateVariantOption(
                      vi,
                      oi,
                      "priceModifier",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="+/- €"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeVariantOption(vi, oi)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addVariantOption(vi)}
              className="ml-4 text-sm text-gray-500 hover:text-black"
            >
              + Ajouter une option
            </button>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Options</h2>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Produit actif</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => updateField("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">En vedette</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de fulfillment
          </label>
          <select
            value={form.fulfillmentType}
            onChange={(e) =>
              updateField(
                "fulfillmentType",
                e.target.value as "self" | "dropship"
              )
            }
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          >
            <option value="self">Expédié par nous</option>
            <option value="dropship">Dropshipping</option>
          </select>
        </div>
      </div>

      {/* SEO — Avec apercu Google */}
      <SeoPanel
        metaTitle={form.seo.metaTitle}
        metaDescription={form.seo.metaDescription}
        slug={slug || "nouveau-produit"}
        onMetaTitleChange={(v) => updateField("seo", { ...form.seo, metaTitle: v })}
        onMetaDescriptionChange={(v) => updateField("seo", { ...form.seo, metaDescription: v })}
        onSlugChange={() => {}}
        type="product"
      />

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Enregistrement..."
            : isEditing
            ? "Mettre à jour"
            : "Créer le produit"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
