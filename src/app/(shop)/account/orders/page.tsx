"use client";

import { useEffect, useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/lib/use-page-title";

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items: { name: string; quantity: number; image?: string }[];
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  returned: "Retournée",
};

export default function OrdersPage() {
  usePageTitle("Mes commandes");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?limit=50&scope=user")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
          Historique
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Mes <span className="italic text-[var(--brand-gold)]">commandes</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        <p className="font-serif italic text-[14px] text-gray-500 mt-7">
          {orders.length} commande{orders.length > 1 ? "s" : ""} au total
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[var(--brand-gold)]/15 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
            <Package size={18} strokeWidth={1.5} />
          </div>
          <p className="font-serif italic text-2xl text-gray-900 mb-2">
            Aucune commande pour le moment
          </p>
          <p className="text-[13px] text-gray-500 mb-7 max-w-xs mx-auto leading-relaxed">
            Vos commandes apparaîtront ici dès votre premier achat.
          </p>
          <Link
            href="/kits/decouverte"
            className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            Découvrir les kits
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[var(--brand-gold)]/15 divide-y divide-[var(--brand-gold)]/10">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/account/orders/${order._id}`}
              className="group block px-5 sm:px-7 py-6 hover:bg-[var(--brand-cream)]/50 transition"
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-serif text-[18px] text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
                      {statusLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="font-serif italic text-[12px] text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-[18px] text-gray-900">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-1">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} article
                    {order.items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-[12px] text-gray-500 truncate flex-1 font-serif italic">
                  {order.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
                </p>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)] flex items-center gap-2 shrink-0 group-hover:gap-3 transition-all">
                  Voir le détail <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
