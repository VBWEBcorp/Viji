"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Newspaper,
  Layout,
  PanelTop,
  ShoppingBag,
  Info,
  Mail,
  FileText,
  Save,
  Check,
  ImageIcon,
  Type,
  AlignLeft,
  Link2,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, GoldButton } from "@/components/admin/ui";
import {
  CONTENT_PAGES,
  CONTENT_DEFAULTS,
  type ContentType,
  type ContentCategory,
  type ContentField,
  type ContentPageDef,
} from "@/lib/content/registry";

// Map des noms d'icônes (registre) → composants lucide.
const ICONS: Record<string, React.ElementType> = {
  Home,
  Newspaper,
  Layout,
  PanelTop,
  ShoppingBag,
  Info,
  Mail,
  FileText,
};

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";

const FILTERS: { id: "all" | ContentCategory; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "page", label: "Pages" },
  { id: "component", label: "Composants" },
  { id: "legal", label: "Légal" },
];

// Le modèle Content n'accepte que text/html/image/banner.
function dbType(t: ContentType): "text" | "html" | "image" {
  if (t === "html") return "html";
  if (t === "image") return "image";
  return "text";
}

function fieldIcon(type: ContentType) {
  if (type === "image") return ImageIcon;
  if (type === "textarea" || type === "html") return AlignLeft;
  if (type === "url") return Link2;
  return Type;
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<Record<string, string>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ContentCategory>("all");
  const [selectedId, setSelectedId] = useState<string>(CONTENT_PAGES[0].id);

  useEffect(() => {
    // On part des valeurs réelles actuelles (défauts du registre), puis on
    // écrase avec ce qui a déjà été enregistré en base. Jamais vide.
    const base: Record<string, string> = {};
    for (const key in CONTENT_DEFAULTS) base[key] = CONTENT_DEFAULTS[key].default;

    fetch("/api/content")
      .then((r) => r.json())
      .then((data: { key: string; value: string }[]) => {
        if (Array.isArray(data)) {
          data.forEach((c) => {
            if (c.value != null && c.key in base) base[c.key] = c.value;
          });
        }
        setContents(base);
        setLoading(false);
      })
      .catch(() => {
        setContents(base);
        setLoading(false);
      });
  }, []);

  const filteredPages = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CONTENT_PAGES.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [search, filter]);

  const selected: ContentPageDef =
    CONTENT_PAGES.find((p) => p.id === selectedId) || CONTENT_PAGES[0];

  const selectedFields = selected.sections.flatMap((s) => s.fields);
  const selectedModifiedCount = selectedFields.filter((f) => modified[f.key]).length;

  function updateContent(key: string, value: string) {
    setContents((prev) => ({ ...prev, [key]: value }));
    setModified((prev) => ({ ...prev, [key]: true }));
  }

  async function saveField(field: ContentField) {
    setSaving((prev) => ({ ...prev, [field.key]: true }));
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: field.key,
        type: dbType(field.type),
        title: field.label,
        value: contents[field.key] ?? "",
      }),
    });
    if (res.ok) {
      setModified((prev) => ({ ...prev, [field.key]: false }));
    } else {
      toast.error(`Erreur sur « ${field.label} »`);
    }
    setSaving((prev) => ({ ...prev, [field.key]: false }));
    return res.ok;
  }

  async function saveAllInPage() {
    setSavingAll(true);
    let ok = true;
    for (const field of selectedFields) {
      if (modified[field.key]) {
        // eslint-disable-next-line no-await-in-loop
        const r = await saveField(field);
        ok = ok && r;
      }
    }
    setSavingAll(false);
    if (ok) toast.success("Modifications enregistrées");
  }

  async function handleImageUpload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        updateContent(key, data.url);
        toast.success("Image importée");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur d'import");
      }
    } catch {
      toast.error("Erreur d'import");
    }
    setUploading(null);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Site" title="Contenu du site" />
        <div className="bg-white border border-[var(--brand-gold)]/15 h-96 animate-pulse" />
      </div>
    );
  }

  const SelectedIcon = ICONS[selected.icon] || FileText;

  return (
    <div>
      <PageHeader
        eyebrow="Site"
        title="Contenu du site"
        subtitle="Choisissez une page, modifiez ses textes, images et vidéos, puis enregistrez."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
        {/* ============== SIDEBAR : choix de la page ============== */}
        <aside className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une page…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-[13px] focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-1 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/15 p-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-1 min-w-fit px-2.5 py-1.5 text-[12px] font-medium transition whitespace-nowrap ${
                  filter === f.id
                    ? "bg-white text-[var(--brand-gold-dark)] shadow-sm"
                    : "text-gray-500 hover:text-[var(--brand-gold)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[var(--brand-gold)]/15 p-2 space-y-0.5 max-h-72 lg:max-h-[70vh] overflow-y-auto">
            {filteredPages.length === 0 && (
              <p className="text-[12px] text-gray-400 text-center py-6">Aucune page trouvée</p>
            )}
            {filteredPages.map((page) => {
              const isSelected = page.id === selectedId;
              const Icon = ICONS[page.icon] || FileText;
              const pageModified = page.sections.some((s) =>
                s.fields.some((f) => modified[f.key])
              );
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedId(page.id);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      requestAnimationFrame(() => {
                        document
                          .getElementById("admin-content-editor")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      });
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--brand-gold)] text-white"
                      : "hover:bg-[var(--brand-cream)]/40 text-gray-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-white/15" : "bg-[var(--brand-cream)]/70"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? "text-white" : "text-[var(--brand-gold)]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium truncate">{page.name}</p>
                      {pageModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                    </div>
                    <p className={`text-[11px] truncate ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                      {page.route}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ============== ÉDITEUR ============== */}
        <main id="admin-content-editor">
          <div className="bg-white border border-[var(--brand-gold)]/15 overflow-hidden">
            {/* En-tête sticky avec « Tout enregistrer » */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--brand-gold)]/15 flex items-center justify-between gap-3 sticky top-0 lg:top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-cream)]/70 flex items-center justify-center shrink-0">
                  <SelectedIcon size={18} className="text-[var(--brand-gold)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg sm:text-xl text-gray-900 truncate">{selected.name}</h2>
                  <p className="text-[12px] text-gray-400 truncate">{selected.description}</p>
                </div>
              </div>
              {selectedModifiedCount > 0 && (
                <GoldButton onClick={saveAllInPage} disabled={savingAll} className="shrink-0">
                  <Save size={12} />
                  <span className="hidden sm:inline">
                    {savingAll ? "Enregistrement…" : `Enregistrer (${selectedModifiedCount})`}
                  </span>
                  <span className="sm:hidden">{savingAll ? "…" : `(${selectedModifiedCount})`}</span>
                </GoldButton>
              )}
            </div>

            {/* Sections → champs */}
            <div className="px-4 sm:px-6 py-5 space-y-8">
              {selected.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold-dark)] font-medium pb-2 mb-4 border-b border-[var(--brand-gold)]/10">
                    {section.title}
                  </h3>
                  <div className="space-y-5">
                    {section.fields.map((field) => {
                      const FieldIcon = fieldIcon(field.type);
                      return (
                        <div key={field.key}>
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="min-w-0">
                              <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600">
                                <FieldIcon size={13} className="text-[var(--brand-gold)] shrink-0" />
                                {field.label}
                              </label>
                              {field.help && (
                                <p className="text-[11px] text-gray-400 mt-0.5 ml-[18px]">{field.help}</p>
                              )}
                            </div>
                            {modified[field.key] && (
                              <GoldButton
                                onClick={() => saveField(field)}
                                disabled={saving[field.key]}
                                className="shrink-0"
                              >
                                {saving[field.key] ? <Check size={12} /> : <Save size={12} />}
                                <span className="hidden sm:inline">
                                  {saving[field.key] ? "Enregistré" : "Enregistrer"}
                                </span>
                              </GoldButton>
                            )}
                          </div>

                          {field.type === "image" ? (
                            <div>
                              {contents[field.key] && (
                                <div className="mb-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={contents[field.key]}
                                    alt={field.label}
                                    className="max-h-40 border border-[var(--brand-gold)]/15 object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-2">
                                <label className="flex items-center justify-center sm:w-48 h-11 border border-dashed border-[var(--brand-gold)]/30 cursor-pointer hover:border-[var(--brand-gold)]/60 hover:bg-[var(--brand-cream)]/40 transition text-[12px] text-gray-500 gap-2 shrink-0">
                                  <ImageIcon size={14} className="text-[var(--brand-gold)]/60" />
                                  {uploading === field.key ? "Import…" : "Importer une image"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(field.key, e)}
                                    disabled={uploading === field.key}
                                    className="hidden"
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={contents[field.key] || ""}
                                  onChange={(e) => updateContent(field.key, e.target.value)}
                                  placeholder="…ou collez une URL d'image"
                                  className={inputCls}
                                />
                              </div>
                            </div>
                          ) : field.type === "textarea" || field.type === "html" ? (
                            <textarea
                              value={contents[field.key] || ""}
                              onChange={(e) => updateContent(field.key, e.target.value)}
                              rows={field.type === "html" ? 10 : 3}
                              className={field.type === "html" ? `${inputCls} font-mono` : inputCls}
                            />
                          ) : (
                            <input
                              type="text"
                              value={contents[field.key] || ""}
                              onChange={(e) => updateContent(field.key, e.target.value)}
                              className={inputCls}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
