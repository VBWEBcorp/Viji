"use client";

import { useEffect, useState } from "react";
import { Megaphone, Image as ImageIcon, Upload, X, Eye, Save, Check } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, GoldButton } from "@/components/admin/ui";
import PromoPopupCard from "@/components/shop/PromoPopupCard";
import Link from "next/link";

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";
const labelCls = "block text-[12px] font-medium text-gray-600 mb-1.5";

interface MarketingData {
  popup: {
    isActive: boolean;
    image: string;
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    delay: number;
    mode: "lien" | "code";
    promoCode: string;
  };
  banner: {
    isActive: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    linkUrl: string;
    speed: number;
  };
}

const defaultData: MarketingData = {
  popup: {
    isActive: false,
    image: "",
    title: "",
    description: "",
    buttonText: "En profiter",
    buttonUrl: "/products",
    delay: 5,
    mode: "lien",
    promoCode: "",
  },
  banner: {
    isActive: false,
    text: "",
    backgroundColor: "#111827",
    textColor: "#ffffff",
    linkUrl: "",
    speed: 30,
  },
};

interface PromoOption {
  _id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
}

/** Pourquoi un code ne marcherait pas aujourd'hui, ou null s'il est bon. */
function etatCode(p: PromoOption): string | null {
  if (!p.isActive) return "désactivé";
  if (new Date(p.validUntil).getTime() < Date.now()) return "expiré";
  if (p.maxUses && p.currentUses >= p.maxUses) return "épuisé";
  return null;
}

export default function AdminMarketingPage() {
  const [data, setData] = useState<MarketingData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"popup" | "banner">("popup");
  const [uploading, setUploading] = useState(false);
  const [promos, setPromos] = useState<PromoOption[]>([]);

  // Codes promo existants, pour la pop-up « code par email ».
  useEffect(() => {
    fetch("/api/promos")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setPromos(Array.isArray(list) ? list : []))
      .catch(() => setPromos([]));
  }, []);

  const codeChoisi = promos.find((p) => p.code === data.popup.promoCode);
  const codeProbleme =
    data.popup.mode === "code"
      ? !data.popup.promoCode
        ? "Choisissez le code à envoyer."
        : !codeChoisi
        ? "Ce code n'existe plus."
        : etatCode(codeChoisi)
      : null;

  useEffect(() => {
    fetch("/api/marketing")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData({
            popup: { ...defaultData.popup, ...d.popup },
            banner: { ...defaultData.banner, ...d.banner },
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (data.popup.isActive && codeProbleme) {
      toast.error(`Pop-up : ${codeProbleme}`);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) toast.success("Modifications sauvegardées");
    else toast.error("Erreur");
    setSaving(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const result = await res.json();
        setData({ ...data, popup: { ...data.popup, image: result.url } });
        toast.success("Image uploadée");
      }
    } catch {
      toast.error("Erreur upload");
    }
    setUploading(false);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Diffusion" title="Marketing" />
        <div className="bg-white border border-[var(--brand-gold)]/15 h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Diffusion"
        title="Marketing"
        subtitle="Gérez vos pop-ups promotionnels et votre bannière défilante"
      >
        <GoldButton onClick={handleSave} disabled={saving}>
          {saving ? <><Check size={14} /> Sauvegardé</> : <><Save size={14} /> Sauvegarder</>}
        </GoldButton>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/15 p-1 w-fit">
        <button
          onClick={() => setTab("popup")}
          className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium transition ${
            tab === "popup" ? "bg-white text-[var(--brand-gold-dark)] shadow-sm" : "text-gray-500 hover:text-[var(--brand-gold)]"
          }`}
        >
          <ImageIcon size={14} />
          Pop-up
          {data.popup.isActive && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button
          onClick={() => setTab("banner")}
          className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium transition ${
            tab === "banner" ? "bg-white text-[var(--brand-gold-dark)] shadow-sm" : "text-gray-500 hover:text-[var(--brand-gold)]"
          }`}
        >
          <Megaphone size={14} />
          Bannière
          {data.banner.isActive && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
      </div>

      {/* ═══════════════════════════════
          POP-UP
      ═══════════════════════════════ */}
      {tab === "popup" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulaire */}
          <div className="space-y-5">
            <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg sm:text-xl text-gray-900">Pop-up promotionnel</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.popup.isActive}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, isActive: e.target.checked } })}
                    className="w-4 h-4 accent-[var(--brand-gold)]"
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
              </div>

              {/* Ce que fait la pop-up */}
              <div>
                <label className={labelCls}>Que fait la pop-up ?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { v: "lien", titre: "Un bouton vers une page", aide: "Ex. : découvrir les kits" },
                    { v: "code", titre: "Envoyer un code par email", aide: "Le client laisse son email et reçoit le code" },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setData({ ...data, popup: { ...data.popup, mode: o.v, buttonText: o.v === "code" && data.popup.buttonText === "En profiter" ? "Recevoir mon code" : o.v === "lien" && data.popup.buttonText === "Recevoir mon code" ? "En profiter" : data.popup.buttonText } })}
                      className={`text-left px-4 py-3 border transition ${
                        data.popup.mode === o.v
                          ? "border-[var(--brand-gold)] bg-[var(--brand-cream)]/60"
                          : "border-[var(--brand-gold)]/20 hover:border-[var(--brand-gold)]/50"
                      }`}
                    >
                      <span className="block text-[13px] font-medium text-gray-900">{o.titre}</span>
                      <span className="block text-[11px] text-gray-500 mt-0.5">{o.aide}</span>
                    </button>
                  ))}
                </div>
              </div>

              {data.popup.mode === "code" && (
                <div className="bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/20 p-4 space-y-2">
                  <label className={labelCls}>Code envoyé par email</label>
                  <select
                    value={data.popup.promoCode}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, promoCode: e.target.value } })}
                    className={inputCls}
                  >
                    <option value="">Choisir un code…</option>
                    {promos.map((p) => (
                      <option key={p._id} value={p.code}>
                        {p.code} · {p.type === "percentage" ? `-${p.value} %` : `-${(p.value / 100).toFixed(2).replace(".", ",")} €`}
                        {etatCode(p) ? ` (${etatCode(p)})` : ""}
                      </option>
                    ))}
                  </select>
                  {codeProbleme ? (
                    <p className="text-[12px] text-red-600">{codeProbleme}</p>
                  ) : (
                    <p className="text-[12px] text-gray-500">
                      Le client le saisira dans la case « Code promo » au moment de payer (kits, plats à emporter, ateliers).
                    </p>
                  )}
                  <Link href="/admin/promos" className="inline-block text-[12px] text-[var(--brand-gold-dark)] underline">
                    Créer ou modifier un code promo
                  </Link>
                </div>
              )}

              {/* Image */}
              <div>
                <label className={labelCls}>Image</label>
                {data.popup.image ? (
                  <div className="relative mb-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.popup.image} alt="Pop-up" className="max-h-48 border border-[var(--brand-gold)]/15 object-cover" />
                    <button
                      onClick={() => setData({ ...data, popup: { ...data.popup, image: "" } })}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 text-gray-500 hover:text-red-500 shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[var(--brand-gold)]/25 cursor-pointer hover:border-[var(--brand-gold)]/50 hover:bg-[var(--brand-cream)]/40 transition">
                  <div className="text-center">
                    {uploading ? (
                      <p className="text-[12px] text-gray-400">Upload...</p>
                    ) : (
                      <>
                        <Upload size={20} className="mx-auto text-[var(--brand-gold)]/50 mb-1" />
                        <p className="text-[12px] text-gray-400">600x400px recommandé</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              {/* Titre */}
              <div>
                <label className={labelCls}>Titre</label>
                <input
                  type="text"
                  value={data.popup.title}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, title: e.target.value } })}
                  placeholder="Ex: -20% sur tout le site !"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={data.popup.description}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, description: e.target.value } })}
                  placeholder="Profitez de notre offre exceptionnelle..."
                  rows={3}
                  className={inputCls}
                />
              </div>

              {/* Bouton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Texte du bouton</label>
                  <input
                    type="text"
                    value={data.popup.buttonText}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, buttonText: e.target.value } })}
                    className={inputCls}
                  />
                </div>
                {data.popup.mode !== "code" && <div>
                  <label className={labelCls}>Lien du bouton</label>
                  <input
                    type="text"
                    value={data.popup.buttonUrl}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, buttonUrl: e.target.value } })}
                    placeholder="/products"
                    className={inputCls}
                  />
                </div>}
              </div>

              {/* Délai */}
              <div>
                <label className={labelCls}>
                  Délai avant affichage : {data.popup.delay}s
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={data.popup.delay}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, delay: parseInt(e.target.value) } })}
                  className="w-full accent-[var(--brand-gold)]"
                />
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>1s</span>
                  <span>30s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu pop-up */}
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 mb-3">
              <Eye size={13} className="text-[var(--brand-gold)]" /> Aperçu
            </label>
            <div className="bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/15 p-8 flex items-center justify-center min-h-[400px]">
              <PromoPopupCard popup={data.popup} onClose={() => {}} preview />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          BANNIÈRE
      ═══════════════════════════════ */}
      {tab === "banner" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--brand-gold)]/15 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg sm:text-xl text-gray-900">Bannière promotionnelle</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.banner.isActive}
                  onChange={(e) => setData({ ...data, banner: { ...data.banner, isActive: e.target.checked } })}
                  className="w-4 h-4 accent-[var(--brand-gold)]"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <p className="text-[12px] text-gray-400">
              La bannière s&apos;affiche au-dessus du header avec un texte qui défile. Idéal pour les promotions, les codes promo, les annonces importantes.
            </p>

            {/* Texte */}
            <div>
              <label className={labelCls}>
                Texte de la bannière
              </label>
              <input
                type="text"
                value={data.banner.text}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, text: e.target.value } })}
                placeholder="Ex: 🔥 SOLDES -30% avec le code PROMO30 · Livraison offerte dès 50€"
                className={inputCls}
              />
            </div>

            {/* Couleurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Couleur de fond</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.banner.backgroundColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, backgroundColor: e.target.value } })}
                    className="w-10 h-10 border border-[var(--brand-gold)]/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.banner.backgroundColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, backgroundColor: e.target.value } })}
                    className={`${inputCls} flex-1 font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Couleur du texte</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.banner.textColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, textColor: e.target.value } })}
                    className="w-10 h-10 border border-[var(--brand-gold)]/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.banner.textColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, textColor: e.target.value } })}
                    className={`${inputCls} flex-1 font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Lien */}
            <div>
              <label className={labelCls}>
                Lien au clic (optionnel)
              </label>
              <input
                type="text"
                value={data.banner.linkUrl}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, linkUrl: e.target.value } })}
                placeholder="/products?promo=true"
                className={inputCls}
              />
            </div>

            {/* Vitesse */}
            <div>
              <label className={labelCls}>
                Vitesse de défilement : {data.banner.speed}s
              </label>
              <input
                type="range"
                min={10}
                max={60}
                value={data.banner.speed}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, speed: parseInt(e.target.value) } })}
                className="w-full accent-[var(--brand-gold)]"
              />
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Rapide</span>
                <span>Lent</span>
              </div>
            </div>
          </div>

          {/* Aperçu bannière */}
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 mb-3">
              <Eye size={13} className="text-[var(--brand-gold)]" /> Aperçu de la bannière
            </label>
            <div className="overflow-hidden border border-[var(--brand-gold)]/20">
              <div
                className="py-2.5 overflow-hidden"
                style={{ backgroundColor: data.banner.backgroundColor }}
              >
                <div
                  className="animate-marquee flex items-center gap-10 whitespace-nowrap"
                  style={{
                    color: data.banner.textColor,
                    animationDuration: `${data.banner.speed}s`,
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="flex items-center gap-3 text-[13px] font-medium">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: data.banner.textColor, opacity: 0.5 }} />
                      {data.banner.text || "Votre texte promotionnel ici..."}
                    </span>
                  ))}
                </div>
              </div>
              {/* Faux header en dessous */}
              <div className="bg-white border-t border-[var(--brand-gold)]/10 px-6 py-3 flex items-center justify-between">
                <span className="font-serif text-sm text-gray-900">Entre Maman et Moi</span>
                <span className="text-xs text-gray-400">← le header sera ici</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
