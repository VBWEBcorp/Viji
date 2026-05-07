"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  LogOut,
} from "lucide-react";

const menuItems = [
  { href: "/account", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Mes commandes", icon: Package },
  { href: "/account/wishlist", label: "Mes favoris", icon: Heart },
  { href: "/account/addresses", label: "Mes adresses", icon: MapPin },
  { href: "/account/profile", label: "Mes informations", icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Mobile nav */}
        <div className="lg:hidden mb-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
                Espace client
              </p>
              <h1 className="font-serif text-2xl text-gray-900 leading-tight">
                {session?.user?.name || "Mon compte"}
              </h1>
              <p className="text-[12px] text-gray-400 mt-1 truncate max-w-[80vw]">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Déconnexion
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {menuItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-[var(--brand-gold)] text-white"
                      : "bg-white border border-[var(--brand-gold)]/20 text-gray-600 hover:border-[var(--brand-gold)]/40 hover:text-[var(--brand-gold)]"
                  }`}
                >
                  <item.icon size={13} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28">
              {/* User block */}
              <div className="text-center pb-8 border-b border-[var(--brand-gold)]/15">
                <div className="w-16 h-16 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-4 font-serif text-2xl">
                  {initial}
                </div>
                <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-2">
                  Espace client
                </p>
                <p className="font-serif text-xl text-gray-900 leading-tight truncate">
                  {session?.user?.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-1 truncate font-serif italic">
                  {session?.user?.email}
                </p>
              </div>

              {/* Navigation */}
              <nav className="py-6 space-y-px">
                {menuItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 pl-4 pr-3 py-3 transition ${
                        isActive
                          ? "text-[var(--brand-gold)]"
                          : "text-gray-600 hover:text-[var(--brand-gold)]"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-px bg-[var(--brand-gold)]" />
                      )}
                      <item.icon size={15} strokeWidth={1.5} />
                      <span className="text-[13px] uppercase tracking-[0.2em] font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="pt-6 border-t border-[var(--brand-gold)]/15">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3 pl-4 pr-3 py-3 text-[13px] uppercase tracking-[0.2em] font-medium text-gray-400 hover:text-[var(--brand-gold)] transition w-full"
                >
                  <LogOut size={15} strokeWidth={1.5} />
                  Déconnexion
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
