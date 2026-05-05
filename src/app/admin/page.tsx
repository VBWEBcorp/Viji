"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
} from "lucide-react";
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
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-[120px] animate-pulse border border-gray-100" />
          ))}
        </div>
        <div className="mt-6 bg-white rounded-2xl h-[350px] animate-pulse border border-gray-100" />
      </div>
    );
  }

  const cards = [
    {
      label: "Chiffre d'affaires",
      value: formatPrice(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Commandes",
      value: stats?.orderCount || 0,
      change: stats?.previousOrderCount
        ? Math.round(((stats.orderCount - stats.previousOrderCount) / stats.previousOrderCount) * 100)
        : 0,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Panier moyen",
      value: formatPrice(stats?.aov || 0),
      icon: Package,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Nouveaux clients",
      value: stats?.newCustomers || 0,
      change: stats?.previousNewCustomers
        ? Math.round(((stats.newCustomers - stats.previousNewCustomers) / stats.previousNewCustomers) * 100)
        : 0,
      icon: Users,
      gradient: "from-orange-500 to-amber-600",
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      paid: { label: "Payee", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      failed: { label: "Echouee", cls: "bg-red-50 text-red-700 border-red-200" },
      processing: { label: "Preparation", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      shipped: { label: "Expediee", cls: "bg-purple-50 text-purple-700 border-purple-200" },
      delivered: { label: "Livree", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    };
    const s = map[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue d&apos;ensemble de votre boutique</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  period === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Ajouter un produit <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-gray-400 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {"change" in card && card.change !== undefined && card.change !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 text-[12px] font-medium ${
                    card.change > 0 ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {card.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(card.change)}% vs periode prec.
                  </div>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Chiffre d&apos;affaires</h2>
          <div className="h-[280px]">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
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
                    tickFormatter={(v) => `${(v / 100).toFixed(0)}€`}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "13px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [formatPrice(value as number), "CA"]}
                    labelFormatter={(label) => {
                      const d = new Date(label);
                      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#111827"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                Pas de donnees pour cette periode
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Top produits</h2>
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product, i) => (
                <div key={product._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{product._id}</p>
                    <p className="text-[11px] text-gray-400">{product.quantity} vendus</p>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune vente</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
          <h2 className="text-[15px] font-semibold text-gray-900">Commandes recentes</h2>
          <Link
            href="/admin/orders"
            className="text-[13px] text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="flex items-center px-6 py-3.5 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">
                      {order.orderNumber}
                    </span>
                    {statusBadge(order.paymentStatus)}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {order.user?.name && <span>{order.user.name} — </span>}
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-700">
                  {formatPrice(order.total)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <ShoppingCart size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucune commande pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
