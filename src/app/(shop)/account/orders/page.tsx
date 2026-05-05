"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items: { name: string; quantity: number; image?: string }[];
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paye", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Remboursé", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  processing: { label: "En preparation", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { label: "Expédié", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Livre", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  returned: { label: "Retourne", cls: "bg-red-50 text-red-500 border-red-200" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes commandes</h1>
      <p className="text-sm text-gray-500 mb-6">
        {orders.length} commande{orders.length > 1 ? "s" : ""}
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucune commande</h2>
          <p className="text-sm text-gray-500 mb-6">
            Vos commandes apparaitront ici une fois que vous aurez passe votre premiere commande.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Découvrir nos produits <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/account/orders/${order._id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-gray-900">{order.orderNumber}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${statusLabels[order.fulfillmentStatus]?.cls || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {statusLabels[order.fulfillmentStatus]?.label || order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-gray-900">{formatPrice(order.total)}</p>
                  <p className="text-[11px] text-gray-400">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} article{order.items.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12px] text-gray-500 truncate flex-1">
                  {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                </p>
                <span className="text-[12px] text-gray-400 group-hover:text-gray-600 flex items-center gap-1 ml-3 shrink-0 transition">
                  Voir le detail <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
