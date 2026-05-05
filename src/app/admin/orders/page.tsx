"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { Eye, ShoppingCart } from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  user?: { name: string; email: string };
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

const badge = (status: string, map: Record<string, { label: string; cls: string }>) => {
  const s = map[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
};

const paymentMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paye", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Remboursé", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

const fulfillmentMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  processing: { label: "Preparation", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped: { label: "Expédié", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered: { label: "Livre", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  returned: { label: "Retourne", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function AdminOrdersPage() {
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Commandes</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Commande</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Paiement</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Livraison</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] text-gray-700">{order.user?.name || "—"}</p>
                    <p className="text-[11px] text-gray-400">{order.user?.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-3.5">{badge(order.paymentStatus, paymentMap)}</td>
                  <td className="px-5 py-3.5">{badge(order.fulfillmentStatus, fulfillmentMap)}</td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition inline-block"
                    >
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
