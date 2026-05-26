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
  X,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import GiftCardVisual from "@/components/shop/GiftCardVisual";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  used: "Utilisée",
  expired: "Expirée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  used: "bg-gray-100 text-gray-500",
  expired: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-600",
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Cartes cadeaux</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          <Plus size={18} /> Nouvelle carte
        </button>
      </div>

      <GiftCardConfig />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Rechercher par code ou email…"
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
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
          className="p-2.5 border rounded-lg text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading && cards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chargement…</div>
        ) : cards.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Gift className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Aucune carte cadeau.
          </div>
        ) : (
          <div className="divide-y">
            {cards.map((card) => (
              <div key={card._id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <Gift className="w-5 h-5 text-[var(--brand-gold)] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">{card.code}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[card.status] || "bg-gray-100"}`}>
                        {STATUS_LABELS[card.status] || card.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                      <span>Initial : {formatPrice(card.initialAmount)}</span>
                      <span>Solde : {formatPrice(card.balance)}</span>
                      {card.recipient?.email && <span>{card.recipient.email}</span>}
                      <span>{formatDate(card.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openDetail(card)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100" title="Détail">
                    <Eye className="w-4 h-4" />
                  </button>
                  {card.status === "active" && (
                    <button onClick={() => cancelCard(card)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" title="Annuler">
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => fetchCards(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="text-sm text-gray-500 tabular-nums">{pagination.page} / {pagination.pages}</span>
          <button
            onClick={() => fetchCards(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages || loading}
            className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
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
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftCards: { enabled, presets, expiryMonths } }),
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
    <div className="bg-white rounded-xl border mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">Configuration</span>
          {!enabled && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Désactivé</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t">
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
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
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
                  className="w-24 px-2 py-1.5 border rounded-lg text-sm"
                  placeholder="50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
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
                className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
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
              min={0}
              value={expiryMonths}
              onChange={(e) => { setExpiryMonths(parseInt(e.target.value) || 0); setDirty(true); }}
              className="w-24 px-2 py-1.5 border rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">0 = sans expiration.</p>
          </div>

          {dirty && (
            <div className="flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </button>
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
                className={`py-2 rounded-lg text-sm font-medium border-2 transition ${amount === p ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
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
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Destinataire <span className="text-gray-400 font-normal">(email = envoi automatique)</span>
          </label>
          <div className="space-y-2">
            <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Prénom" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optionnel)" rows={2} maxLength={500} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {submitting ? "Création…" : `Créer (${formatPrice(Math.round(amount * 100))})`}
          </button>
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

        <div className="space-y-2 text-sm border-t pt-4">
          <Row label="Statut" value={STATUS_LABELS[card.status] || card.status} />
          <Row label="Montant initial" value={formatPrice(card.initialAmount)} />
          <Row label="Solde restant" value={formatPrice(card.balance)} />
          {card.recipient?.email && <Row label="Destinataire" value={card.recipient.email} />}
          {card.expiresAt && <Row label="Expiration" value={formatDate(card.expiresAt)} />}
          <Row label="Créée le" value={formatDate(card.createdAt)} />
        </div>

        {card.transactions && card.transactions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold mb-2">Historique ({card.transactions.length})</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {card.transactions.map((tx, i) => {
                const debit = tx.type === "redemption" || tx.type === "cancellation";
                return (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded border">
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

        <button onClick={onClose} className="w-full px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">Fermer</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
