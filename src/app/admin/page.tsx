"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, Users, TrendingUp, ArrowRight, Wallet } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  orderCount: number;
  previousOrderCount: number;
  newCustomers: number;
  previousNewCustomers: number;
  aov: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    fulfillmentStatus: string;
    createdAt: string;
    user?: { name: string };
  }[];
  chartData: { date: string; revenue: number; orders: number }[];
  topProducts: { _id: string; revenue: number; quantity: number }[];
  ordersByStatus: Record<string, number>;
}

const periods = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
];

const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/dashboard?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-[var(--brand-gold)]/10 animate-pulse" />
          <div className="h-10 w-64 bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[var(--brand-gold)]/15 h-[140px] animate-pulse"
            />
          ))}
        </div>
        <div className="bg-white border border-[var(--brand-gold)]/15 h-[350px] animate-pulse" />
      </div>
    );
  }

  const cards = [
    {
      label: "Chiffre d'affaires",
      value: formatPrice(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: <TrendingUp size={16} strokeWidth={1.5} />,
    },
    {
      label: "Commandes",
      value: String(stats?.orderCount || 0),
      change: stats?.previousOrderCount
        ? Math.round(
            ((stats.orderCount - stats.previousOrderCount) / stats.previousOrderCount) * 100
          )
        : 0,
      icon: <ShoppingCart size={16} strokeWidth={1.5} />,
    },
    {
      label: "Panier moyen",
      value: formatPrice(stats?.aov || 0),
      icon: <Wallet size={16} strokeWidth={1.5} />,
    },
    {
      label: "Nouveaux clients",
      value: String(stats?.newCustomers || 0),
      change: stats?.previousNewCustomers
        ? Math.round(
            ((stats.newCustomers - stats.previousNewCustomers) / stats.previousNewCustomers) * 100
          )
        : 0,
      icon: <Users size={16} strokeWidth={1.5} />,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-3">
            Administration
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
            Tableau de <span className="italic text-[var(--brand-gold)]">bord</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-white border border-[var(--brand-gold)]/15 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] transition ${
                  period === p.value
                    ? "bg-[var(--brand-gold)] text-white"
                    : "text-gray-500 hover:text-[var(--brand-gold)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-5 py-3 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            Ajouter un produit
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[var(--brand-gold)]/15 px-6 py-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center">
                {card.icon}
              </div>
              {"change" in card && card.change !== undefined && card.change !== 0 && (
                <span
                  className={`text-[10px] uppercase tracking-[0.25em] ${
                    card.change > 0 ? "text-[var(--brand-gold)]" : "text-gray-400"
                  }`}
                >
                  {card.change > 0 ? "+" : ""}
                  {card.change}%
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-2">
              {card.label}
            </p>
            <p className="font-serif text-3xl text-gray-900 leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-white border border-[var(--brand-gold)]/15 px-6 py-7">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
              Section
            </p>
            <h2 className="font-serif text-2xl text-gray-900">Chiffre d&apos;affaires</h2>
          </div>
          <div className="h-[280px]">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b8923c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#b8923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${(v / 100).toFixed(0)} €`}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid rgba(184, 146, 60, 0.25)",
                      borderRadius: "0",
                      fontSize: "13px",
                      fontFamily: "var(--font-serif)",
                    }}
                    formatter={(value) => [formatPrice(value as number), "CA"]}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#b8923c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-serif italic text-gray-400 text-sm">
                Pas de donnée pour cette période
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-7">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
              Classement
            </p>
            <h2 className="font-serif text-2xl text-gray-900">Top produits</h2>
          </div>
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="divide-y divide-[var(--brand-gold)]/10">
              {stats.topProducts.map((product, i) => (
                <div key={product._id} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="font-serif italic text-[var(--brand-gold)]/60 text-lg w-6 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[14px] text-gray-900 truncate leading-tight">
                      {product._id}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 mt-1">
                      {product.quantity} vendus
                    </p>
                  </div>
                  <span className="font-serif text-[14px] text-gray-900 shrink-0">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-serif italic text-sm text-gray-400 text-center py-8">
              Aucune vente
            </p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-[var(--brand-gold)]/15">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--brand-gold)]/15">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-1">
              Activité
            </p>
            <h2 className="font-serif text-xl text-gray-900">Commandes récentes</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
          >
            Tout voir
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="divide-y divide-[var(--brand-gold)]/10">
            {stats.recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="group flex items-center gap-4 px-6 py-4 hover:bg-[var(--brand-cream)]/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-serif text-[16px] text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
                      {statusLabels[order.paymentStatus] || order.paymentStatus}
                    </span>
                  </div>
                  <p className="font-serif italic text-[12px] text-gray-500">
                    {order.user?.name && <span>{order.user.name} · </span>}
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className="font-serif text-[16px] text-gray-900 shrink-0">
                  {formatPrice(order.total)}
                </span>
                <ArrowRight
                  size={14}
                  className="text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all shrink-0"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
              <ShoppingCart size={18} strokeWidth={1.5} />
            </div>
            <p className="font-serif italic text-2xl text-gray-900 mb-2">
              Aucune commande pour le moment
            </p>
            <p className="text-[13px] text-gray-500">
              Les commandes apparaîtront ici dès le premier achat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
