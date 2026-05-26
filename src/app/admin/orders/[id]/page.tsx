"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Package, FileDown } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card } from "@/components/admin/ui";

interface Order {
  _id: string;
  orderNumber: string;
  user?: { name: string; email: string; phone?: string };
  items: {
    product: { name: string; slug: string; images?: { url: string }[] };
    name: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  notes?: string;
  createdAt: string;
}

const selectCls =
  "w-full px-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300";

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setOrder(data);
        setLoading(false);
      });
  }, [id]);

  async function updateStatus(field: string, value: string) {
    setUpdating(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      toast.success("Statut mis à jour");
    } else {
      toast.error("Erreur");
    }
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 w-1/3" />
        <div className="h-64 bg-gray-100" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-gray-500">Commande non trouvée</div>;
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-[var(--brand-gold)] transition mb-6"
      >
        <ArrowLeft size={14} /> Retour aux commandes
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1]">
            Commande {order.orderNumber}
          </h1>
          <p className="text-[13px] text-gray-500 mt-2">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <a
          href={`/api/orders/${order._id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-[var(--brand-gold)]/25 text-gray-600 text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)]/50 transition shrink-0"
        >
          <FileDown size={14} /> Télécharger la facture
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <Card>
            <div className="p-5 sm:p-6 border-b border-[var(--brand-gold)]/10 flex items-center gap-2.5">
              <Package size={18} className="text-[var(--brand-gold)]" />
              <h2 className="font-serif text-lg text-gray-900">Articles</h2>
            </div>
            <div className="divide-y divide-[var(--brand-gold)]/10">
              {order.items.map((item, i) => (
                <div key={i} className="p-5 sm:p-6 flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qté : {item.quantity}
                    </p>
                  </div>
                  <p className="font-serif text-[15px] text-gray-900 shrink-0">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-5 sm:p-6 border-t border-[var(--brand-gold)]/10 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span className="text-gray-700">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Réduction</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span className="text-gray-700">{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-serif text-lg text-gray-900 pt-2.5 border-t border-[var(--brand-gold)]/10">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Statuts */}
          <Card className="p-5 sm:p-6 space-y-5">
            <h2 className="font-serif text-lg text-gray-900">Gestion</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Statut paiement
                </label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) =>
                    updateStatus("paymentStatus", e.target.value)
                  }
                  disabled={updating}
                  className={selectCls}
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Statut livraison
                </label>
                <select
                  value={order.fulfillmentStatus}
                  onChange={(e) =>
                    updateStatus("fulfillmentStatus", e.target.value)
                  }
                  disabled={updating}
                  className={selectCls}
                >
                  <option value="pending">En attente</option>
                  <option value="processing">En préparation</option>
                  <option value="shipped">Expédié</option>
                  <option value="delivered">Livré</option>
                  <option value="returned">Retourné</option>
                </select>
              </div>
            </div>

            {/* Tracking */}
            {order.tracking?.trackingNumber && (
              <div className="flex items-center gap-3 p-4 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/15">
                <Truck size={18} className="text-[var(--brand-gold)] shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="font-medium text-gray-900">
                    {order.tracking.carrier} · {order.tracking.trackingNumber}
                  </p>
                  {order.tracking.trackingUrl && (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] hover:underline transition"
                    >
                      Suivre le colis
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-lg text-gray-900 mb-3">Client</h2>
            <p className="text-sm font-medium text-gray-900">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
            {order.user?.phone && (
              <p className="text-sm text-gray-500">{order.user.phone}</p>
            )}
          </Card>

          {/* Adresse */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-lg text-gray-900 mb-3">Adresse de livraison</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.zip} {order.shippingAddress.city}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p>{order.shippingAddress.phone}</p>
              )}
            </div>
          </Card>

          {/* Paiement */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-lg text-gray-900 mb-3">Paiement</h2>
            <p className="text-sm text-gray-600 capitalize">
              {order.paymentMethod}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
