"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Gift,
  Ban,
  Eye,
  Copy,
  Check,
  Settings,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import GiftCardVisual, { type GiftCardTemplate } from "@/components/shop/GiftCardVisual";
import { PageHeader, Card, GoldButton, GhostButton, EmptyState } from "@/components/admin/ui";

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  used: "Utilisée",
  expired: "Expirée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<string, string> = {
  active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  used: "border border-gray-200 bg-gray-50 text-gray-500",
  expired: "border border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border border-red-200 bg-red-50 text-red-600",
};

const TX_LABELS: Record<string, string> = {
  purchase: "Création",
  redemption: "Utilisation",
  refund: "Remboursement",
  cancellation: "Annulation",
};

interface GiftCardTx {
  type: string;
  amount: number;
  balanceAfter: number;
  orderNumber?: string;
  description?: string;
  createdAt: string;
}

interface GiftCard {
  _id: string;
  code: string;
  initialAmount: number;
  balance: number;
  status: string;
  source: string;
  purchasedBy?: { name?: string; email?: string };
  recipient?: { name?: string; email?: string; message?: string };
  expiresAt?: string;
  createdAt: string;
  transactions?: GiftCardTx[];
}

interface Preset {
  amount: number; // centimes
  label?: string;
}

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<GiftCard | null>(null);

  const fetchCards = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/gift-cards?${params}`);
        const data = await res.json();
        setCards(data.giftCards || []);
        setPagination({
          page: data.pagination?.page || 1,
          pages: data.pagination?.pages || 1,
          total: data.pagination?.total || 0,
        });
      } catch {
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchCards(1), 300);
    return () => clearTimeout(t);
  }, [fetchCards]);

  async function cancelCard(card: GiftCard) {
    if (!confirm(`Annuler la carte ${card.code} ? Le solde restant (${formatPrice(card.balance)}) sera perdu.`)) return;
    const res = await fetch(`/api/gift-cards/${card._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) {
      toast.success("Carte annulée");
      fetchCards(pagination.page);
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  }

  async function openDetail(card: GiftCard) {
    const res = await fetch(`/api/gift-cards/${card._id}`);
    if (res.ok) setDetail(await res.json());
  }

  return (
    <div>
      <PageHeader eyebrow="Boutique" title="Cartes cadeaux">
        <GoldButton onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle carte
        </GoldButton>
      </PageHeader>

      <GiftCardConfig />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Rechercher par code ou email…"
            className={`${inputCls} pl-10`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputCls} sm:w-48`}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="used">Utilisées</option>
          <option value="expired">Expirées</option>
          <option value="cancelled">Annulées</option>
        </select>
        <button
          onClick={() => fetchCards(pagination.page)}
          disabled={loading}
          className="p-2.5 border border-[var(--brand-gold)]/20 text-gray-500 hover:text-[var(--brand-gold)] transition disabled:opacity-50 shrink-0"
          aria-label="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Liste */}
      <Card className="overflow-hidden">
        {loading && cards.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<Gift size={18} strokeWidth={1.5} />}
            title="Aucune carte cadeau"
            description="Créez une carte cadeau ou activez la vente sur la boutique."
          />
        ) : (
          <div className="divide-y divide-[var(--brand-gold)]/10">
            {cards.map((card) => (
              <div key={card._id} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--brand-cream)]/40 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <Gift className="w-5 h-5 text-[var(--brand-gold)] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">{card.code}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-medium uppercase tracking-[0.12em] ${STATUS_STYLES[card.status] || "border border-gray-200 bg-gray-50"}`}>
                        {STATUS_LABELS[card.status] || card.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-0.5">
                      <span>Initial : {formatPrice(card.initialAmount)}</span>
                      <span>Solde : {formatPrice(card.balance)}</span>
                      {card.recipient?.email && <span className="truncate max-w-[160px]">{card.recipient.email}</span>}
                      <span>{formatDate(card.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openDetail(card)} className="p-2 text-gray-400 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/60 transition" title="Détail">
                    <Eye className="w-4 h-4" />
                  </button>
                  {card.status === "active" && (
                    <button onClick={() => cancelCard(card)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Annuler">
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => fetchCards(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-[var(--brand-gold)] disabled:opacity-40 transition"
          >
            ← Précédent
          </button>
          <span className="text-sm text-gray-500 tabular-nums">{pagination.page} / {pagination.pages}</span>
          <button
            onClick={() => fetchCards(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages || loading}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-[var(--brand-gold)] disabled:opacity-40 transition"
          >
            Suivant →
          </button>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchCards(1);
          }}
        />
      )}

      {detail && <DetailModal card={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── Configuration (toggle + presets) ──────────────────────────
function GiftCardConfig() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [expiryMonths, setExpiryMonths] = useState(0);
  const [template, setTemplate] = useState<GiftCardTemplate>({});
  const [shopName, setShopName] = useState("Ma Boutique");
  const [uploading, setUploading] = useState<"logo" | "bg" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(Boolean(data?.giftCards?.enabled));
        setPresets(data?.giftCards?.presets || []);
        setExpiryMonths(data?.giftCards?.expiryMonths || 0);
        setTemplate(data?.giftCards?.template || {});
        setShopName(data?.shopName || "Ma Boutique");
      })
      .catch(() => {});
  }, []);

  function patchTemplate(patch: Partial<GiftCardTemplate>) {
    setTemplate((t) => ({ ...t, ...patch }));
    setDirty(true);
  }

  async function uploadImage(file: File, target: "logo" | "bg") {
    setUploading(target);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        patchTemplate(target === "logo" ? { logoUrl: data.url } : { backgroundImageUrl: data.url });
      } else {
        toast.error(data.error || "Échec de l'upload");
      }
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftCards: { enabled, presets, expiryMonths, template } }),
      });
      if (res.ok) {
        toast.success("Configuration enregistrée");
        setDirty(false);
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-[var(--brand-gold)]/15 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--brand-cream)]/40 transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[var(--brand-gold)]" />
          <span className="font-medium text-sm">Configuration</span>
          {!enabled && (
            <span className="text-[10px] px-2 py-0.5 uppercase tracking-[0.12em] border border-gray-200 bg-gray-50 text-gray-500">Désactivé</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-[var(--brand-gold)]/15">
          {/* Toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-medium">Activer les cartes cadeaux</p>
              <p className="text-xs text-gray-500">Affiche la page d&apos;achat et autorise l&apos;utilisation au checkout.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => { setEnabled(e.target.checked); setDirty(true); }}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-[var(--brand-gold)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Presets */}
          <div>
            <p className="text-sm font-medium mb-2">Montants proposés</p>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--brand-gold-dark)] w-20">{formatPrice(p.amount)}</span>
                  <input
                    type="text"
                    value={p.label || ""}
                    onChange={(e) => {
                      const next = [...presets];
                      next[i] = { ...next[i], label: e.target.value };
                      setPresets(next);
                      setDirty(true);
                    }}
                    placeholder="Label (ex : Découverte)"
                    className="flex-1 px-3 py-1.5 border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition"
                    maxLength={30}
                  />
                  <button
                    onClick={() => { setPresets(presets.filter((_, idx) => idx !== i)); setDirty(true); }}
                    className="p-1.5 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Montant (€)</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-24 px-2 py-1.5 border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition"
                  placeholder="50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition"
                  placeholder="Plaisir"
                  maxLength={30}
                />
              </div>
              <button
                onClick={() => {
                  const amt = parseFloat(newAmount);
                  if (!amt || amt < 5 || amt > 500) {
                    toast.error("Montant entre 5 € et 500 €");
                    return;
                  }
                  setPresets([...presets, { amount: Math.round(amt * 100), label: newLabel.trim() }]);
                  setNewAmount("");
                  setNewLabel("");
                  setDirty(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--brand-gold)] text-white hover:bg-[var(--brand-gold-dark)] transition text-sm"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium mb-1">Validité (mois)</label>
            <input
              type="number"
              min={1}
              value={expiryMonths || 12}
              onChange={(e) => { setExpiryMonths(parseInt(e.target.value) || 12); setDirty(true); }}
              className="w-24 px-2 py-1.5 border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">Par défaut 12 (1 an).</p>
          </div>

          {/* Personnalisation du visuel */}
          <div className="border-t border-[var(--brand-gold)]/15 pt-5">
            <p className="text-sm font-medium mb-1">Personnalisation de la carte</p>
            <p className="text-xs text-gray-500 mb-4">Logo, couleurs, image de fond et textes, appliqués au visuel web, à l&apos;email et au PDF imprimable.</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Champs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Titre affiché</label>
                  <input
                    type="text"
                    value={template.headline || ""}
                    onChange={(e) => patchTemplate({ headline: e.target.value })}
                    placeholder="Carte cadeau"
                    maxLength={40}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Texte en bas (optionnel)</label>
                  <input
                    type="text"
                    value={template.footerText || ""}
                    onChange={(e) => patchTemplate({ footerText: e.target.value })}
                    placeholder="Merci et à bientôt !"
                    maxLength={120}
                    className={inputCls}
                  />
                </div>
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Couleur d&apos;accent</label>
                    <input
                      type="color"
                      value={template.primaryColor || "#b08438"}
                      onChange={(e) => patchTemplate({ primaryColor: e.target.value })}
                      className="h-10 w-16 border border-[var(--brand-gold)]/20 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Couleur de fond</label>
                    <input
                      type="color"
                      value={template.backgroundColor || "#faf6ee"}
                      onChange={(e) => patchTemplate({ backgroundColor: e.target.value })}
                      className="h-10 w-16 border border-[var(--brand-gold)]/20 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Logo</label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 border border-[var(--brand-gold)]/25 text-[11px] uppercase tracking-[0.15em] text-gray-600 hover:border-[var(--brand-gold)]/50 cursor-pointer transition">
                      {uploading === "logo" ? "Envoi…" : "Choisir un logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo"); }}
                      />
                    </label>
                    {template.logoUrl && (
                      <button onClick={() => patchTemplate({ logoUrl: "" })} className="text-xs text-gray-400 hover:text-red-600">Retirer</button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Image de fond (optionnel)</label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 border border-[var(--brand-gold)]/25 text-[11px] uppercase tracking-[0.15em] text-gray-600 hover:border-[var(--brand-gold)]/50 cursor-pointer transition">
                      {uploading === "bg" ? "Envoi…" : "Choisir une image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "bg"); }}
                      />
                    </label>
                    {template.backgroundImageUrl && (
                      <button onClick={() => patchTemplate({ backgroundImageUrl: "" })} className="text-xs text-gray-400 hover:text-red-600">Retirer</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Aperçu en direct */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Aperçu</p>
                <GiftCardVisual
                  shopName={shopName}
                  amount={5000}
                  code="GC-XXXX-XXXX"
                  recipientName="Marie"
                  message="Joyeux anniversaire"
                  expiresAt={expiryMonths > 0 ? new Date(Date.now() + expiryMonths * 30 * 864e5) : null}
                  template={template}
                />
              </div>
            </div>
          </div>

          {dirty && (
            <div className="flex justify-end">
              <GoldButton onClick={save} disabled={saving}>
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </GoldButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal de création manuelle ────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [amount, setAmount] = useState(50);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount < 5 || amount > 500) {
      toast.error("Le montant doit être entre 5 € et 500 €");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          recipient: {
            name: recipientName || undefined,
            email: recipientEmail || undefined,
            message: message || undefined,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Carte ${data.code} créée`);
        onCreated();
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Overlay onClose={onClose} title="Nouvelle carte cadeau">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Montant (€) *</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`py-2 text-sm font-medium border transition ${amount === p ? "border-[var(--brand-gold)] bg-[var(--brand-cream)]/60 text-[var(--brand-gold-dark)]" : "border-[var(--brand-gold)]/20 text-gray-600 hover:border-[var(--brand-gold)]/40"}`}
              >
                {p}€
              </button>
            ))}
          </div>
          <input
            type="number"
            min={5}
            max={500}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Destinataire <span className="text-gray-400 font-normal">(email = envoi automatique)</span>
          </label>
          <div className="space-y-2">
            <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Prénom" className={inputCls} />
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Email" className={inputCls} />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optionnel)" rows={2} maxLength={500} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <GhostButton onClick={onClose} className="flex-1">Annuler</GhostButton>
          <GoldButton type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Création…" : `Créer (${formatPrice(Math.round(amount * 100))})`}
          </GoldButton>
        </div>
      </form>
    </Overlay>
  );
}

// ── Modal de détail ───────────────────────────────────────────
function DetailModal({ card, onClose }: { card: GiftCard; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Overlay onClose={onClose} title="Détail carte cadeau" wide>
      <div className="space-y-4">
        <GiftCardVisual
          shopName=""
          amount={card.initialAmount}
          code={card.code}
          recipientName={card.recipient?.name}
          message={card.recipient?.message}
        />

        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-lg font-bold">{card.code}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(card.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-1 text-gray-400 hover:text-gray-900"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-2 text-sm border-t border-[var(--brand-gold)]/15 pt-4">
          <Row label="Statut" value={STATUS_LABELS[card.status] || card.status} />
          <Row label="Montant initial" value={formatPrice(card.initialAmount)} />
          <Row label="Solde restant" value={formatPrice(card.balance)} />
          {card.recipient?.email && <Row label="Destinataire" value={card.recipient.email} />}
          {card.expiresAt && <Row label="Expiration" value={formatDate(card.expiresAt)} />}
          <Row label="Créée le" value={formatDate(card.createdAt)} />
        </div>

        {card.transactions && card.transactions.length > 0 && (
          <div className="border-t border-[var(--brand-gold)]/15 pt-4">
            <h4 className="text-xs font-semibold mb-2">Historique ({card.transactions.length})</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {card.transactions.map((tx, i) => {
                const debit = tx.type === "redemption" || tx.type === "cancellation";
                return (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/10">
                    <div className="min-w-0">
                      <span className="font-medium">{TX_LABELS[tx.type] || tx.type}</span>
                      {tx.orderNumber && <span className="text-gray-500 ml-1">{tx.orderNumber}</span>}
                      <span className="text-gray-400 ml-2">{formatDate(tx.createdAt)}</span>
                    </div>
                    <span className={`font-medium shrink-0 ${debit ? "text-red-600" : "text-green-600"}`}>
                      {debit ? "-" : "+"}{formatPrice(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <a
            href={`/api/gift-cards/${card._id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand-gold)] text-white text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:bg-[var(--brand-gold-dark)] transition"
          >
            <Printer className="w-4 h-4" /> Imprimer le PDF
          </a>
          <GhostButton onClick={onClose} className="flex-1">Fermer</GhostButton>
        </div>
      </div>
    </Overlay>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Overlay({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-[1px]" onClick={onClose}>
      <div
        className={`bg-white shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none border border-[var(--brand-gold)]/15`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--brand-gold)]/15 sticky top-0 bg-white z-10">
          <h3 className="font-serif text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-[var(--brand-gold)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
