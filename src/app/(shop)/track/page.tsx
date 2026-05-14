"use client";

import { useState } from "react";
import { Search, Package, Truck, Check, Clock } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { usePageTitle } from "@/lib/use-page-title";

interface OrderInfo {
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  items: { name: string; quantity: number }[];
  tracking?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  createdAt: string;
}

const statusSteps = [
  { key: "pending", label: "Commande recue", icon: Clock },
  { key: "processing", label: "En preparation", icon: Package },
  { key: "shipped", label: "Expediee", icon: Truck },
  { key: "delivered", label: "Livree", icon: Check },
];

export default function TrackPage() {
  usePageTitle("Suivi de commande");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError("Commande non trouvee. Verifiez le numero et l'email.");
        setOrder(null);
      }
    } catch {
      setError("Erreur serveur");
    }
    setLoading(false);
  }

  const currentStepIndex = order
    ? statusSteps.findIndex((s) => s.key === order.fulfillmentStatus)
    : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Suivre ma commande</h1>
      <p className="text-gray-500 text-center mb-8">
        Entrez votre numero de commande et votre email pour suivre votre colis.
      </p>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numero de commande
          </label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            placeholder="CMD-2504-1234"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="votre@email.com"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Search size={18} />
          {loading ? "Recherche..." : "Suivre ma commande"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-8">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <span className="text-lg font-bold">{formatPrice(order.total)}</span>
          </div>

          {/* Progress steps */}
          <div className="flex items-center mb-8">
            {statusSteps.map((step, i) => (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      i <= currentStepIndex
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <step.icon size={18} />
                  </div>
                  <span className="text-[11px] text-gray-500 mt-2 text-center">{step.label}</span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 -mt-6 ${
                      i < currentStepIndex ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Tracking */}
          {order.tracking?.trackingNumber && (
            <div className="p-4 bg-blue-50 rounded-xl mb-6">
              <p className="text-sm font-medium">
                {order.tracking.carrier} · {order.tracking.trackingNumber}
              </p>
              {order.tracking.trackingUrl && (
                <a
                  href={order.tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                  Suivre sur le site du transporteur
                </a>
              )}
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Articles</h3>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{item.name} x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
