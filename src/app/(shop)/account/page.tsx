"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Heart, MapPin, Truck, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  tracking?: { trackingUrl?: string };
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface AccountStats {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  addressCount: number;
}

export default function AccountDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AccountStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    addressCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=5").then((r) => r.json()),
      fetch("/api/wishlist").then((r) => r.json()),
    ]).then(([orderData, wishlistData]) => {
      const orderList = orderData.orders || [];
      setOrders(orderList);

      const totalSpent = orderList
        .filter((o: Order) => o.paymentStatus === "paid")
        .reduce((sum: number, o: Order) => sum + o.total, 0);

      setStats({
        totalOrders: orderData.pagination?.total || orderList.length,
        totalSpent,
        wishlistCount: wishlistData.products?.length || 0,
        addressCount: 0,
      });
      setLoading(false);
    });
  }, []);

  const statusLabels: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    paid: { label: "Paye", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    failed: { label: "Échoué", cls: "bg-red-50 text-red-700 border-red-200" },
    refunded: { label: "Remboursé", cls: "bg-gray-50 text-gray-600 border-gray-200" },
    processing: { label: "En preparation", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    shipped: { label: "Expédié", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    delivered: { label: "Livre", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Client";

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos commandes, adresses et informations personnelles
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Link
          href="/account/orders"
          className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package size={16} className="text-blue-600" />
            </div>
            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-[12px] text-gray-500">Commande{stats.totalOrders > 1 ? "s" : ""}</p>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <ShoppingCart size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatPrice(stats.totalSpent)}</p>
          <p className="text-[12px] text-gray-500">Total dépensé</p>
        </div>

        <Link
          href="/account/wishlist"
          className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
              <Heart size={16} className="text-pink-600" />
            </div>
            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.wishlistCount}</p>
          <p className="text-[12px] text-gray-500">Favori{stats.wishlistCount > 1 ? "s" : ""}</p>
        </Link>

        <Link
          href="/account/addresses"
          className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <MapPin size={16} className="text-violet-600" />
            </div>
            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition" />
          </div>
          <p className="text-xl font-bold text-gray-900">Adresses</p>
          <p className="text-[12px] text-gray-500">Livraison & facturation</p>
        </Link>
      </div>

      {/* Active orders (shipped, processing) */}
      {orders.some((o) => ["processing", "shipped"].includes(o.fulfillmentStatus)) && (
        <div className="mb-8">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Commandes en cours</h2>
          <div className="space-y-3">
            {orders
              .filter((o) => ["processing", "shipped"].includes(o.fulfillmentStatus))
              .map((order) => (
                <Link
                  key={order._id}
                  href={`/account/orders/${order._id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusLabels[order.fulfillmentStatus]?.cls || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {statusLabels[order.fulfillmentStatus]?.label || order.fulfillmentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.map((i) => i.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-gray-900">Dernières commandes</h2>
          {stats.totalOrders > 5 && (
            <Link
              href="/account/orders"
              className="text-[13px] text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 mb-1">Aucune commande</p>
            <p className="text-xs text-gray-400 mb-4">Votre historique apparaitra ici</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Découvrir nos produits <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/account/orders/${order._id}`}
                  className="flex items-center px-5 py-4 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-gray-900">{order.orderNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusLabels[order.paymentStatus]?.cls || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {statusLabels[order.paymentStatus]?.label || order.paymentStatus}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusLabels[order.fulfillmentStatus]?.cls || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {statusLabels[order.fulfillmentStatus]?.label || order.fulfillmentStatus}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-700 shrink-0">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
