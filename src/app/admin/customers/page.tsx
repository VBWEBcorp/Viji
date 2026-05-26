"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Users, ChevronRight } from "lucide-react";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center text-[13px] font-medium shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Répertoire"
        title="Clients"
        subtitle={loading ? undefined : `${customers.length} client${customers.length > 1 ? "s" : ""}`}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users size={18} strokeWidth={1.5} />}
            title="Aucun client inscrit"
            description="Vos clients apparaîtront ici après leur première inscription."
          />
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--brand-gold)]/15">
                    {["Client", "Email", "Téléphone", "Inscrit le", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] ${i === 4 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--brand-gold)]/10">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-[var(--brand-cream)]/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.name} />
                          <span className="text-[13px] font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-gray-500">{customer.email}</td>
                      <td className="px-5 py-4 text-[13px] text-gray-400">{customer.phone || "·"}</td>
                      <td className="px-5 py-4 text-[12px] text-gray-400">{formatDate(customer.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/customers/${customer._id}`}
                          className="inline-flex p-2 text-[var(--brand-gold)]/40 hover:text-[var(--brand-gold)] transition"
                          aria-label="Voir le client"
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
              {customers.map((customer) => (
                <Link
                  key={customer._id}
                  href={`/admin/customers/${customer._id}`}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-[var(--brand-cream)]/40 transition"
                >
                  <Avatar name={customer.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-900 truncate">{customer.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{customer.email}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {customer.phone ? `${customer.phone} · ` : ""}Inscrit le {formatDate(customer.createdAt)}
                    </p>
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
