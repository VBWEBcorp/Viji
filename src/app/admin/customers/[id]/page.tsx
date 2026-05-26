"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/admin/ui";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: { street: string; city: string; zip: string; country: string }[];
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`).then((r) => r.json()),
      fetch(`/api/orders?userId=${id}`).then((r) => r.json()),
    ]).then(([cust, orderData]) => {
      if (!cust.error) setCustomer(cust);
      setOrders(orderData.orders || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100" />;
  }

  if (!customer) {
    return <div className="text-gray-500">Client non trouvé</div>;
  }

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-[var(--brand-gold)] transition mb-6"
      >
        <ArrowLeft size={14} /> Retour aux clients
      </Link>

      <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1] mb-8">{customer.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-serif text-lg text-gray-900 mb-3">Informations</h2>
          <div className="text-sm space-y-2 text-gray-600">
            <p>{customer.email}</p>
            <p>{customer.phone || "Pas de téléphone"}</p>
            <p>Inscrit le {formatDate(customer.createdAt)}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-5 sm:p-6 border-b border-[var(--brand-gold)]/10">
            <h2 className="font-serif text-lg text-gray-900">
              Commandes ({orders.length})
            </h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Aucune commande
            </div>
          ) : (
            <div className="divide-y divide-[var(--brand-gold)]/10">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="px-5 sm:px-6 py-4 flex justify-between gap-4 hover:bg-[var(--brand-cream)]/40 transition"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-[15px] text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="font-serif text-[15px] text-gray-900 shrink-0">
                    {formatPrice(order.total)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
