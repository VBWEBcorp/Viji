"use client";

import { useEffect, useState } from "react";
import { Store, Mail, Truck, CreditCard, Shield, Eye, EyeOff, Check, Key, MapPin, BarChart3, FileText, Receipt, Plug } from "lucide-react";
import toast from "react-hot-toast";

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
    paypalClientId: string;
    paypalClientSecret: string;
    sendcloudPublicKey: string;
    sendcloudSecretKey: string;
    resendApiKey: string;
    resendFromEmail: string;
    mondialRelayBrandCode: string;
  };
}

const defaultSettings: Settings = {
  shopName: "Ma Boutique",
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
    paypalClientId: "",
    paypalClientSecret: "",
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
        className="w-full px-4 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-mono"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              paypalClientId: data.apiKeys?.paypalClientId || "",
              paypalClientSecret: data.apiKeys?.paypalClientSecret || "",
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
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Paramètres</h1>
        <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configuration de votre boutique</p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Store size={16} /> Boutique
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Nom</label>
                  <input type="text" value={settings.shopName}
                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Logo (URL)</label>
                  <input type="url" value={settings.shopLogo}
                    onChange={(e) => setSettings({ ...settings, shopLogo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Description</label>
                <textarea value={settings.shopDescription} rows={3}
                  onChange={(e) => setSettings({ ...settings, shopDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={16} /> Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email</label>
                  <input type="email" value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Telephone</label>
                  <input type="tel" value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Adresse</label>
                <input type="text" value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Reseaux sociaux</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["facebook", "instagram", "twitter", "tiktok", "youtube"] as const).map((n) => (
                  <div key={n}>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5 capitalize">{n}</label>
                    <input type="url" value={settings.social[n]}
                      onChange={(e) => setSettings({ ...settings, social: { ...settings.social, [n]: e.target.value } })}
                      placeholder={`https://${n}.com/...`}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API Keys */}
        {activeTab === "api" && (
          <div className="space-y-6">
            {/* Stripe */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} /> Stripe
                </h2>
                {settings.apiKeys.stripeSecretKey && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check size={10} /> Configure
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Paiement par carte bancaire. Creez un compte sur stripe.com puis copiez vos cles depuis le Dashboard → Developers → API Keys.
              </p>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cle publique (pk_...)</label>
                <input type="text" value={settings.apiKeys.stripePublishableKey}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripePublishableKey: e.target.value } })}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cle secrete (sk_...)</label>
                <SecretInput value={settings.apiKeys.stripeSecretKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripeSecretKey: v } })}
                  placeholder="sk_test_..." />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Secret Webhook (whsec_...)</label>
                <SecretInput value={settings.apiKeys.stripeWebhookSecret}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, stripeWebhookSecret: v } })}
                  placeholder="whsec_..." />
              </div>
            </div>

            {/* PayPal */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} /> PayPal
                </h2>
                {settings.apiKeys.paypalClientId && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check size={10} /> Configure
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Paiement PayPal. Creez une app sur developer.paypal.com → Dashboard → My Apps.
              </p>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Client ID</label>
                <input type="text" value={settings.apiKeys.paypalClientId}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, paypalClientId: e.target.value } })}
                  placeholder="AX..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Client Secret</label>
                <SecretInput value={settings.apiKeys.paypalClientSecret}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, paypalClientSecret: v } })}
                  placeholder="EK..." />
              </div>
            </div>

            {/* Sendcloud */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Truck size={16} /> Sendcloud
                </h2>
                {settings.apiKeys.sendcloudPublicKey && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check size={10} /> Configure
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Livraison multi-transporteurs. Creez un compte sur sendcloud.com → Settings → API.
              </p>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cle publique</label>
                <input type="text" value={settings.apiKeys.sendcloudPublicKey}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, sendcloudPublicKey: e.target.value } })}
                  placeholder="..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cle secrete</label>
                <SecretInput value={settings.apiKeys.sendcloudSecretKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, sendcloudSecretKey: v } })}
                  placeholder="..." />
              </div>
            </div>

            {/* Mondial Relay */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} /> Mondial Relay (Points relais)
                </h2>
                {settings.apiKeys.mondialRelayBrandCode && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check size={10} /> Configure
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Permet au client de choisir un point relais au checkout. Creez un compte sur mondialrelay.fr/solutionspro pour obtenir votre Code Enseigne. Pour tester, utilisez <code className="font-mono bg-gray-100 px-1 rounded">BDTEST13</code> (compte de demonstration officiel).
              </p>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Code Enseigne</label>
                <input type="text" value={settings.apiKeys.mondialRelayBrandCode}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, mondialRelayBrandCode: e.target.value } })}
                  placeholder="BDTEST13"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
            </div>

            {/* Resend */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Mail size={16} /> Resend (Emails)
                </h2>
                {settings.apiKeys.resendApiKey && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check size={10} /> Configure
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-400">
                Emails transactionnels (confirmation, expedition). Creez un compte sur resend.com → API Keys.
              </p>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cle API</label>
                <SecretInput value={settings.apiKeys.resendApiKey}
                  onChange={(v) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, resendApiKey: v } })}
                  placeholder="re_..." />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Email d&apos;expedition</label>
                <input type="text" value={settings.apiKeys.resendFromEmail}
                  onChange={(e) => setSettings({ ...settings, apiKeys: { ...settings.apiKeys, resendFromEmail: e.target.value } })}
                  placeholder="Ma Boutique <noreply@mondomaine.com>"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {/* Shipping */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            {/* Modes de livraison actifs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Truck size={16} /> Modes de livraison
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Activez les modes de livraison proposes au checkout. Si plusieurs sont actifs, le client choisit. Si un seul, il est applique automatiquement.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={settings.shipping.homeDeliveryEnabled}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeDeliveryEnabled: e.target.checked } })}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900">Livraison a domicile</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Le client saisit son adresse de livraison.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={settings.shipping.mondialRelayEnabled}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, mondialRelayEnabled: e.target.checked } })}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900 flex items-center gap-2">
                    Point Relais (Mondial Relay)
                    {settings.shipping.mondialRelayEnabled && !settings.apiKeys.mondialRelayBrandCode && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        Code Enseigne manquant
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    Le client choisit un point relais sur une carte. Necessite un Code Enseigne (onglet Cles API).
                  </p>
                </div>
              </label>
            </div>

            {/* Frais par mode */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Frais de livraison</h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Tarifs appliques au checkout selon le mode de livraison choisi.
                </p>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-[13px] font-semibold text-gray-700">Livraison a domicile</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Tarif (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.homeRate / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeRate: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Gratuit à partir de (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.homeFreeThreshold / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, homeFreeThreshold: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      placeholder="0 pour desactiver"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                  </div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="text-[13px] font-semibold text-gray-700">Point Relais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Tarif (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.pickupRate / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, pickupRate: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Gratuit à partir de (€)</label>
                    <input type="number" step="0.01" min="0"
                      value={(settings.shipping.pickupFreeThreshold / 100).toFixed(2)}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, pickupFreeThreshold: Math.round(parseFloat(e.target.value) * 100) || 0 } })}
                      placeholder="0 pour desactiver"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                  Poids par défaut (g)
                </label>
                <input type="number" value={settings.shipping.defaultWeight}
                  onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, defaultWeight: parseInt(e.target.value) || 0 } })}
                  className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                <p className="text-[11px] text-gray-400 mt-1">Utilisé par les transporteurs pour calculer les frais réels.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tax / Invoice */}
        {activeTab === "tax" && (
          <div className="space-y-6">
            {/* TVA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt size={16} /> TVA
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Si vous etes en franchise de TVA (auto-entrepreneur sous seuil), mettez le taux à 0 et indiquez la mention legale appropriée dans Facture.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Taux de TVA (%)</label>
                  <input type="number" step="0.1" min="0" max="100"
                    value={settings.tax.rate}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, rate: parseFloat(e.target.value) || 0 } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Libellé sur facture</label>
                  <input type="text" value={settings.tax.label}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, label: e.target.value } })}
                    placeholder="TVA"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Mode</label>
                  <select
                    value={settings.tax.pricesIncludeTax ? "ttc" : "ht"}
                    onChange={(e) => setSettings({ ...settings, tax: { ...settings.tax, pricesIncludeTax: e.target.value === "ttc" } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all"
                  >
                    <option value="ttc">Prix produits TTC (TVA incluse)</option>
                    <option value="ht">Prix produits HT (TVA ajoutée)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Facture */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} /> Facture PDF
                </h2>
                <label className="inline-flex items-center gap-2 text-[12px] text-gray-600">
                  <input type="checkbox"
                    checked={settings.invoice.enabled}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, enabled: e.target.checked } })}
                    className="w-4 h-4 rounded border-gray-300" />
                  Generer automatiquement
                </label>
              </div>
              <p className="text-[12px] text-gray-400">
                La facture est generée après paiement, jointe à l'email de confirmation et téléchargeable depuis l'espace client.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Préfixe numéro</label>
                  <input type="text" value={settings.invoice.prefix}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, prefix: e.target.value } })}
                    placeholder="FAC-"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Prochain numéro</label>
                  <input type="number" min="1" value={settings.invoice.nextNumber}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, nextNumber: parseInt(e.target.value) || 1 } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Mention legale (bas de facture)</label>
                <textarea rows={2} value={settings.invoice.legalMention}
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, legalMention: e.target.value } })}
                  placeholder="TVA non applicable, art. 293 B du CGI"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">IBAN</label>
                  <input type="text" value={settings.invoice.iban}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, iban: e.target.value } })}
                    placeholder="FR76..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">BIC</label>
                  <input type="text" value={settings.invoice.bic}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bic: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Banque</label>
                  <input type="text" value={settings.invoice.bankName}
                    onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bankName: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={16} /> Analytics & Tracking
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Renseignez les IDs des outils que vous utilisez. Les scripts sont injectés automatiquement sur tout le site.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Google Analytics 4 · ID de mesure</label>
                <input type="text" value={settings.analytics.googleAnalyticsId}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, googleAnalyticsId: e.target.value } })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Plausible · domaine</label>
                <input type="text" value={settings.analytics.plausibleDomain}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, plausibleDomain: e.target.value } })}
                  placeholder="maboutique.fr"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                <p className="text-[11px] text-gray-400 mt-1">Alternative respectueuse RGPD à GA, à plausible.io ou auto-hébergée.</p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Meta Pixel (Facebook/Instagram Ads)</label>
                <input type="text" value={settings.analytics.metaPixelId}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, metaPixelId: e.target.value } })}
                  placeholder="123456789012345"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Script personnalisé (head)</label>
                <textarea rows={4} value={settings.analytics.customHeadScript}
                  onChange={(e) => setSettings({ ...settings, analytics: { ...settings.analytics, customHeadScript: e.target.value } })}
                  placeholder="<script>...</script> ou <link>"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                <p className="text-[11px] text-gray-400 mt-1">HTML libre injecté dans le &lt;head&gt;. Pour Hotjar, Tawk.to, etc.</p>
              </div>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Plug size={16} /> Formspree (formulaire de contact)
                </h2>
                <p className="text-[12px] text-gray-400 mt-1">
                  Service gratuit pour recevoir les emails du formulaire de contact. Créez un form sur formspree.io et copiez l'ID (8 caractères).
                </p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Form ID</label>
                <input type="text" value={settings.integrations.formspreeId}
                  onChange={(e) => setSettings({ ...settings, integrations: { ...settings.integrations, formspreeId: e.target.value } })}
                  placeholder="xrgvozge"
                  className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
                <p className="text-[11px] text-gray-400 mt-1">
                  URL endpoint : <code className="font-mono bg-gray-100 px-1 rounded">https://formspree.io/f/{settings.integrations.formspreeId || "xxxxxxxx"}</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Legal */}
        {activeTab === "legal" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={16} /> Informations legales
              </h2>
              <p className="text-[12px] text-gray-400 mt-1">
                Ces informations apparaissent sur les factures, dans les mentions légales, et dans le footer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Forme juridique</label>
                <input type="text" value={settings.legal.legalForm}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, legalForm: e.target.value } })}
                  placeholder="SAS, SARL, EI..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Capital social</label>
                <input type="text" value={settings.legal.capital}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, capital: e.target.value } })}
                  placeholder="10 000 €"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">SIRET</label>
                <input type="text" value={settings.legal.siret}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, siret: e.target.value } })}
                  placeholder="123 456 789 00012"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">N° TVA intracommunautaire</label>
                <input type="text" value={settings.legal.tva}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, tva: e.target.value } })}
                  placeholder="FR12345678901"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">RCS</label>
                <input type="text" value={settings.legal.rcs}
                  onChange={(e) => setSettings({ ...settings, legal: { ...settings.legal, rcs: e.target.value } })}
                  placeholder="RCS Paris B 123 456 789"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="mt-6">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? "Sauvegardé..." : "Sauvegarder les paramètres"}
          </button>
        </div>
      </form>
    </div>
  );
}

