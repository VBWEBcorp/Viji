"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;
  }

  if (!customer) {
    return <div className="text-gray-500">Client non trouvé</div>;
  }

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
      >
        <ArrowLeft size={16} /> Retour aux clients
      </Link>

      <h1 className="text-2xl font-bold mb-8">{customer.name}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-3">Informations</h2>
          <div className="text-sm space-y-2 text-gray-600">
            <p>{customer.email}</p>
            <p>{customer.phone || "Pas de téléphone"}</p>
            <p>Inscrit le {formatDate(customer.createdAt)}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">
              Commandes ({orders.length})
            </h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Aucune commande
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="p-4 flex justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(order.total)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
