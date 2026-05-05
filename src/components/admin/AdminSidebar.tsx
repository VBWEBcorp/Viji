"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Settings,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  PenSquare,
  Mail,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/customers", label: "Clients", icon: Users },
  { href: "/admin/reviews", label: "Avis", icon: Star },
  { href: "/admin/promos", label: "Codes promo", icon: Tag },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/content", label: "Contenu", icon: FileText },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  return (
    <aside
      className={cn(
        "relative bg-[#1a1a2e] text-white min-h-screen shrink-0 flex flex-col sticky top-0 self-start h-screen transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="px-3 py-4 border-b border-white/5 flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 min-w-0"
          title="Ma Boutique"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <Store size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-[14px] font-semibold tracking-tight truncate">
              Ma Boutique
            </span>
          )}
        </Link>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Deplier le menu" : "Replier le menu"}
          title={collapsed ? "Deplier" : "Replier"}
          className={cn(
            "p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition shrink-0",
            collapsed && "absolute -right-3 top-5 z-10 bg-[#1a1a2e] border border-white/10 shadow-lg"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                collapsed && "justify-center",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <ChevronRight size={14} className="text-white/30" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 space-y-1 border-t border-white/5 pt-3">
        <Link
          href="/"
          title={collapsed ? "Voir la boutique" : undefined}
          className={cn(
            "flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition",
            collapsed && "justify-center"
          )}
        >
          <Store size={18} strokeWidth={1.5} className="shrink-0" />
          {!collapsed && <span className="truncate">Voir la boutique</span>}
        </Link>

        {/* User */}
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-[11px] text-white/30 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Se deconnecter"
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-center px-2.5 py-2.5 mt-1"
              title={session?.user?.name || "Admin"}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Se deconnecter"
              className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
