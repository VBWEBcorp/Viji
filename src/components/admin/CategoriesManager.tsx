"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderTree, X, GripVertical } from "lucide-react";
import toast from "react-hot-toast";

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
          className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${
            depth > 0 ? "border-l-2 border-gray-100 ml-6" : ""
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: depth > 0 ? 0 : undefined }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(cat._id)} className="p-1 text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6" />
            )}

            <GripVertical size={14} className="text-gray-300 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-900">{cat.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                  cat.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                  {cat.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {cat.filters.length > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {cat.filters.map((f, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
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
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => deleteCategory(cat._id)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""} · Gérez vos catégories, sous-catégories et filtres
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> Nouvelle categorie
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">
              {editId ? "Modifier la categorie" : "Nouvelle categorie"}
            </h2>
            <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ex: T-shirts, Chaussures, Accessoires..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Categorie parente</label>
                <select
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
                >
                  <option value="">Aucune (categorie principale)</option>
                  {rootCategories
                    .filter((c) => c._id !== editId)
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Description de la categorie (optionnel)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Image (URL)</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Dynamic Filters */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">Filtres personnalises</h3>
                  <p className="text-[11px] text-gray-400">
                    Definissez les filtres que les clients pourront utiliser (taille, couleur, matiere, etc.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFilter}
                  className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition"
                >
                  <Plus size={12} /> Ajouter un filtre
                </button>
              </div>

              {form.filters.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-[12px] text-gray-400 mb-2">Aucun filtre defini</p>
                  <p className="text-[11px] text-gray-400">
                    Exemples : Taille (S, M, L, XL), Couleur, Matiere, Poids...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.filters.map((filter, fi) => (
                    <div key={fi} className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Nom du filtre</label>
                            <input
                              type="text"
                              value={filter.name}
                              onChange={(e) => updateFilter(fi, "name", e.target.value)}
                              placeholder="Ex: Taille, Couleur..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Type</label>
                            <select
                              value={filter.type}
                              onChange={(e) => updateFilter(fi, "type", e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
                            >
                              <option value="select">Liste deroulante</option>
                              <option value="multiselect">Choix multiples</option>
                              <option value="range">Plage (min-max)</option>
                              <option value="color">Couleurs</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Unite (optionnel)</label>
                            <input
                              type="text"
                              value={filter.unit || ""}
                              onChange={(e) => updateFilter(fi, "unit", e.target.value)}
                              placeholder="kg, cm, ml..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFilter(fi)}
                          className="p-1.5 text-gray-400 hover:text-red-500 mt-5"
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
                                  className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFilterOption(fi, oi)}
                                  className="text-gray-300 hover:text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addFilterOption(fi)}
                              className="px-2.5 py-1.5 text-[11px] text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition"
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
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Categorie active</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                {editId ? "Enregistrer" : "Créer la categorie"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-[13px] text-gray-500 hover:text-gray-700 px-4 py-2.5 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories tree */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 mb-1">Aucune categorie</p>
            <p className="text-[12px] text-gray-400">
              Creez des categories pour organiser vos produits
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tree.map((cat) => renderCategory(cat))}
          </div>
        )}
      </div>
    </div>
  );
}
