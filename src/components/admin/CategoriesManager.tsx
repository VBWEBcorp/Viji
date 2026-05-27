"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderTree, X, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { Card, Badge, GoldButton, GhostButton, EmptyState } from "@/components/admin/ui";
import ImageUploader from "@/components/admin/ImageUploader";

const fieldCls =
  "w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";
const labelCls = "block text-[12px] font-medium text-gray-600 mb-1.5";

interface Filter {
  _id?: string;
  name: string;
  type: "select" | "multiselect" | "range" | "color";
  options: string[];
  unit?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | { _id: string; name: string };
  order: number;
  isActive: boolean;
  filters: Filter[];
  children?: Category[];
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    parent: "",
    isActive: true,
    filters: [] as Filter[],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  // Build tree structure
  function buildTree(cats: Category[]): Category[] {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    cats.forEach((c) => map.set(c._id, { ...c, children: [] }));
    cats.forEach((c) => {
      const parentId = typeof c.parent === "object" ? c.parent?._id : c.parent;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children!.push(map.get(c._id)!);
      } else {
        roots.push(map.get(c._id)!);
      }
    });

    return roots;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/categories/${editId}` : "/api/categories";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        parent: form.parent || null,
      }),
    });

    if (res.ok) {
      toast.success(editId ? "Categorie modifiée" : "Categorie créée");
      resetForm();
      fetchCategories();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Supprimer cette categorie ?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Categorie supprimée");
      fetchCategories();
    }
  }

  function startEdit(cat: Category) {
    setForm({
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
      parent: typeof cat.parent === "object" ? cat.parent?._id || "" : cat.parent || "",
      isActive: cat.isActive,
      filters: cat.filters || [],
    });
    setEditId(cat._id);
    setShowForm(true);
  }

  function resetForm() {
    setForm({ name: "", description: "", image: "", parent: "", isActive: true, filters: [] });
    setEditId(null);
    setShowForm(false);
  }

  // Filter management
  function addFilter() {
    setForm({
      ...form,
      filters: [...form.filters, { name: "", type: "select", options: [], unit: "" }],
    });
  }

  function updateFilter(index: number, field: string, value: unknown) {
    const updated = [...form.filters];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setForm({ ...form, filters: updated });
  }

  function removeFilter(index: number) {
    setForm({ ...form, filters: form.filters.filter((_, i) => i !== index) });
  }

  function addFilterOption(filterIndex: number) {
    const updated = [...form.filters];
    updated[filterIndex].options.push("");
    setForm({ ...form, filters: updated });
  }

  function updateFilterOption(filterIndex: number, optIndex: number, value: string) {
    const updated = [...form.filters];
    updated[filterIndex].options[optIndex] = value;
    setForm({ ...form, filters: updated });
  }

  function removeFilterOption(filterIndex: number, optIndex: number) {
    const updated = [...form.filters];
    updated[filterIndex].options = updated[filterIndex].options.filter((_, i) => i !== optIndex);
    setForm({ ...form, filters: updated });
  }

  function toggleExpand(id: string) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  }

  const tree = buildTree(categories);
  const rootCategories = categories.filter((c) => !c.parent);

  function renderCategory(cat: Category, depth = 0) {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded.has(cat._id);

    return (
      <div key={cat._id}>
        <div
          className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-[var(--brand-cream)]/40 transition-colors ${
            depth > 0 ? "border-l-2 border-[var(--brand-gold)]/15 ml-6" : ""
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: depth > 0 ? 0 : undefined }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(cat._id)} className="p-1 text-gray-400 hover:text-[var(--brand-gold)] transition">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <GripVertical size={14} className="text-gray-300 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-900">{cat.name}</span>
                <Badge tone={cat.isActive ? "green" : "gray"}>
                  {cat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {cat.filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {cat.filters.map((f, i) => (
                    <span key={i} className="text-[10px] bg-[var(--brand-cream)]/70 text-[var(--brand-gold-dark)] border border-[var(--brand-gold)]/20 px-1.5 py-0.5">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => startEdit(cat)}
              className="p-2 text-gray-400 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/60 transition"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => deleteCategory(cat._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{cat.children!.map((child) => renderCategory(child, depth + 1))}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-[13px] text-gray-500">
          {`${categories.length} catégorie${categories.length > 1 ? "s" : ""} · Gérez vos catégories, sous-catégories et filtres`}
        </p>
        <GoldButton onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Nouvelle catégorie
        </GoldButton>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-5 sm:p-6 mb-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-lg sm:text-xl text-gray-900">
              {editId ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </h2>
            <button onClick={resetForm} className="p-1 text-gray-400 hover:text-[var(--brand-gold)] transition">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ex: T-shirts, Chaussures, Accessoires..."
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Catégorie parente</label>
                <select
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                  className={fieldCls}
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {rootCategories
                    .filter((c) => c._id !== editId)
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Description de la catégorie (optionnel)"
                className={`${fieldCls} leading-relaxed`}
              />
            </div>

            <ImageUploader
              label="Image"
              value={form.image || ""}
              onChange={(v) => setForm({ ...form, image: v })}
              aspect="4 / 3"
            />

            {/* Dynamic Filters */}
            <div className="border-t border-[var(--brand-gold)]/10 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-serif text-lg text-gray-900">Filtres personnalisés</h3>
                  <p className="text-[12px] text-gray-500">
                    Définissez les filtres que les clients pourront utiliser (taille, couleur, matière, etc.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFilter}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] transition shrink-0"
                >
                  <Plus size={14} /> Ajouter un filtre
                </button>
              </div>

              {form.filters.length === 0 ? (
                <div className="bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/15 p-6 text-center">
                  <p className="text-[13px] text-gray-500 mb-2">Aucun filtre défini</p>
                  <p className="text-[11px] text-gray-400">
                    Exemples : Taille (S, M, L, XL), Couleur, Matière, Poids...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.filters.map((filter, fi) => (
                    <div key={fi} className="bg-[var(--brand-cream)]/30 border border-[var(--brand-gold)]/15 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Nom du filtre</label>
                            <input
                              type="text"
                              value={filter.name}
                              onChange={(e) => updateFilter(fi, "name", e.target.value)}
                              placeholder="Ex: Taille, Couleur..."
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Type</label>
                            <select
                              value={filter.type}
                              onChange={(e) => updateFilter(fi, "type", e.target.value)}
                              className={fieldCls}
                            >
                              <option value="select">Liste déroulante</option>
                              <option value="multiselect">Choix multiples</option>
                              <option value="range">Plage (min-max)</option>
                              <option value="color">Couleurs</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Unité (optionnel)</label>
                            <input
                              type="text"
                              value={filter.unit || ""}
                              onChange={(e) => updateFilter(fi, "unit", e.target.value)}
                              placeholder="kg, cm, ml..."
                              className={fieldCls}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFilter(fi)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition mt-5 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Options */}
                      {filter.type !== "range" && (
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                            Options {filter.type === "color" ? "(noms de couleurs)" : ""}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {filter.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateFilterOption(fi, oi, e.target.value)}
                                  placeholder={filter.type === "color" ? "Rouge" : "XL"}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-[var(--brand-gold)]/20 text-xs focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFilterOption(fi, oi)}
                                  className="text-gray-300 hover:text-red-500 transition"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addFilterOption(fi)}
                              className="px-2.5 py-1.5 text-[11px] text-gray-500 border border-dashed border-[var(--brand-gold)]/30 hover:border-[var(--brand-gold)]/50 hover:text-[var(--brand-gold)] transition"
                            >
                              + Ajouter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-[var(--brand-gold)]"
              />
              <span className="text-sm text-gray-700">Catégorie active</span>
            </label>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <GoldButton type="submit">
                {editId ? "Enregistrer" : "Créer la catégorie"}
              </GoldButton>
              <GhostButton type="button" onClick={resetForm}>
                Annuler
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {/* Categories tree */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<FolderTree size={18} strokeWidth={1.5} />}
            title="Aucune catégorie"
            description="Créez des catégories pour organiser vos produits."
          />
        ) : (
          <div className="divide-y divide-[var(--brand-gold)]/10">
            {tree.map((cat) => renderCategory(cat))}
          </div>
        )}
      </Card>
    </div>
  );
}
