"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Package, FileDown } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded" />
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
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
      >
        <ArrowLeft size={16} /> Retour aux commandes
      </Link>

      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Commande {order.orderNumber}
          </h1>
          <p className="text-gray-500 text-sm">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <a
          href={`/api/orders/${order._id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition px-4 py-2 rounded-lg"
        >
          <FileDown size={14} /> Telecharger la facture
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Détails commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center gap-2">
              <Package size={18} />
              <h2 className="font-semibold">Articles</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item, i) => (
                <div key={i} className="p-4 flex justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Qté: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Statuts */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Gestion</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut paiement
                </label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) =>
                    updateStatus("paymentStatus", e.target.value)
                  }
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="failed">Échoué</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut livraison
                </label>
                <select
                  value={order.fulfillmentStatus}
                  onChange={(e) =>
                    updateStatus("fulfillmentStatus", e.target.value)
                  }
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Truck size={18} className="text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium">
                    {order.tracking.carrier} · {order.tracking.trackingNumber}
                  </p>
                  {order.tracking.trackingUrl && (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Suivre le colis
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-3">Client</h2>
            <p className="text-sm font-medium">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
            {order.user?.phone && (
              <p className="text-sm text-gray-500">{order.user.phone}</p>
            )}
          </div>

          {/* Adresse */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-3">Adresse de livraison</h2>
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
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-3">Paiement</h2>
            <p className="text-sm text-gray-600 capitalize">
              {order.paymentMethod}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
