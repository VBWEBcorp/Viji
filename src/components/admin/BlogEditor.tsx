"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Upload, Tag, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import SeoPanel from "./SeoPanel";
import { generateSlug } from "@/lib/utils";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="h-12 bg-gray-50 border-b border-gray-100" />
      <div className="h-[400px] animate-pulse bg-gray-50" />
    </div>
  ),
});

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Modifier l'article" : "Nouvel article"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Redigez et optimisez votre article pour le referencement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <Eye size={14} /> Apercu
            </Link>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Save size={14} /> Brouillon
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving ? "Sauvegardé..." : isPublished ? "Mettre a jour" : "Publier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 outline-none border-none bg-transparent"
            />
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor content={content} onChange={setContent} />

          {/* Excerpt */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-gray-600">
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
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Image de couverture</h3>
            {coverImage ? (
              <div className="relative mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Couverture"
                  className="w-full aspect-[16/9] object-cover rounded-xl border border-gray-100"
                />
                <button
                  onClick={() => setCoverImage("")}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-lg text-gray-500 hover:text-red-500 transition shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition">
              <div className="text-center">
                {uploading ? (
                  <p className="text-[12px] text-gray-400">Upload...</p>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto text-gray-300 mb-1" />
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Categorie</h3>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Conseils, Actualites, Guides..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
              <Tag size={14} className="inline mr-1" />
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
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[12px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg"
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Publication</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
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
