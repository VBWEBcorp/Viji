"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Package, Truck, Clock, Check, MapPin, FileDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePageTitle } from "@/lib/use-page-title";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  items: {
    product: { name: string; slug: string; images?: { url: string }[] };
    name: string;
    image?: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: { name: string; street: string; city: string; zip: string; country: string; phone?: string };
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  tracking?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  createdAt: string;
}

const statusSteps = [
  { key: "pending", label: "Commande recue", icon: Clock },
  { key: "processing", label: "En preparation", icon: Package },
  { key: "shipped", label: "Expediee", icon: Truck },
  { key: "delivered", label: "Livree", icon: Check },
];

export default function OrderDetailPage() {
  usePageTitle("Détail de commande");
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}?scope=user`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setOrder(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Commande non trouvee</p>
        <Link href="/account/orders" className="text-sm text-gray-900 font-medium hover:underline mt-2 inline-block">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.fulfillmentStatus);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4 transition"
      >
        <ArrowLeft size={16} /> Mes commandes
      </Link>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Passee le {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          {order.paymentStatus === "paid" && (
            <a
              href={`/api/orders/${order._id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition px-4 py-2 rounded-lg"
            >
              <FileDown size={14} /> Facture
            </a>
          )}
          <span className="text-xl font-bold">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Progress tracker */}
      {order.paymentStatus === "paid" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      i <= currentStepIndex
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <step.icon size={18} />
                  </div>
                  <span className={`text-[11px] mt-2 text-center font-medium ${
                    i <= currentStepIndex ? "text-gray-900" : "text-gray-400"
                  }`}>{step.label}</span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-full -mt-6 ${
                      i < currentStepIndex ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking info */}
      {order.tracking?.trackingNumber && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">
              {order.tracking.carrier} · {order.tracking.trackingNumber}
            </p>
            {order.tracking.trackingUrl && (
              <a
                href={order.tracking.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Suivre mon colis
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Articles ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">Qte : {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Reduction</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span>{order.shippingCost === 0 ? <span className="text-emerald-600">Gratuit</span> : formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={14} /> Adresse de livraison
            </h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.zip} {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="text-gray-400">{order.shippingAddress.phone}</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-2">Paiement</h3>
            <p className="text-sm text-gray-600 capitalize">{order.paymentMethod}</p>
          </div>

          {/* Help */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-1">Besoin d&apos;aide ?</h3>
            <p className="text-[12px] text-gray-500 mb-3">
              Un probleme avec votre commande ? Contactez-nous.
            </p>
            <Link
              href={`/track`}
              className="text-[13px] text-gray-700 font-medium hover:underline"
            >
              Suivre ma commande
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
