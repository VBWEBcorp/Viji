"use client";

import { useEffect, useState, useRef } from "react";
import {
  Mail,
  ChevronDown,
  ChevronRight,
  Save,
  Check,
  Eye,
  EyeOff,
  Send,
  ShoppingCart,
  Truck,
  UserPlus,
  XCircle,
  RotateCcw,
  Star,
  Bell,
  Package,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, Card, GoldButton } from "@/components/admin/ui";

interface EmailTemplate {
  _id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  variables: string[];
  isActive: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  order_confirmation: ShoppingCart,
  shipping_notification: Truck,
  welcome: UserPlus,
  order_cancelled: XCircle,
  refund: RotateCcw,
  review_request: Star,
  abandoned_cart: Bell,
  back_in_stock: Package,
};

// Labels user-friendly pour les variables
const variableButtons: Record<string, { label: string; example: string }> = {
  customerName: { label: "Nom du client", example: "Marie Dupont" },
  orderNumber: { label: "N° de commande", example: "CMD-2504-1234" },
  items: { label: "Liste des articles", example: "T-shirt Essential x2, Jean Slim x1" },
  subtotal: { label: "Sous-total", example: "127,00 €" },
  shippingCost: { label: "Frais de livraison", example: "4,99 €" },
  discount: { label: "Réduction", example: "10,00 €" },
  total: { label: "Total", example: "121,99 €" },
  shippingAddress: { label: "Adresse de livraison", example: "12 rue de la Paix, 75002 Paris" },
  carrier: { label: "Transporteur", example: "Colissimo" },
  trackingNumber: { label: "N° de suivi", example: "6X123456789" },
  trackingUrl: { label: "Lien de suivi", example: "#" },
  reason: { label: "Raison", example: "À la demande du client" },
  refundAmount: { label: "Montant remboursé", example: "89,00 €" },
  products: { label: "Produits", example: "T-shirt Essential, Jean Slim" },
  cartItems: { label: "Articles du panier", example: "Sweat Oversize x1, Sneakers x1" },
  cartTotal: { label: "Total du panier", example: "218,00 €" },
  productName: { label: "Nom du produit", example: "T-shirt Essential Coton Bio" },
  productUrl: { label: "Lien du produit", example: "#" },
  productImage: { label: "Image du produit", example: "" },
  shopUrl: { label: "Lien de la boutique", example: "" },
};

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTemplate, setOpenTemplate] = useState<string | null>(null);
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  function updateTemplate(key: string, field: "subject" | "body", value: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
    setModified((prev) => new Set(prev).add(key));
  }

  // Insère la variable à la position du curseur dans le textarea
  function insertVariable(templateKey: string, variable: string) {
    const textarea = bodyRefs.current[templateKey];
    if (!textarea) return;

    const tag = `{{${variable}}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);

    updateTemplate(templateKey, "body", newValue);

    // Remettre le focus et le curseur après l'insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);

    toast.success(`"${variableButtons[variable]?.label || variable}" inséré`);
  }

  async function saveTemplate(template: EmailTemplate) {
    setSaving(template.key);
    const res = await fetch("/api/emails", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: template.key,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      }),
    });

    if (res.ok) {
      toast.success("Modifications sauvegardées");
      setModified((prev) => {
        const next = new Set(prev);
        next.delete(template.key);
        return next;
      });
    } else {
      toast.error("Erreur lors de la sauvegarde");
    }
    setSaving(null);
  }

  async function toggleActive(template: EmailTemplate) {
    const res = await fetch("/api/emails", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: template.key,
        subject: template.subject,
        body: template.body,
        isActive: !template.isActive,
      }),
    });

    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => (t.key === template.key ? { ...t, isActive: !t.isActive } : t))
      );
      toast.success(template.isActive ? "Email désactivé" : "Email activé");
    }
  }

  function generatePreview(template: EmailTemplate): string {
    let html = template.body;
    for (const [key, info] of Object.entries(variableButtons)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), info.example || key);
    }
    return html;
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow="Communication" title="Emails" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-[var(--brand-gold)]/15 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div>
      <PageHeader
        eyebrow="Communication"
        title="Emails"
        subtitle={`Personnalisez les emails envoyés à vos clientes · ${activeCount} actif${activeCount > 1 ? "s" : ""} sur ${templates.length}`}
      />

      {/* Templates */}
      <div className="space-y-3">
        {templates.map((template) => {
          const isOpen = openTemplate === template.key;
          const isModified = modified.has(template.key);
          const Icon = iconMap[template.key] || Mail;

          return (
            <Card key={template.key} className="overflow-hidden">
              {/* En-tête */}
              <button
                onClick={() => setOpenTemplate(isOpen ? null : template.key)}
                className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-[var(--brand-cream)]/40 transition-colors text-left"
              >
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                  template.isActive ? "bg-[var(--brand-cream)]" : "bg-gray-50"
                }`}>
                  <Icon size={18} className={template.isActive ? "text-[var(--brand-gold)]" : "text-gray-300"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-[14px] font-semibold ${template.isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {template.name}
                    </h3>
                    {isModified && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    {!template.isActive && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400">{template.description}</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </button>

              {/* Éditeur */}
              {isOpen && (
                <div className="border-t border-[var(--brand-gold)]/15 px-5 sm:px-6 py-5 space-y-5">
                  {/* Activer/désactiver */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={template.isActive}
                        onChange={() => toggleActive(template)}
                        className="w-4 h-4 border-gray-300 accent-[var(--brand-gold)]"
                      />
                      <span className="text-sm text-gray-700">Activer cet email</span>
                    </label>
                    <button
                      onClick={() => setPreviewKey(previewKey === template.key ? null : template.key)}
                      className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition"
                    >
                      {previewKey === template.key ? <EyeOff size={14} /> : <Eye size={14} />}
                      {previewKey === template.key ? "Masquer l'aperçu" : "Voir l'aperçu"}
                    </button>
                  </div>

                  {/* Objet */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                      Objet de l&apos;email
                    </label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) => updateTemplate(template.key, "subject", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition"
                    />
                  </div>

                  {/* Contenu */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
                      Contenu du message
                    </label>
                    <textarea
                      ref={(el) => { bodyRefs.current[template.key] = el; }}
                      value={template.body}
                      onChange={(e) => updateTemplate(template.key, "body", e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition leading-relaxed"
                    />
                  </div>

                  {/* Boutons d'insertion — user-friendly */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-2">
                      Insérer une information automatique
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2.5">
                      Cliquez sur un bouton pour l&apos;insérer dans le contenu. L&apos;information sera remplacée automatiquement lors de l&apos;envoi.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.variables.map((v) => (
                        <button
                          key={v}
                          onClick={() => insertVariable(template.key, v)}
                          className="inline-flex items-center gap-1.5 text-[12px] bg-[var(--brand-cream)] text-[var(--brand-gold-dark)] border border-[var(--brand-gold)]/20 px-3 py-1.5 hover:bg-[var(--brand-cream)]/70 hover:border-[var(--brand-gold)]/40 transition cursor-pointer font-medium"
                        >
                          <Plus size={10} className="text-[var(--brand-gold)]/60" />
                          {variableButtons[v]?.label || v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu */}
                  {previewKey === template.key && (
                    <div>
                      <label className="block text-[13px] font-medium text-gray-600 mb-2">
                        <Eye size={13} className="inline mr-1" />
                        Aperçu de l&apos;email
                      </label>
                      <div className="border border-[var(--brand-gold)]/20 overflow-hidden">
                        {/* Barre macOS-style */}
                        <div className="bg-[var(--brand-cream)]/50 px-4 py-2.5 border-b border-[var(--brand-gold)]/10 flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-300" />
                            <span className="w-3 h-3 rounded-full bg-amber-300" />
                            <span className="w-3 h-3 rounded-full bg-emerald-300" />
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-[11px] text-gray-500">
                              <span className="text-gray-400">Objet :</span>{" "}
                              {template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => variableButtons[key]?.example || key)}
                            </p>
                          </div>
                        </div>

                        {/* Corps du mail */}
                        <div className="p-6 bg-white">
                          <div className="max-w-md mx-auto">
                            <div className="text-center pb-4 mb-4 border-b border-gray-100">
                              <h3 className="font-serif text-lg text-[var(--brand-gold)]">Entre Maman et Moi</h3>
                            </div>
                            <div
                              className="prose prose-sm max-w-none text-gray-700"
                              dangerouslySetInnerHTML={{ __html: generatePreview(template) }}
                            />
                            <div className="text-center pt-4 mt-6 border-t border-gray-100">
                              <p className="text-[11px] text-gray-400">
                                &copy; 2026 Entre Maman et Moi. Tous droits réservés.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <GoldButton onClick={() => saveTemplate(template)} disabled={!isModified || saving === template.key}>
                      {saving === template.key ? (
                        <><Check size={14} /> Sauvegardé…</>
                      ) : (
                        <><Save size={14} /> Sauvegarder</>
                      )}
                    </GoldButton>

                    <button
                      onClick={() => {
                        toast.success("Email de test envoyé (simulation)");
                      }}
                      className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.2em] text-gray-500 hover:text-[var(--brand-gold)] transition px-3 py-2.5"
                    >
                      <Send size={14} /> Envoyer un test
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
