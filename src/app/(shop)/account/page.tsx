"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, Heart, MapPin, Truck, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/lib/use-page-title";

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  tracking?: { trackingUrl?: string };
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface AccountStats {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
}

export default function AccountDashboard() {
  usePageTitle("Mon espace client");
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AccountStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=5&scope=user").then((r) => r.json()),
      fetch("/api/wishlist").then((r) => r.json()),
    ]).then(([orderData, wishlistData]) => {
      const orderList = orderData.orders || [];
      setOrders(orderList);

      const totalSpent = orderList
        .filter((o: Order) => o.paymentStatus === "paid")
        .reduce((sum: number, o: Order) => sum + o.total, 0);

      setStats({
        totalOrders: orderData.pagination?.total || orderList.length,
        totalSpent,
        wishlistCount: wishlistData.products?.length || 0,
      });
      setLoading(false);
    });
  }, []);

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    paid: "Payée",
    failed: "Échouée",
    refunded: "Remboursée",
    processing: "En préparation",
    shipped: "Expédiée",
    delivered: "Livrée",
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-[var(--brand-gold)]/10 animate-pulse" />
          <div className="h-10 w-64 bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 border border-[var(--brand-gold)]/15 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Client";
  const activeOrders = orders.filter((o) =>
    ["processing", "shipped"].includes(o.fulfillmentStatus)
  );

  return (
    <div>
      {/* Welcome */}
      <div className="mb-12 md:mb-16">
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
          Tableau de bord
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Bonjour,{" "}
          <span className="italic text-[var(--brand-gold)]">{firstName}</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        <p className="font-serif italic text-[15px] text-gray-600 mt-7 max-w-md">
          Retrouvez vos commandes, vos favoris et vos informations en un coup d&apos;œil.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        <StatCard
          href="/account/orders"
          icon={<Package size={16} strokeWidth={1.5} />}
          label="Commandes"
          value={String(stats.totalOrders)}
          hint={stats.totalOrders > 1 ? "passées" : "passée"}
        />
        <StatCard
          icon={<Wallet size={16} strokeWidth={1.5} />}
          label="Total dépensé"
          value={formatPrice(stats.totalSpent)}
          hint="depuis l'ouverture du compte"
        />
        <StatCard
          href="/account/wishlist"
          icon={<Heart size={16} strokeWidth={1.5} />}
          label="Favoris"
          value={String(stats.wishlistCount)}
          hint={stats.wishlistCount > 1 ? "produits enregistrés" : "produit enregistré"}
        />
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <section className="mb-14">
          <SectionHeader eyebrow="Suivi" title="En cours" />
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="group flex items-center gap-5 bg-white border border-[var(--brand-gold)]/15 px-5 py-5 hover:border-[var(--brand-gold)]/40 transition"
              >
                <div className="w-11 h-11 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
                  <Truck size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-serif text-[16px] text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
                      {statusLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate font-serif italic">
                    {order.items.map((i) => i.name).join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="font-serif text-[16px] text-gray-900">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[var(--brand-gold)]/40 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all shrink-0"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section>
        <SectionHeader
          eyebrow="Historique"
          title="Dernières commandes"
          right={
            stats.totalOrders > 5 ? (
              <Link
                href="/account/orders"
                className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
              >
                Tout voir
              </Link>
            ) : undefined
          }
        />

        {orders.length === 0 ? (
          <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
              <Package size={18} strokeWidth={1.5} />
            </div>
            <p className="font-serif italic text-2xl text-gray-900 mb-2">
              Pas encore de commande…
            </p>
            <p className="text-[13px] text-gray-500 mb-7 max-w-xs mx-auto leading-relaxed">
              Votre historique apparaîtra ici dès votre première commande.
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
                className="group flex items-center gap-4 px-5 sm:px-6 py-5 hover:bg-[var(--brand-cream)]/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-serif text-[16px] text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)]">
                      {statusLabels[order.paymentStatus] || order.paymentStatus}
                    </span>
                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
                      {statusLabels[order.fulfillmentStatus] || order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="font-serif italic text-[12px] text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <span className="font-serif text-[16px] text-gray-900 shrink-0">
                  {formatPrice(order.total)}
                </span>
                <ArrowRight
                  size={14}
                  className="text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="mt-14">
        <SectionHeader eyebrow="Raccourcis" title="Mon espace" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink
            href="/account/addresses"
            icon={<MapPin size={15} strokeWidth={1.5} />}
            label="Mes adresses"
            hint="Livraison & facturation"
          />
          <QuickLink
            href="/account/profile"
            icon={<Heart size={15} strokeWidth={1.5} />}
            label="Mes informations"
            hint="Nom, email, téléphone"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="w-10 h-10 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center">
          {icon}
        </div>
        {href && (
          <ArrowRight
            size={14}
            className="text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all"
          />
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-2">
        {label}
      </p>
      <p className="font-serif text-2xl text-gray-900 leading-none">{value}</p>
      <p className="font-serif italic text-[12px] text-gray-500 mt-2">{hint}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block bg-white border border-[var(--brand-gold)]/15 px-6 py-6 hover:border-[var(--brand-gold)]/40 transition"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-6">{inner}</div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
          {eyebrow}
        </p>
        <h2 className="font-serif text-2xl text-gray-900 leading-none">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-white border border-[var(--brand-gold)]/15 px-5 py-4 hover:border-[var(--brand-gold)]/40 transition"
    >
      <div className="w-10 h-10 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] uppercase tracking-[0.25em] font-medium text-gray-900">
          {label}
        </p>
        <p className="font-serif italic text-[12px] text-gray-500 mt-1">{hint}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
}
