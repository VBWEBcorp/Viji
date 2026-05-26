"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Upload, Tag, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import SeoPanel from "./SeoPanel";
import { GoldButton, GhostButton } from "@/components/admin/ui";
import { generateSlug } from "@/lib/utils";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-[var(--brand-gold)]/20 overflow-hidden bg-white">
      <div className="h-12 bg-[var(--brand-cream)]/30 border-b border-[var(--brand-gold)]/15" />
      <div className="h-[400px] animate-pulse bg-[var(--brand-cream)]/40" />
    </div>
  ),
});

const fieldCls =
  "w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";

interface BlogEditorProps {
  initialData?: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    coverImage?: string;
    category?: string;
    tags: string[];
    seo: { metaTitle?: string; metaDescription?: string };
    isPublished: boolean;
  };
  editSlug?: string;
}

export default function BlogEditor({ initialData, editSlug }: BlogEditorProps) {
  const router = useRouter();
  const isEditing = !!editSlug;

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.seo?.metaDescription || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && !slugManuallyEdited && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isEditing, slugManuallyEdited]);

  // Auto-fill meta title from title if empty
  useEffect(() => {
    if (!metaTitle && title) {
      setMetaTitle(title.slice(0, 60));
    }
  }, [title, metaTitle]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setCoverImage(data.url);
        toast.success("Image uploadée");
      } else {
        toast.error("Erreur upload");
      }
    } catch {
      toast.error("Erreur upload");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSave(publish?: boolean) {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("L'extrait est requis");
      return;
    }

    setSaving(true);
    const shouldPublish = publish !== undefined ? publish : isPublished;

    const body = {
      title,
      content,
      excerpt,
      coverImage: coverImage || undefined,
      category: category || undefined,
      tags,
      seo: {
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
      },
      isPublished: shouldPublish,
    };

    try {
      const url = isEditing ? `/api/blog/${editSlug}` : "/api/blog";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();

        // Ping Google pour indexation si on publie
        if (shouldPublish) {
          pingGoogleIndexing(data.slug).catch(() => {
            // silently fail — indexing is best-effort
          });
        }

        toast.success(
          shouldPublish
            ? isEditing
              ? "Article mis a jour et indexation Google lancée"
              : "Article publié et indexation Google lancée"
            : "Brouillon sauvegarde"
        );
        router.push("/admin/blog");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur serveur");
    }
    setSaving(false);
  }

  return (
    <div className="pb-24 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-9">
        <div className="min-w-0">
          <Link
            href="/admin/blog"
            className="inline-block text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-[var(--brand-gold)] transition mb-2"
          >
            ← Retour
          </Link>
          <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1]">
            {isEditing ? "Modifier l'article" : "Nouvel article"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Redigez et optimisez votre article pour le referencement
          </p>
        </div>

        {/* Actions — masquées sur mobile (barre collante en bas), visibles dès sm */}
        <div className="hidden sm:flex flex-wrap items-center gap-2.5 shrink-0">
          {slug && (
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 border border-[var(--brand-gold)]/25 text-gray-600 text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)]/50 transition"
            >
              <Eye size={14} /> Apercu
            </Link>
          )}
          <GhostButton onClick={() => handleSave(false)} disabled={saving}>
            <Save size={14} /> Brouillon
          </GhostButton>
          <GoldButton onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "Sauvegardé..." : isPublished ? "Mettre a jour" : "Publier"}
          </GoldButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              className="w-full font-serif text-2xl sm:text-3xl text-gray-900 placeholder:text-gray-300 outline-none border-none bg-transparent"
            />
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor content={content} onChange={setContent} />

          {/* Excerpt */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium text-gray-600">
                Extrait / chapeau
              </label>
              <span className="text-[11px] text-gray-400">{excerpt.length}/500</span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Resume de l'article affiche dans les listes et les partages sociaux..."
              maxLength={500}
              rows={3}
              className={`${fieldCls} leading-relaxed`}
            />
          </div>

          {/* SEO Panel */}
          <SeoPanel
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            slug={slug}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onSlugChange={(v) => {
              setSlugManuallyEdited(true);
              setSlug(v);
            }}
            type="blog"
          />
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <h3 className="font-serif text-lg text-gray-900 mb-3">Image de couverture</h3>
            {coverImage ? (
              <div className="relative mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Couverture"
                  className="w-full aspect-[16/9] object-cover border border-[var(--brand-gold)]/15"
                />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 text-gray-500 hover:text-red-500 transition shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[var(--brand-gold)]/25 cursor-pointer hover:border-[var(--brand-gold)]/45 hover:bg-[var(--brand-cream)]/40 transition">
              <div className="text-center">
                {uploading ? (
                  <p className="text-[12px] text-gray-400">Upload...</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto text-[var(--brand-gold)]/40 mb-1" />
                    <p className="text-[12px] text-gray-400">1200x630px recommande</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Category */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <h3 className="font-serif text-lg text-gray-900 mb-3">Categorie</h3>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Conseils, Actualites, Guides..."
              className={fieldCls}
            />
          </div>

          {/* Tags */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <h3 className="font-serif text-lg text-gray-900 mb-3 flex items-center gap-1.5">
              <Tag size={15} className="text-[var(--brand-gold)]" />
              Tags
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajouter un tag..."
                className={fieldCls}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 border border-[var(--brand-gold)]/25 text-gray-600 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)]/50 transition shrink-0"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[12px] bg-[var(--brand-cream)]/60 text-[var(--brand-gold-dark)] px-2.5 py-1"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Publication Status */}
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6">
            <h3 className="font-serif text-lg text-gray-900 mb-3">Publication</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand-gold)]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {isPublished ? "Publié" : "Brouillon"}
                </span>
                <p className="text-[11px] text-gray-400">
                  {isPublished
                    ? "L'article est visible publiquement"
                    : "L'article n'est pas encore visible"}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Barre d'action — collante en bas sur mobile */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 px-4 py-3 bg-[var(--brand-cream)]/90 backdrop-blur border-t border-[var(--brand-gold)]/15 flex items-stretch gap-2.5">
        <GhostButton onClick={() => handleSave(false)} disabled={saving} className="flex-1">
          <Save size={14} /> Brouillon
        </GhostButton>
        <GoldButton onClick={() => handleSave(true)} disabled={saving} className="flex-1">
          {saving ? "..." : isPublished ? "Mettre a jour" : "Publier"}
        </GoldButton>
      </div>
    </div>
  );
}

/**
 * Ping Google pour indexation rapide via l'API Indexing
 * Utilise aussi le ping sitemap classique en fallback
 */
async function pingGoogleIndexing(postSlug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (!baseUrl) return;

  const postUrl = `${baseUrl}/blog/${postSlug}`;

  // 1. Ping Google Sitemap (fonctionne sans cle API)
  await fetch(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(`${baseUrl}/sitemap.xml`)}`,
    { mode: "no-cors" }
  ).catch(() => {});

  // 2. Ping IndexNow (Bing, Yandex, etc. — gratuit, pas de cle)
  await fetch(
    `https://www.bing.com/indexnow?url=${encodeURIComponent(postUrl)}&key=default`,
    { mode: "no-cors" }
  ).catch(() => {});

  // 3. Notifier notre API serveur pour Google Indexing API (si configuree)
  await fetch("/api/indexing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: postUrl, type: "URL_UPDATED" }),
  }).catch(() => {});
}
