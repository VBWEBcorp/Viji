"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  PenSquare,
  Mail,
  Megaphone,
  CalendarDays,
  CalendarCheck,
  Gift,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/ateliers", label: "Ateliers", icon: CalendarDays },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarCheck },
  { href: "/admin/customers", label: "Clients", icon: Users },
  { href: "/admin/reviews", label: "Avis", icon: Star },
  { href: "/admin/promos", label: "Codes promo", icon: Tag },
  { href: "/admin/gift-cards", label: "Cartes cadeaux", icon: Gift },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/content", label: "Contenu", icon: FileText },
];

const STORAGE_KEY = "admin-sidebar-collapsed";
const LOGO_SRC = "https://i.ibb.co/5WWqVbC2/cropped-Entre-Maman-Et-Moi-1.png";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  // Ferme le tiroir mobile au changement de page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Verrouille le scroll + ferme avec Échap quand le tiroir est ouvert
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || "A";

  function NavList({ isCollapsed }: { isCollapsed: boolean }) {
    return (
      <>
        {!isCollapsed && (
          <div className="px-4 pt-5 pb-2 text-[9px] uppercase tracking-[0.35em] text-gray-400">
            Administration
          </div>
        )}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-[12px] tracking-wide transition-all duration-150 group relative",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "text-[var(--brand-gold)] bg-[var(--brand-cream)]/60"
                    : "text-gray-600 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/40"
                )}
              >
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-px bg-[var(--brand-gold)]" />
                )}
                <item.icon
                  size={16}
                  strokeWidth={isActive ? 1.75 : 1.5}
                  className="shrink-0"
                />
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </>
    );
  }

  function BottomSection({ isCollapsed }: { isCollapsed: boolean }) {
    return (
      <div className="border-t border-[var(--brand-gold)]/15 px-3 py-3 space-y-1">
        <Link
          href="/"
          title={isCollapsed ? "Voir la boutique" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-[12px] text-gray-500 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/40 transition",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Store size={16} strokeWidth={1.5} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Voir la boutique</span>}
        </Link>

        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-3 py-3 mt-1 border-t border-[var(--brand-gold)]/10">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center text-[12px] font-medium shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-gray-900 truncate">
                {session?.user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Se déconnecter"
              className="p-1.5 text-gray-400 hover:text-[var(--brand-gold)] transition shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <>
            <div
              className="flex items-center justify-center px-2 py-2 mt-1"
              title={session?.user?.name || "Admin"}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center text-[12px] font-medium shrink-0">
                {userInitial}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Se déconnecter"
              className="w-full flex items-center justify-center px-2 py-2 text-gray-400 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/40 transition"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ───────── Barre supérieure mobile ───────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white/90 backdrop-blur-md border-b border-[var(--brand-gold)]/15 flex items-center justify-between px-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 text-gray-600 hover:text-[var(--brand-gold)] transition"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <Link href="/admin" aria-label="Entre Maman et Moi" className="flex items-center">
          <Image
            src={LOGO_SRC}
            alt="Entre Maman et Moi"
            width={240}
            height={96}
            priority
            className="h-8 object-contain"
            style={{ width: "auto" }}
          />
        </Link>
        <div className="w-9 h-9 rounded-full bg-[var(--brand-cream)] text-[var(--brand-gold)] flex items-center justify-center text-[12px] font-medium">
          {userInitial}
        </div>
      </header>

      {/* ───────── Voile + tiroir mobile ───────── */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-[270px] max-w-[82vw] bg-white border-r border-[var(--brand-gold)]/15 flex flex-col transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-5 border-b border-[var(--brand-gold)]/15 flex items-center justify-between gap-2">
          <Link href="/admin" aria-label="Entre Maman et Moi" className="flex items-center min-w-0">
            <Image
              src={LOGO_SRC}
              alt="Entre Maman et Moi"
              width={240}
              height={96}
              className="h-10 object-contain"
              style={{ width: "auto" }}
            />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
            className="p-1.5 text-gray-400 hover:text-[var(--brand-gold)] transition"
          >
            <X size={18} />
          </button>
        </div>
        <NavList isCollapsed={false} />
        <BottomSection isCollapsed={false} />
      </aside>

      {/* ───────── Menu latéral desktop ───────── */}
      <aside
        className={cn(
          "hidden lg:flex relative bg-white border-r border-[var(--brand-gold)]/15 min-h-screen shrink-0 flex-col sticky top-0 self-start h-screen transition-[width] duration-200 ease-out",
          collapsed ? "w-16" : "w-[240px]"
        )}
      >
        <div className="px-4 py-6 border-b border-[var(--brand-gold)]/15 flex items-center justify-between gap-2">
          <Link href="/admin" className="flex items-center min-w-0" title="Entre Maman et Moi">
            {collapsed ? (
              <span className="font-serif text-xl text-[var(--brand-gold)] tracking-[0.05em]">
                EM
              </span>
            ) : (
              <Image
                src={LOGO_SRC}
                alt="Entre Maman et Moi"
                width={240}
                height={96}
                priority
                className="h-11 object-contain"
                style={{ width: "auto" }}
              />
            )}
          </Link>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            title={collapsed ? "Déplier" : "Replier"}
            className={cn(
              "p-1.5 text-gray-400 hover:text-[var(--brand-gold)] transition shrink-0",
              collapsed &&
                "absolute -right-3 top-7 z-10 bg-white border border-[var(--brand-gold)]/20 shadow-sm w-6 h-6 flex items-center justify-center"
            )}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>
        <NavList isCollapsed={collapsed} />
        <BottomSection isCollapsed={collapsed} />
      </aside>
    </>
  );
}
