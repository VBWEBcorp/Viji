"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";

interface Order {
  _id: string;
  orderNumber: string;
  user?: { name: string; email: string };
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
}

type Tone = "gold" | "green" | "amber" | "red" | "gray" | "blue";

const paymentMap: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "En attente", tone: "amber" },
  paid: { label: "Payé", tone: "green" },
  failed: { label: "Échoué", tone: "red" },
  refunded: { label: "Remboursé", tone: "gray" },
};

const fulfillmentMap: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "En attente", tone: "gray" },
  processing: { label: "Préparation", tone: "blue" },
  shipped: { label: "Expédié", tone: "gold" },
  delivered: { label: "Livré", tone: "green" },
  returned: { label: "Retourné", tone: "red" },
};

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; tone: Tone }> }) {
  const s = map[status] || { label: status, tone: "gray" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

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
      <PageHeader
        eyebrow="Activité"
        title="Commandes"
        subtitle={loading ? undefined : `${orders.length} commande${orders.length > 1 ? "s" : ""}`}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={18} strokeWidth={1.5} />}
            title="Aucune commande pour le moment"
            description="Les commandes apparaîtront ici dès le premier achat."
          />
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--brand-gold)]/15">
                    {["Commande", "Client", "Total", "Paiement", "Livraison", "Date", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${i === 6 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-gold)]/10">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-[var(--brand-cream)]/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-serif text-[15px] text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] text-gray-700">{order.user?.name || "·"}</p>
                        <p className="text-[11px] text-gray-400">{order.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 font-serif text-[15px] text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.paymentStatus} map={paymentMap} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.fulfillmentStatus} map={fulfillmentMap} />
                      </td>
                      <td className="px-5 py-4 text-[12px] text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="inline-flex p-2 text-[var(--brand-gold)]/40 hover:text-[var(--brand-gold)] transition"
                          aria-label="Voir la commande"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className="md:hidden divide-y divide-[var(--brand-gold)]/10">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-[var(--brand-cream)]/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-serif text-[15px] text-gray-900">
                        {order.orderNumber}
                      </span>
                      <span className="font-serif text-[15px] text-gray-900 ml-auto">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate mb-2">
                      {order.user?.name || order.user?.email || "Client"} · {formatDate(order.createdAt)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge status={order.paymentStatus} map={paymentMap} />
                      <StatusBadge status={order.fulfillmentStatus} map={fulfillmentMap} />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--brand-gold)]/40 shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
