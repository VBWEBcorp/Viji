"use client";

import { Search, Globe } from "lucide-react";

interface SeoPanelProps {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  onMetaTitleChange: (v: string) => void;
  onMetaDescriptionChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  baseUrl?: string;
  type?: "blog" | "product";
}

export default function SeoPanel({
  metaTitle,
  metaDescription,
  slug,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onSlugChange,
  baseUrl = "",
  type = "blog",
}: SeoPanelProps) {
  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;
  const titleOk = titleLength > 0 && titleLength <= 60;
  const descOk = descLength > 0 && descLength <= 160;
  const urlPath = type === "blog" ? `/blog/${slug}` : `/products/${slug}`;
  const displayUrl = `${baseUrl || "https://votresite.fr"}${urlPath}`;

  return (
    <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--brand-gold)]/10">
        <Search size={16} className="text-[var(--brand-gold)]" />
        <h2 className="font-serif text-lg text-gray-900">Referencement SEO</h2>
      </div>

      {/* Meta Title */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-medium text-gray-600">
            Meta titre
          </label>
          <span
            className={`text-[11px] font-medium ${
              titleLength === 0
                ? "text-gray-300"
                : titleOk
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {titleLength}/60
          </span>
        </div>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="Titre pour Google (max 60 caracteres)"
          maxLength={70}
          className="w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
        />
        {titleLength > 60 && (
          <p className="text-[11px] text-red-500 mt-1">
            Le titre sera tronque dans les resultats Google (max 60 caracteres)
          </p>
        )}
      </div>

      {/* Meta Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-medium text-gray-600">
            Meta description
          </label>
          <span
            className={`text-[11px] font-medium ${
              descLength === 0
                ? "text-gray-300"
                : descOk
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {descLength}/160
          </span>
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Description pour Google (max 160 caracteres)"
          maxLength={170}
          rows={3}
          className="w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
        />
        {descLength > 160 && (
          <p className="text-[11px] text-red-500 mt-1">
            La description sera tronquee (max 160 caracteres)
          </p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
          URL (slug)
        </label>
        <div className="flex items-center">
          <span className="text-[12px] text-gray-400 bg-[var(--brand-cream)]/40 border border-r-0 border-[var(--brand-gold)]/20 px-3 py-2.5">
            {type === "blog" ? "/blog/" : "/products/"}
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              onSlugChange(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .replace(/-+/g, "-")
              )
            }
            placeholder="mon-article"
            className="flex-1 px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm font-mono focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Google Preview */}
      <div>
        <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 mb-3">
          <Globe size={13} className="text-[var(--brand-gold)]" />
          Apercu Google
        </label>
        <div className="bg-white border border-[var(--brand-gold)]/20 p-4 space-y-1">
          {/* Favicon + site name */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[var(--brand-cream)]/70 rounded-full flex items-center justify-center">
              <Globe size={14} className="text-[var(--brand-gold)]" />
            </div>
            <div>
              <p className="text-[12px] text-gray-800 leading-tight">Entre Maman et Moi</p>
              <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[400px]">
                {displayUrl}
              </p>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-[18px] leading-snug font-normal text-[#1a0dab] hover:underline cursor-pointer"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {metaTitle || "Titre de votre article"}
            {metaTitle.length > 60 && (
              <span className="text-gray-400">...</span>
            )}
          </h3>

          {/* Description */}
          <p
            className="text-[13px] leading-relaxed text-[#545454]"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {metaDescription
              ? metaDescription.slice(0, 160)
              : "Ajoutez une meta description pour voir l'apercu ici..."}
            {metaDescription.length > 160 && (
              <span className="text-gray-400">...</span>
            )}
          </p>
        </div>

        {/* SEO Score */}
        <div className="mt-3 flex items-center gap-3">
          <SeoIndicator ok={titleOk} label="Titre" />
          <SeoIndicator ok={descOk} label="Description" />
          <SeoIndicator ok={slug.length > 0} label="URL" />
        </div>
      </div>
    </div>
  );
}

function SeoIndicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-2 h-2 rounded-full ${
          ok ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
      <span className={`text-[11px] font-medium ${ok ? "text-emerald-600" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
