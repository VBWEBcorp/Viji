"use client";

import { useEffect, useState } from "react";
import { Store, Mail, Truck, CreditCard, Shield, Eye, EyeOff, Check, Key, MapPin, BarChart3, FileText, Receipt, Plug } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, Card, GoldButton, Badge } from "@/components/admin/ui";
import ImageUploader from "@/components/admin/ImageUploader";

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";
const labelCls = "block text-[12px] font-medium text-gray-600 mb-1.5";
const sectionTitleCls = "font-serif text-lg sm:text-xl text-gray-900 flex items-center gap-2";

interface Settings {
  shopName: string;
  shopLogo: string;
  shopDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  shipping: {
    freeShippingThreshold: number;
    defaultWeight: number;
    homeDeliveryEnabled: boolean;
    mondialRelayEnabled: boolean;
    homeRate: number;
    pickupRate: number;
    homeFreeThreshold: number;
    pickupFreeThreshold: number;
  };
  tax: {
    rate: number;
    pricesIncludeTax: boolean;
    label: string;
  };
  invoice: {
    enabled: boolean;
    prefix: string;
    nextNumber: number;
    legalMention: string;
    iban: string;
    bic: string;
    bankName: string;
  };
  analytics: {
    googleAnalyticsId: string;
    plausibleDomain: string;
    metaPixelId: string;
    customHeadScript: string;
  };
  integrations: {
    formspreeId: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };
  legal: {
    siret: string;
    tva: string;
    rcs: string;
    capital: string;
    legalForm: string;
  };
  apiKeys: {
    stripeSecretKey: string;
    stripePublishableKey: string;
    stripeWebhookSecret: string;
    sendcloudPublicKey: string;
    sendcloudSecretKey: string;
    resendApiKey: string;
    resendFromEmail: string;
    mondialRelayBrandCode: string;
  };
}

const defaultSettings: Settings = {
  shopName: "Entre Maman et Moi",
  shopLogo: "",
  shopDescription: "",
  contactEmail: "contact@example.com",
  contactPhone: "",
  address: "",
  shipping: {
    freeShippingThreshold: 5000,
    defaultWeight: 500,
    homeDeliveryEnabled: true,
    mondialRelayEnabled: false,
    homeRate: 499,
    pickupRate: 399,
    homeFreeThreshold: 5000,
    pickupFreeThreshold: 5000,
  },
  tax: { rate: 20, pricesIncludeTax: true, label: "TVA" },
  invoice: {
    enabled: true,
    prefix: "FAC-",
    nextNumber: 1,
    legalMention: "TVA non applicable, art. 293 B du CGI",
    iban: "",
    bic: "",
    bankName: "",
  },
  analytics: { googleAnalyticsId: "", plausibleDomain: "", metaPixelId: "", customHeadScript: "" },
  integrations: { formspreeId: "" },
  social: { facebook: "", instagram: "", twitter: "", tiktok: "", youtube: "" },
  legal: { siret: "", tva: "", rcs: "", capital: "", legalForm: "" },
  apiKeys: {
    stripeSecretKey: "",
    stripePublishableKey: "",
    stripeWebhookSecret: "",
    sendcloudPublicKey: "",
    sendcloudSecretKey: "",
    resendApiKey: "",
    resendFromEmail: "",
    mondialRelayBrandCode: "",
  },
};

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-10 font-mono`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--brand-gold)] transition"
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setSettings({
            shopName: data.shopName || defaultSettings.shopName,
            shopLogo: data.shopLogo || "",
            shopDescription: data.shopDescription || "",
            contactEmail: data.contactEmail || defaultSettings.contactEmail,
            contactPhone: data.contactPhone || "",
            address: data.address || "",
            shipping: {
              freeShippingThreshold: data.shipping?.freeShippingThreshold ?? 5000,
              defaultWeight: data.shipping?.defaultWeight ?? 500,
              homeDeliveryEnabled: data.shipping?.homeDeliveryEnabled ?? true,
              mondialRelayEnabled: data.shipping?.mondialRelayEnabled ?? false,
              homeRate: data.shipping?.homeRate ?? 499,
              pickupRate: data.shipping?.pickupRate ?? 399,
              homeFreeThreshold: data.shipping?.homeFreeThreshold ?? 5000,
              pickupFreeThreshold: data.shipping?.pickupFreeThreshold ?? 5000,
            },
            tax: {
              rate: data.tax?.rate ?? 20,
              pricesIncludeTax: data.tax?.pricesIncludeTax ?? true,
              label: data.tax?.label || "TVA",
            },
            invoice: {
              enabled: data.invoice?.enabled ?? true,
              prefix: data.invoice?.prefix || "FAC-",
              nextNumber: data.invoice?.nextNumber ?? 1,
              legalMention: data.invoice?.legalMention || "",
              iban: data.invoice?.iban || "",
              bic: data.invoice?.bic || "",
              bankName: data.invoice?.bankName || "",
            },
            analytics: {
              googleAnalyticsId: data.analytics?.googleAnalyticsId || "",
              plausibleDomain: data.analytics?.plausibleDomain || "",
              metaPixelId: data.analytics?.metaPixelId || "",
              customHeadScript: data.analytics?.customHeadScript || "",
            },
            integrations: {
              formspreeId: data.integrations?.formspreeId || "",
            },
            social: {
              facebook: data.social?.facebook || "",
              instagram: data.social?.instagram || "",
              twitter: data.social?.twitter || "",
              tiktok: data.social?.tiktok || "",
              youtube: data.social?.youtube || "",
            },
            legal: {
              siret: data.legal?.siret || "",
              tva: data.legal?.tva || "",
              rcs: data.legal?.rcs || "",
              capital: data.legal?.capital || "",
              legalForm: data.legal?.legalForm || "",
            },
            apiKeys: {
              stripeSecretKey: data.apiKeys?.stripeSecretKey || "",
              stripePublishableKey: data.apiKeys?.stripePublishableKey || "",
              stripeWebhookSecret: data.apiKeys?.stripeWebhookSecret || "",
              sendcloudPublicKey: data.apiKeys?.sendcloudPublicKey || "",
              sendcloudSecretKey: data.apiKeys?.sendcloudSecretKey || "",
              resendApiKey: data.apiKeys?.resendApiKey || "",
              resendFromEmail: data.apiKeys?.resendFromEmail || "",
              mondialRelayBrandCode: data.apiKeys?.mondialRelayBrandCode || "",
            },
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) toast.success("Paramètres sauvegardes");
    else toast.error("Erreur");
    setSaving(false);
  }

  const tabs = [
    { id: "general", label: "General", icon: Store },
    { id: "api", label: "Cles API", icon: Key },
    { id: "shipping", label: "Livraison", icon: Truck },
    { id: "tax", label: "TVA / Facture", icon: Receipt },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "legal", label: "Legal", icon: Shield },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Configuration" title="Paramètres" />
        <Card className="h-96 animate-pulse"><span className="sr-only">Chargement…</span></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        subtitle="Configuration de votre boutique"
      />

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex gap-1 bg-[var(--brand-cream)]/60 border border-[var(--brand-gold)]/15 p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-[13px] font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-[var(--brand-gold-dark)] shadow-sm"
                  : "text-gray-500 hover:text-[var(--brand-gold)]"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl">
        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className={sectionTitleCls}>
                <Store size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Boutique
              </h2>
              <div>
                <label className={labelCls}>Nom</label>
                <input type="text" value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  className={inputCls} />
              </div>
              <ImageUploader
                label="Logo de la boutique"
                value={settings.shopLogo}
                onChange={(v) => setSettings({ ...settings, shopLogo: v })}
                aspect="5 / 2"
                fit="contain"
                help="Affiché dans l'en-tête et l'admin — PNG transparent recommandé. Compressé à l'import."
              />
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={settings.shopDescription} rows={3}
                  onChange={(e) => setSettings({ ...settings, shopDescription: e.target.value })}
                  className={inputCls} />
              </div>
            </Card>

            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className={sectionTitleCls}>
                <Mail size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telephone</label>
                  <input type="tel" value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Adresse</label>
                <input type="text" value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className={inputCls} />
              </div>
            </Card>

            <Card className="p-5 sm:p-6 space-y-4">
              <h2 className={sectionTitleCls}>Reseaux sociaux</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["facebook", "instagram", "twitter", "tiktok", "youtube"] as const).map((n) => (
                  <div key={n}>
                    <label className={`${labelCls} capitalize`}>{n}</label>
                    <input type="url" value={settings.social[n]}
                      onChange={(e) => setSettings({ ...settings, social: { ...settings.social, [n]: e.target.value } })}
                      placeholder={`https://${n}.com/...`}
                      className={inputCls} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* API Keys */}
        {activeTab === "api" && (
          <div className="space-y-6">
            {/* Stripe */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={sectionTitleCls}>
                  <CreditCard size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Stripe
                </h2>
                {settings.apiKeys.stripeSecretKey && (
                  <Badge tone="green">
                    <Check size={10} className="mr-1" /> Configure
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Paiement par carte bancaire. Creez un compte sur stripe.com puis copiez vos cles depuis le Dashboard → Developers → API Keys.
              </p>
              <div>
                <label className={labelCls}>Cle publique (pk_...)</label>
                <input type="text" value={settings.apiKeys.stripePublishableKey}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripePublishableKey: e.target.value } })}
                  placeholder="pk_test_..."
                  className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Cle secrete (sk_...)</label>
                <SecretInput value={settings.apiKeys.stripeSecretKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripeSecretKey: v } })}
                  placeholder="sk_test_..." />
              </div>
              <div>
                <label className={labelCls}>Secret Webhook (whsec_...)</label>
                <SecretInput value={settings.apiKeys.stripeWebhookSecret}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripeWebhookSecret: v } })}
                  placeholder="whsec_..." />
              </div>
            </Card>

            {/* Sendcloud */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={sectionTitleCls}>
                  <Truck size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Sendcloud
                </h2>
                {settings.apiKeys.sendcloudPublicKey && (
                  <Badge tone="green">
                    <Check size={10} className="mr-1" /> Configure
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Livraison multi-transporteurs. Creez un compte sur sendcloud.com → Settings → API.
              </p>
              <div>
                <label className={labelCls}>Cle publique</label>
                <input type="text" value={settings.apiKeys.sendcloudPublicKey}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, sendcloudPublicKey: e.target.value } })}
                  placeholder="..."
                  className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>Cle secrete</label>
                <SecretInput value={settings.apiKeys.sendcloudSecretKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, sendcloudSecretKey: v } })}
                  placeholder="..." />
              </div>
            </Card>

            {/* Mondial Relay */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={sectionTitleCls}>
                  <MapPin size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Mondial Relay (Points relais)
                </h2>
                {settings.apiKeys.mondialRelayBrandCode && (
                  <Badge tone="green">
                    <Check size={10} className="mr-1" /> Configure
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Permet au client de choisir un point relais au checkout. Creez un compte sur mondialrelay.fr/solutionspro pour obtenir votre Code Enseigne. Pour tester, utilisez <code className="font-mono bg-[var(--brand-cream)]/70 px-1">BDTEST13</code> (compte de demonstration officiel).
              </p>
              <div>
                <label className={labelCls}>Code Enseigne</label>
                <input type="text" value={settings.apiKeys.mondialRelayBrandCode}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, mondialRelayBrandCode: e.target.value } })}
                  placeholder="BDTEST13"
                  className={`${inputCls} font-mono`} />
              </div>
            </Card>

            {/* Resend */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className={sectionTitleCls}>
                  <Mail size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Resend (Emails)
                </h2>
                {settings.apiKeys.resendApiKey && (
                  <Badge tone="green">
                    <Check size={10} className="mr-1" /> Configure
                  </Badge>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Emails transactionnels (confirmation, expedition). Creez un compte sur resend.com → API Keys.
              </p>
              <div>
                <label className={labelCls}>Cle API</label>
                <SecretInput value={settings.apiKeys.resendApiKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, resendApiKey: v } })}
                  placeholder="re_..." />
              </div>
              <div>
                <label className={labelCls}>Email d&apos;expedition</label>
                <input type="text" value={settings.apiKeys.resendFromEmail}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, resendFromEmail: e.target.value } })}
                  placeholder="Entre Maman et Moi <noreply@mondomaine.com>"
                  className={inputCls} />
              </div>
            </Card>
          </div>
        )}

        {/* Shipping */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            {/* Modes de livraison actifs */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className={sectionTitleCls}>
                  <Truck size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Modes de livraison
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Activez les modes de livraison proposes au checkout. Si plusieurs sont actifs, le client choisit. Si un seul, il est applique automatiquement.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 border border-[var(--brand-gold)]/15 cursor-pointer hover:bg-[var(--brand-cream)]/40 transition">
                <input
                  type="checkbox"
                  checked={settings.shipping.homeDeliveryEnabled}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeDeliveryEnabled: e.target.checked } })}
                  className="w-4 h-4 mt-0.5 accent-[var(--brand-gold)]"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900">Livraison a domicile</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Le client saisit son adresse de livraison.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-[var(--brand-gold)]/15 cursor-pointer hover:bg-[var(--brand-cream)]/40 transition">
                <input
                  type="checkbox"
                  checked={settings.shipping.mondialRelayEnabled}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, mondialRelayEnabled: e.target.checked } })}
                  className="w-4 h-4 mt-0.5 accent-[var(--brand-gold)]"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                    Point Relais (Mondial Relay)
                    {settings.shipping.mondialRelayEnabled && !settings.apiKeys.mondialRelayBrandCode && (
                      <Badge tone="amber">Code Enseigne manquant</Badge>
                    )}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Le client choisit un point relais sur une carte. Necessite un Code Enseigne (onglet Cles API).
                  </p>
                </div>
              </label>
            </Card>

            {/* Frais par mode */}
            <Card className="p-5 sm:p-6 space-y-5">
              <div>
                <h2 className={sectionTitleCls}>Frais de livraison</h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Tarifs appliques au checkout selon le mode de livraison choisi.
                </p>
              </div>

              <div className="border border-[var(--brand-gold)]/15 p-4 space-y-3">
                <p className="text-[13px] font-semibold text-gray-700">Livraison a domicile</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tarif (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.homeRate / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeRate: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Gratuit à partir de (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.homeFreeThreshold / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeFreeThreshold: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      placeholder="0 pour desactiver"
                      className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="border border-[var(--brand-gold)]/15 p-4 space-y-3">
                <p className="text-[13px] font-semibold text-gray-700">Point Relais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tarif (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.pickupRate / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, pickupRate: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Gratuit à partir de (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.pickupFreeThreshold / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, pickupFreeThreshold: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      placeholder="0 pour desactiver"
                      className={inputCls} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Poids par défaut (g)
                </label>
                <input type="number" value={settings.shipping.defaultWeight}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, defaultWeight: parseInt(e.target.value) || 0 } })}
                  className={`${inputCls} max-w-xs`} />
                <p className="text-[11px] text-gray-400 mt-1">Utilisé par les transporteurs pour calculer les frais réels.</p>
              </div>
            </Card>
          </div>
        )}

        {/* Tax / Invoice */}
        {activeTab === "tax" && (
          <div className="space-y-6">
            {/* TVA */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className={sectionTitleCls}>
                  <Receipt size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> TVA
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Si vous etes en franchise de TVA (auto-entrepreneur sous seuil), mettez le taux à 0 et indiquez la mention legale appropriée dans Facture.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Taux de TVA (%)</label>
                  <input type="number" step="0.1" min="0" max="100"
                    value={settings.tax.rate}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, rate: parseFloat(e.target.value) || 0 } })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Libellé sur facture</label>
                  <input type="text" value={settings.tax.label}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, label: e.target.value } })}
                    placeholder="TVA"
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mode</label>
                  <select
                    value={settings.tax.pricesIncludeTax ? "ttc" : "ht"}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, pricesIncludeTax: e.target.value === "ttc" } })}
                    className={inputCls}
                  >
                    <option value="ttc">Prix produits TTC (TVA incluse)</option>
                    <option value="ht">Prix produits HT (TVA ajoutée)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Facture */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className={sectionTitleCls}>
                  <FileText size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Facture PDF
                </h2>
                <label className="inline-flex items-center gap-2 text-[12px] text-gray-600">
                  <input type="checkbox"
                    checked={settings.invoice.enabled}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, enabled: e.target.checked } })}
                    className="w-4 h-4 accent-[var(--brand-gold)]" />
                  Generer automatiquement
                </label>
              </div>
              <p className="text-[12px] text-gray-400">
                La facture est generée après paiement, jointe à l'email de confirmation et téléchargeable depuis l'espace client.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Préfixe numéro</label>
                  <input type="text" value={settings.invoice.prefix}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, prefix: e.target.value } })}
                    placeholder="FAC-"
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Prochain numéro</label>
                  <input type="number" min="1" value={settings.invoice.nextNumber}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, nextNumber: parseInt(e.target.value) || 1 } })}
                    className={`${inputCls} font-mono`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mention legale (bas de facture)</label>
                <textarea rows={2} value={settings.invoice.legalMention}
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, legalMention: e.target.value } })}
                  placeholder="TVA non applicable, art. 293 B du CGI"
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>IBAN</label>
                  <input type="text" value={settings.invoice.iban}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, iban: e.target.value } })}
                    placeholder="FR76..."
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>BIC</label>
                  <input type="text" value={settings.invoice.bic}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bic: e.target.value } })}
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Banque</label>
                  <input type="text" value={settings.invoice.bankName}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bankName: e.target.value } })}
                    className={`${inputCls} font-mono`} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className={sectionTitleCls}>
                  <BarChart3 size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Analytics & Tracking
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Renseignez les IDs des outils que vous utilisez. Les scripts sont injectés automatiquement sur tout le site.
                </p>
              </div>

              <div>
                <label className={labelCls}>Google Analytics 4 · ID de mesure</label>
                <input type="text" value={settings.analytics.googleAnalyticsId}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, googleAnalyticsId: e.target.value } })}
                  placeholder="G-XXXXXXXXXX"
                  className={`${inputCls} font-mono`} />
              </div>

              <div>
                <label className={labelCls}>Plausible · domaine</label>
                <input type="text" value={settings.analytics.plausibleDomain}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, plausibleDomain: e.target.value } })}
                  placeholder="maboutique.fr"
                  className={`${inputCls} font-mono`} />
                <p className="text-[11px] text-gray-400 mt-1">Alternative respectueuse RGPD à GA, à plausible.io ou auto-hébergée.</p>
              </div>

              <div>
                <label className={labelCls}>Meta Pixel (Facebook/Instagram Ads)</label>
                <input type="text" value={settings.analytics.metaPixelId}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, metaPixelId: e.target.value } })}
                  placeholder="123456789012345"
                  className={`${inputCls} font-mono`} />
              </div>

              <div>
                <label className={labelCls}>Script personnalisé (head)</label>
                <textarea rows={4} value={settings.analytics.customHeadScript}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, customHeadScript: e.target.value } })}
                  placeholder="<script>...</script> ou <link>"
                  className={`${inputCls} font-mono`} />
                <p className="text-[11px] text-gray-400 mt-1">HTML libre injecté dans le &lt;head&gt;. Pour Hotjar, Tawk.to, etc.</p>
              </div>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card className="p-5 sm:p-6 space-y-4">
              <div>
                <h2 className={sectionTitleCls}>
                  <Plug size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Formspree (formulaire de contact)
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Service gratuit pour recevoir les emails du formulaire de contact. Créez un form sur formspree.io et copiez l'ID (8 caractères).
                </p>
              </div>
              <div>
                <label className={labelCls}>Form ID</label>
                <input type="text" value={settings.integrations.formspreeId}
                  onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, formspreeId: e.target.value } })}
                  placeholder="xrgvozge"
                  className={`${inputCls} max-w-md font-mono`} />
                <p className="text-[11px] text-gray-400 mt-1">
                  URL endpoint : <code className="font-mono bg-[var(--brand-cream)]/70 px-1">https://formspree.io/f/{settings.integrations.formspreeId || "xxxxxxxx"}</code>
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Legal */}
        {activeTab === "legal" && (
          <Card className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className={sectionTitleCls}>
                <Shield size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" /> Informations legales
              </h2>
              <p className="text-[12px] text-gray-400 mt-1">
                Ces informations apparaissent sur les factures, dans les mentions légales, et dans le footer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Forme juridique</label>
                <input type="text" value={settings.legal.legalForm}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, legalForm: e.target.value } })}
                  placeholder="SAS, SARL, EI..."
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Capital social</label>
                <input type="text" value={settings.legal.capital}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, capital: e.target.value } })}
                  placeholder="10 000 €"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>SIRET</label>
                <input type="text" value={settings.legal.siret}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, siret: e.target.value } })}
                  placeholder="123 456 789 00012"
                  className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className={labelCls}>N° TVA intracommunautaire</label>
                <input type="text" value={settings.legal.tva}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, tva: e.target.value } })}
                  placeholder="FR12345678901"
                  className={`${inputCls} font-mono`} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>RCS</label>
                <input type="text" value={settings.legal.rcs}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, rcs: e.target.value } })}
                  placeholder="RCS Paris B 123 456 789"
                  className={inputCls} />
              </div>
            </div>
          </Card>
        )}

        {/* Save button */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <GoldButton type="submit" disabled={saving}>
            {saving ? "Sauvegardé..." : "Sauvegarder les paramètres"}
          </GoldButton>
        </div>
      </form>
    </div>
  );
}

