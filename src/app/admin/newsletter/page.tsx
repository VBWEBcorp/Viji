"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Trash2,
  Download,
  Search,
  Users,
  Megaphone,
  Send,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  PageHeader,
  Card,
  Badge,
  GoldButton,
  GhostButton,
  EmptyState,
  TableSkeleton,
} from "@/components/admin/ui";
import { useConfirm } from "@/components/admin/ConfirmDialog";

interface Subscriber {
  _id: string;
  email: string;
  source: string;
  status: "active" | "unsubscribed";
  createdAt: string;
}

type Tab = "subscribers" | "campaign";

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";
const labelCls = "block text-[12px] font-medium text-gray-600 mb-1.5";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminNewsletterPage() {
  const confirm = useConfirm();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("subscribers");

  // Campagne
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/newsletter")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSubscribers(Array.isArray(data) ? data : []))
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = useMemo(
    () => subscribers.filter((s) => s.status !== "unsubscribed").length,
    [subscribers]
  );

  const thisMonth = useMemo(() => {
    const now = new Date();
    return subscribers.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [subscribers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  async function handleDelete(sub: Subscriber) {
    const ok = await confirm({
      title: "Retirer cet abonné ?",
      description: `${sub.email} sera supprimé de la liste. Cette action est irréversible.`,
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/newsletter/${sub._id}`, { method: "DELETE" });
    if (res.ok) {
      setSubscribers((list) => list.filter((s) => s._id !== sub._id));
      toast.success("Abonné supprimé");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  function handleExport() {
    if (subscribers.length === 0) return;
    const rows = [["Email", "Source", "Statut", "Inscription"]];
    for (const s of subscribers) {
      rows.push([
        s.email,
        s.source || "",
        s.status || "active",
        new Date(s.createdAt).toLocaleDateString("fr-FR"),
      ]);
    }
    const csv = rows
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Renseignez un objet et un message.");
      return;
    }
    if (activeCount === 0) {
      toast.error("Aucun abonné actif.");
      return;
    }
    const ok = await confirm({
      title: "Envoyer la campagne ?",
      description: `Ce message partira à ${activeCount} abonné${
        activeCount > 1 ? "s" : ""
      } actif${activeCount > 1 ? "s" : ""}. L'envoi est immédiat et irréversible.`,
      confirmLabel: "Envoyer",
    });
    if (!ok) return;

    setSending(true);
    try {
      const res = await fetch("/api/newsletter/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(
          `Campagne envoyée : ${data.sent}/${data.total} e-mail${
            data.total > 1 ? "s" : ""
          }`
        );
        if (data.failed > 0) toast.error(`${data.failed} envoi(s) en échec`);
        setSubject("");
        setMessage("");
      } else {
        toast.error(data.error || "L'envoi a échoué.");
      }
    } catch {
      toast.error("Erreur réseau, veuillez réessayer.");
    } finally {
      setSending(false);
    }
  }

  const stats = [
    { label: "Abonnés", value: subscribers.length, icon: Users },
    { label: "Actifs", value: activeCount, icon: Mail },
    { label: "Ce mois-ci", value: thisMonth, icon: Send },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Communication"
        title="Newsletter"
        subtitle={
          loading
            ? undefined
            : `${subscribers.length} abonné${subscribers.length > 1 ? "s" : ""} · ${activeCount} actif${activeCount > 1 ? "s" : ""}`
        }
      >
        {tab === "subscribers" && (
          <GhostButton onClick={handleExport} disabled={subscribers.length === 0}>
            <Download size={14} /> Exporter (CSV)
          </GhostButton>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-4 sm:px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-serif text-2xl sm:text-3xl text-gray-900 leading-none">
                  {loading ? "—" : stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-2">
                  {stat.label}
                </p>
              </div>
              <span className="w-9 h-9 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
                <stat.icon size={15} strokeWidth={1.5} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Onglets */}
      <div className="inline-flex bg-white border border-[var(--brand-gold)]/15 p-1 mb-5">
        {[
          { key: "subscribers" as const, label: "Abonnés", icon: Users },
          { key: "campaign" as const, label: "Campagne", icon: Megaphone },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
              tab === t.key
                ? "bg-[var(--brand-gold)] text-white"
                : "text-gray-500 hover:text-[var(--brand-gold)]"
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ======= ONGLET ABONNÉS ======= */}
      {tab === "subscribers" && (
        <>
          {subscribers.length > 0 && (
            <div className="relative mb-5 max-w-sm">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un e-mail…"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-[var(--brand-gold)] transition"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          <Card className="overflow-hidden">
            {loading ? (
              <TableSkeleton cols={3} />
            ) : filtered.length === 0 ? (
              search ? (
                <EmptyState
                  icon={<Search size={18} strokeWidth={1.5} />}
                  title="Aucun résultat"
                  description={`Aucun e-mail ne correspond à « ${search} ».`}
                  action={
                    <GhostButton onClick={() => setSearch("")}>
                      Effacer la recherche
                    </GhostButton>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Mail size={18} strokeWidth={1.5} />}
                  title="Aucun abonné pour le moment"
                  description="Les inscriptions via le formulaire du site apparaîtront ici."
                />
              )
            ) : (
              <>
                {/* Desktop : tableau */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--brand-gold)]/15">
                        {["E-mail", "Source", "Inscription", ""].map((h, i) => (
                          <th
                            key={i}
                            className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${
                              i === 3 ? "text-right" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-gold)]/10">
                      {filtered.map((sub) => (
                        <tr
                          key={sub._id}
                          className="hover:bg-[var(--brand-cream)]/40 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center shrink-0">
                                <Mail size={14} />
                              </span>
                              <span className="text-[13px] font-medium text-gray-900 truncate">
                                {sub.email}
                              </span>
                              {sub.status === "unsubscribed" && (
                                <Badge tone="gray">Désinscrit</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone="gold">{sub.source || "site"}</Badge>
                          </td>
                          <td className="px-5 py-4 text-[12px] text-gray-400">
                            {formatDate(sub.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDelete(sub)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile : cartes */}
                <div className="md:hidden divide-y divide-[var(--brand-gold)]/10">
                  {filtered.map((sub) => (
                    <div key={sub._id} className="flex items-center gap-3 px-4 py-3.5">
                      <span className="w-8 h-8 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center shrink-0">
                        <Mail size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 truncate">
                          {sub.email}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {sub.source || "site"} · {formatDate(sub.createdAt)}
                        </p>
                      </div>
                      {sub.status === "unsubscribed" && (
                        <Badge tone="gray">Désinscrit</Badge>
                      )}
                      <button
                        onClick={() => handleDelete(sub)}
                        className="p-2 text-gray-400 hover:text-red-600 transition shrink-0"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* ======= ONGLET CAMPAGNE ======= */}
      {tab === "campaign" && (
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-2.5 border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/50 px-4 py-3 text-[13px] text-gray-700">
            <Send size={15} className="shrink-0 text-[var(--brand-gold)]" />
            <span>
              Ce message sera envoyé à{" "}
              <strong className="font-medium text-gray-900">{activeCount}</strong>{" "}
              abonné{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}.
            </span>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Objet *</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex : Nos nouveautés du mois"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  placeholder={
                    "Bonjour,\n\nÉcrivez ici le contenu de votre message…\n\nLaissez une ligne vide entre deux paragraphes."
                  }
                  className={`${inputCls} resize-y leading-relaxed`}
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Texte simple. Un lien de désinscription est ajouté
                  automatiquement en bas de chaque e-mail.
                </p>
              </div>
              <GoldButton
                onClick={handleSend}
                disabled={sending || activeCount === 0}
                className="w-full"
              >
                <Send size={14} />
                {sending
                  ? "Envoi en cours…"
                  : `Envoyer à ${activeCount} abonné${activeCount > 1 ? "s" : ""}`}
              </GoldButton>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
