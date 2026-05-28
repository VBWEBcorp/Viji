"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  /** Ratio de l'aperçu (CSS aspect-ratio), ex. "4 / 3", "1 / 1", "5 / 2". */
  aspect?: string;
  /** "cover" recadre (photos), "contain" affiche entier (logos). */
  fit?: "cover" | "contain";
  /** Texte d'aide sous les champs. */
  help?: string;
}

const inputCls =
  "w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";

export default function ImageUploader({
  label,
  value,
  onChange,
  required,
  aspect = "4 / 3",
  fit = "cover",
  help,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
        if (data.compressed && data.originalSize && data.size) {
          const pct = Math.round((1 - data.size / data.originalSize) * 100);
          toast.success(pct > 0 ? `Photo importée (−${pct} % de poids)` : "Photo importée");
        } else {
          toast.success("Photo importée");
        }
      } else {
        toast.error(data.error || "Erreur lors de l'import");
      }
    } catch {
      toast.error("Erreur lors de l'import");
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Aperçu */}
        <div
          className="relative shrink-0 w-full sm:w-40 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/20 overflow-hidden"
          style={{ aspectRatio: aspect }}
        >
          {value ? (
            <>
              <Image
                src={value}
                alt=""
                fill
                sizes="160px"
                unoptimized
                className={fit === "contain" ? "object-contain p-2" : "object-cover"}
              />
              <button
                type="button"
                onClick={() => onChange("")}
                title="Retirer l'image"
                className="absolute top-1.5 right-1.5 bg-white/90 text-gray-700 hover:text-red-600 p-1 shadow-sm"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--brand-gold)]/40">
              <ImageIcon size={26} />
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 h-11 border border-dashed border-[var(--brand-gold)]/40 cursor-pointer hover:border-[var(--brand-gold)]/70 hover:bg-[var(--brand-cream)]/40 transition text-[12px] text-gray-600 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} className="text-[var(--brand-gold)]" />
            )}
            {uploading ? "Compression & import…" : "Importer une photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="… ou coller une URL https://"
            className={inputCls}
          />
          <p className="text-[11px] text-gray-400">
            {help || "JPG, PNG ou WebP, compressé automatiquement à l'import."}
          </p>
        </div>
      </div>
    </div>
  );
}
