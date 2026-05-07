"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ShoppingCart, User, Menu, X, ChevronDown, ArrowRight, Mail, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/contexts/CartContext";

const LOGO_SRC = "https://i.ibb.co/5WWqVbC2/cropped-Entre-Maman-Et-Moi-1.png";

const KIT_LINKS = [
  { href: "/kits/decouverte", label: "Kit Découverte" },
  { href: "/kits/signature", label: "Kit Signature" },
  { href: "/kits/familiale", label: "Kit Familiale" },
];

const ATELIER_LINKS = [
  { href: "/ateliers/a-domicile", label: "Atelier à domicile" },
  { href: "/ateliers/collectif", label: "Atelier collectif" },
  { href: "/ateliers/chef-prive", label: "Chef privé à domicile" },
];

const TRAITEUR_LINKS = [
  { href: "/traiteur/emporter", label: "Traiteur à emporter" },
  { href: "/traiteur/evenementiel", label: "Traiteur événementiel" },
];

type DropdownKey = "kits" | "ateliers" | "traiteur" | null;

export default function Header() {
  const { data: session } = useSession();
  const { itemCount, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-[var(--brand-gold)]/20 shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-24">
          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[var(--brand-gold)] transition"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 flex items-center justify-center group"
            aria-label="Entre Maman et Moi"
          >
            <Image
              src={LOGO_SRC}
              alt="Entre Maman et Moi"
              width={240}
              height={96}
              priority
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            <NavLink href="/">Accueil</NavLink>

            <Dropdown
              label="Nos kits"
              links={KIT_LINKS}
              isOpen={openDropdown === "kits"}
              onOpen={() => setOpenDropdown("kits")}
              onClose={() => setOpenDropdown(null)}
            />

            <Dropdown
              label="Ateliers"
              links={ATELIER_LINKS}
              isOpen={openDropdown === "ateliers"}
              onOpen={() => setOpenDropdown("ateliers")}
              onClose={() => setOpenDropdown(null)}
            />

            <Dropdown
              label="Traiteur"
              links={TRAITEUR_LINKS}
              isOpen={openDropdown === "traiteur"}
              onOpen={() => setOpenDropdown("traiteur")}
              onClose={() => setOpenDropdown(null)}
            />

            <NavLink href="/contact">Contact</NavLink>

            <button
              onClick={toggleCart}
              className="px-4 py-2 text-[13px] font-medium uppercase tracking-wider text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] transition relative ml-2"
            >
              Panier
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-gold)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile right actions */}
          <div className="lg:hidden flex items-center gap-1">
            <Link
              href={session ? "/account" : "/login"}
              className="p-2 text-gray-600 hover:text-[var(--brand-gold)] transition"
              aria-label="Compte"
            >
              <User size={20} />
            </Link>
            <button
              onClick={toggleCart}
              className="p-2 text-gray-600 hover:text-[var(--brand-gold)] transition relative"
              aria-label="Panier"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--brand-gold)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop user/admin */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href={session ? "/account" : "/login"}
              className="p-2 text-gray-500 hover:text-[var(--brand-gold)] transition"
              aria-label="Compte"
            >
              <User size={18} />
            </Link>
            {session?.user.role === "admin" && (
              <Link
                href="/admin"
                className="ml-2 text-[12px] bg-[var(--brand-gold)] text-white px-3 py-1.5 rounded font-medium hover:bg-[var(--brand-gold-dark)] transition"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} session={session} />
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: ReturnType<typeof useSession>["data"];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 z-[70] h-full w-full max-w-md bg-white flex flex-col transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-[var(--brand-gold)]/15 flex items-start justify-between">
          <Link href="/" onClick={onClose} className="block">
            <Image
              src={LOGO_SRC}
              alt="Entre Maman et Moi"
              width={140}
              height={56}
              className="h-14 w-auto object-contain"
            />
            <p className="mt-2 text-[10px] uppercase tracking-[0.45em] text-gray-400">
              Navigation
            </p>
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-1 text-gray-400 hover:text-[var(--brand-gold)] transition"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 divide-y divide-[var(--brand-gold)]/10">
          <DrawerLink href="/" onClick={onClose}>
            Accueil
          </DrawerLink>

          <DrawerSection label="Nos kits" links={KIT_LINKS} onClose={onClose} />
          <DrawerSection label="Ateliers" links={ATELIER_LINKS} onClose={onClose} />
          <DrawerSection label="Traiteur" links={TRAITEUR_LINKS} onClose={onClose} />

          <DrawerLink href="/contact" onClick={onClose}>
            Contact
          </DrawerLink>
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--brand-gold)]/15 px-6 sm:px-8 py-6 space-y-5">
          <div className="flex items-end justify-between">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">
              {session ? "Connecté" : "Espace client"}
            </span>
            {session?.user?.email && (
              <span className="font-serif italic text-[13px] text-gray-500 truncate max-w-[55%]">
                {session.user.email}
              </span>
            )}
          </div>

          <Link
            href={session ? "/account" : "/login"}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            {session ? "Mon compte" : "Se connecter"}
            <ArrowRight size={13} />
          </Link>

          {session?.user.role === "admin" && (
            <Link
              href="/admin"
              onClick={onClose}
              className="w-full flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/30 pb-1 mx-auto hover:border-[var(--brand-gold)] transition"
            >
              Espace administration
            </Link>
          )}

          <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-gray-400">
            <a href="mailto:contact@entremamanetmoi.fr" className="flex items-center gap-1.5 hover:text-[var(--brand-gold)] transition">
              <Mail size={12} strokeWidth={1.5} />
              Écrire
            </a>
            <span className="w-px h-3 bg-gray-200" />
            <a href="tel:" className="flex items-center gap-1.5 hover:text-[var(--brand-gold)] transition">
              <Phone size={12} strokeWidth={1.5} />
              Appeler
            </a>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}

function DrawerLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between py-5 first:pt-0 last:pb-0"
    >
      <span className="font-serif text-[22px] text-gray-900 leading-tight group-hover:text-[var(--brand-gold)] transition">
        {children}
      </span>
      <ArrowRight
        size={16}
        className="text-[var(--brand-gold)]/40 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all duration-300"
      />
    </Link>
  );
}

function DrawerSection({
  label,
  links,
  onClose,
}: {
  label: string;
  links: { href: string; label: string }[];
  onClose: () => void;
}) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-gold)] mb-4">
        {label}
      </p>
      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="group flex items-center justify-between"
          >
            <span className="font-serif text-[18px] text-gray-800 group-hover:text-[var(--brand-gold)] transition">
              {link.label}
            </span>
            <ArrowRight
              size={13}
              className="text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1 transition-all duration-300"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-[13px] font-medium uppercase tracking-wider text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] transition"
    >
      {children}
    </Link>
  );
}

function Dropdown({
  label,
  links,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  links: { href: string; label: string }[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button className="px-4 py-2 text-[13px] font-medium uppercase tracking-wider text-[var(--brand-gold)] hover:text-[var(--brand-gold-dark)] transition flex items-center gap-1">
        {label}
        <ChevronDown size={13} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
          <div className="bg-white border border-[var(--brand-gold)]/20 rounded-lg shadow-lg py-2 min-w-[240px]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-5 py-2.5 text-[13px] uppercase tracking-wider text-gray-700 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)] transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

