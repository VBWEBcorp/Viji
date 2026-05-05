"use client";

import { useEffect, useState } from "react";
import { Megaphone, Image as ImageIcon, Type, Upload, X, Eye, Save, Check } from "lucide-react";
import toast from "react-hot-toast";

interface MarketingData {
  popup: {
    isActive: boolean;
    image: string;
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    delay: number;
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

export default function AdminMarketingPage() {
  const [data, setData] = useState<MarketingData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"popup" | "banner">("popup");
  const [uploading, setUploading] = useState(false);

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
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Marketing</h1>
        <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Gérez vos pop-ups promotionnels et votre bannière défilante
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? <><Check size={14} /> Sauvegardé</> : <><Save size={14} /> Sauvegarder</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("popup")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            tab === "popup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ImageIcon size={14} />
          Pop-up
          {data.popup.isActive && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
        </button>
        <button
          onClick={() => setTab("banner")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            tab === "banner" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900">Pop-up promotionnel</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.popup.isActive}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, isActive: e.target.checked } })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
              </div>

              {/* Image */}
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Image</label>
                {data.popup.image ? (
                  <div className="relative mb-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.popup.image} alt="Pop-up" className="max-h-48 rounded-xl border border-gray-100 object-cover" />
                    <button
                      onClick={() => setData({ ...data, popup: { ...data.popup, image: "" } })}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-lg text-gray-500 hover:text-red-500 shadow-sm"
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
                        <p className="text-[12px] text-gray-400">600x400px recommandé</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Titre</label>
                <input
                  type="text"
                  value={data.popup.title}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, title: e.target.value } })}
                  placeholder="Ex: -20% sur tout le site !"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={data.popup.description}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, description: e.target.value } })}
                  placeholder="Profitez de notre offre exceptionnelle..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Bouton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Texte du bouton</label>
                  <input
                    type="text"
                    value={data.popup.buttonText}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, buttonText: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Lien du bouton</label>
                  <input
                    type="text"
                    value={data.popup.buttonUrl}
                    onChange={(e) => setData({ ...data, popup: { ...data.popup, buttonUrl: e.target.value } })}
                    placeholder="/products"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Délai */}
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                  Délai avant affichage : {data.popup.delay}s
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={data.popup.delay}
                  onChange={(e) => setData({ ...data, popup: { ...data.popup, delay: parseInt(e.target.value) } })}
                  className="w-full accent-gray-900"
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
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 mb-3">
              <Eye size={13} /> Aperçu
            </label>
            <div className="bg-gray-100 rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full">
                {data.popup.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.popup.image} alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {data.popup.title || "Titre de votre pop-up"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {data.popup.description || "Description de votre offre promotionnelle..."}
                  </p>
                  <button className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold">
                    {data.popup.buttonText || "En profiter"}
                  </button>
                  <button className="mt-3 text-xs text-gray-400">Non merci</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          BANNIÈRE
      ═══════════════════════════════ */}
      {tab === "banner" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-900">Bannière promotionnelle</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.banner.isActive}
                  onChange={(e) => setData({ ...data, banner: { ...data.banner, isActive: e.target.checked } })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <p className="text-[12px] text-gray-400">
              La bannière s&apos;affiche au-dessus du header avec un texte qui défile. Idéal pour les promotions, les codes promo, les annonces importantes.
            </p>

            {/* Texte */}
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                Texte de la bannière
              </label>
              <input
                type="text"
                value={data.banner.text}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, text: e.target.value } })}
                placeholder="Ex: 🔥 SOLDES -30% avec le code PROMO30 — Livraison offerte dès 50€"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Couleurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Couleur de fond</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.banner.backgroundColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, backgroundColor: e.target.value } })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.banner.backgroundColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, backgroundColor: e.target.value } })}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Couleur du texte</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={data.banner.textColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, textColor: e.target.value } })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.banner.textColor}
                    onChange={(e) => setData({ ...data, banner: { ...data.banner, textColor: e.target.value } })}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Lien */}
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                Lien au clic (optionnel)
              </label>
              <input
                type="text"
                value={data.banner.linkUrl}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, linkUrl: e.target.value } })}
                placeholder="/products?promo=true"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Vitesse */}
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                Vitesse de défilement : {data.banner.speed}s
              </label>
              <input
                type="range"
                min={10}
                max={60}
                value={data.banner.speed}
                onChange={(e) => setData({ ...data, banner: { ...data.banner, speed: parseInt(e.target.value) } })}
                className="w-full accent-gray-900"
              />
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Rapide</span>
                <span>Lent</span>
              </div>
            </div>
          </div>

          {/* Aperçu bannière */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 mb-3">
              <Eye size={13} /> Aperçu de la bannière
            </label>
            <div className="rounded-2xl overflow-hidden border border-gray-200">
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
              <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Ma Boutique</span>
                <span className="text-xs text-gray-400">← le header sera ici</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
