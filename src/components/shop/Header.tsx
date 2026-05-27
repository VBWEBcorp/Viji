"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/contexts/CartContext";

const LOGO_SRC = "https://i.ibb.co/5WWqVbC2/cropped-Entre-Maman-Et-Moi-1.png";

const KIT_LINKS = [
  { href: "/kits/decouverte", label: "Kit Découverte", tagline: "L'initiation" },
  { href: "/kits/signature", label: "Kit Signature", tagline: "Le plat complet" },
  { href: "/kits/familiale", label: "Kit Familiale", tagline: "Le festin partagé" },
];

const ATELIER_LINKS = [
  { href: "/ateliers/a-domicile", label: "À domicile", tagline: "Entre proches" },
  { href: "/ateliers/collectif", label: "Atelier collectif", tagline: "Rencontre" },
  { href: "/ateliers/chef-prive", label: "Cheffe privée", tagline: "Sur mesure" },
];

const TRAITEUR_LINKS = [
  { href: "/traiteur/emporter", label: "À emporter", tagline: "Click & Collect" },
  { href: "/traiteur/evenementiel", label: "Événementiel", tagline: "Sur devis" },
];

type DropdownKey = "kits" | "ateliers" | "traiteur" | null;

export default function Header() {
  const { data: session } = useSession();
  const { itemCount, toggleCart } = useCart();
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    let last = window.scrollY > 20;
    setScrolled(last);

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > 20;
        if (next !== last) {
          last = next;
          setScrolled(next);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,border-color,box-shadow] duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-[var(--brand-gold)]/20 shadow-[0_8px_24px_-12px_rgba(60,40,15,0.10)]"
          : "bg-white border-b border-transparent"
      }`}
    >
      {/* Filet gold premium */}
      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[var(--brand-gold)]/40 to-transparent" />

      {/* Ribbon utilitaire — tagline / contact */}
      <div className="hidden lg:block bg-[var(--brand-cream)]/60 border-b border-[var(--brand-gold)]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-8 text-[10px] uppercase tracking-[0.3em] text-gray-500">
          <p className="flex items-center gap-2">
            <MapPin size={11} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
            Vern-sur-Seiche · Rennes
          </p>
          <p className="font-serif italic normal-case tracking-normal text-[12px] text-[var(--brand-gold)]/90">
            Née dans la cuisine de ma mère
          </p>
          <a
            href="tel:0767360926"
            className="flex items-center gap-2 hover:text-[var(--brand-gold)] transition"
          >
            <Phone size={11} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
            07 67 36 09 26
          </a>
        </div>
      </div>

      {/* Barre principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 lg:h-22">
          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-[var(--brand-gold)] transition"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo (centré mobile, à gauche desktop) */}
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
              className="h-14 sm:h-16 lg:h-[68px] object-contain transition-opacity group-hover:opacity-90"
              style={{ width: "auto" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            <NavLink href="/" active={pathname === "/"}>
              Accueil
            </NavLink>

            <Dropdown
              label="Nos kits"
              links={KIT_LINKS}
              groupHref="/kits/decouverte"
              isOpen={openDropdown === "kits"}
              onOpen={() => setOpenDropdown("kits")}
              onClose={() => setOpenDropdown(null)}
              pathname={pathname}
            />

            <Dropdown
              label="Ateliers"
              links={ATELIER_LINKS}
              groupHref="/ateliers/a-domicile"
              isOpen={openDropdown === "ateliers"}
              onOpen={() => setOpenDropdown("ateliers")}
              onClose={() => setOpenDropdown(null)}
              pathname={pathname}
            />

            <Dropdown
              label="Traiteur"
              links={TRAITEUR_LINKS}
              groupHref="/traiteur/emporter"
              isOpen={openDropdown === "traiteur"}
              onOpen={() => setOpenDropdown("traiteur")}
              onClose={() => setOpenDropdown(null)}
              pathname={pathname}
            />

            <NavLink href="/cartes-cadeaux" active={pathname === "/cartes-cadeaux"}>
              Carte cadeau
            </NavLink>

            <NavLink href="/contact" active={pathname === "/contact"}>
              Contact
            </NavLink>
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Compte (desktop + mobile) */}
            <Link
              href={session ? "/account" : "/login"}
              className="group relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[var(--brand-gold)] transition"
              aria-label={session ? "Mon compte" : "Se connecter"}
            >
              <User size={18} strokeWidth={1.5} />
              {session && (
                <span
                  aria-hidden
                  className="absolute bottom-1.5 right-1.5 block w-1.5 h-1.5 rounded-full bg-[var(--brand-gold)]"
                />
              )}
            </Link>

            {/* Panier */}
            <button
              onClick={toggleCart}
              className="group relative w-10 h-10 flex items-center justify-center text-gray-700 hover:text-[var(--brand-gold)] transition"
              aria-label="Panier"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--brand-gold)] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>

            {/* Admin badge (desktop only) */}
            {session?.user.role === "admin" && (
              <Link
                href="/admin"
                className="hidden lg:inline-flex ml-2 text-[10px] uppercase tracking-[0.25em] bg-[var(--brand-gold)] text-white px-3 py-2 font-medium hover:bg-[var(--brand-gold-dark)] transition"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        session={session}
        pathname={pathname}
      />
    </header>
  );
}

/* ───────── Nav primitives ───────── */

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative group px-4 py-2 text-[12px] font-medium uppercase tracking-[0.22em] transition-colors ${
        active
          ? "text-[var(--brand-gold-dark)]"
          : "text-gray-700 hover:text-[var(--brand-gold-dark)]"
      }`}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className={`absolute left-4 right-4 -bottom-0.5 h-px bg-[var(--brand-gold)] origin-center transition-transform duration-300 ease-out ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

function Dropdown({
  label,
  links,
  groupHref,
  isOpen,
  onOpen,
  onClose,
  pathname,
}: {
  label: string;
  links: { href: string; label: string; tagline: string }[];
  groupHref: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  pathname: string;
}) {
  const active = links.some((l) => pathname.startsWith(l.href.split("/").slice(0, 2).join("/")));

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <Link
        href={groupHref}
        className={`relative group px-4 py-2 text-[12px] font-medium uppercase tracking-[0.22em] flex items-center gap-1.5 transition-colors ${
          active
            ? "text-[var(--brand-gold-dark)]"
            : "text-gray-700 hover:text-[var(--brand-gold-dark)]"
        }`}
        onClick={onClose}
      >
        <span>{label}</span>
        <ChevronDown
          size={11}
          strokeWidth={2}
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180 text-[var(--brand-gold)]" : ""
          }`}
        />
        <span
          aria-hidden
          className={`absolute left-4 right-7 -bottom-0.5 h-px bg-[var(--brand-gold)] origin-center transition-transform duration-300 ease-out ${
            active || isOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </Link>

      {/* Pont invisible (évite la fermeture entre le bouton et le panneau) */}
      <div
        className={`absolute top-full left-0 right-0 h-3 ${isOpen ? "block" : "hidden"}`}
      />

      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div
          className="relative bg-white border-x border-b border-[var(--brand-gold)]/25 min-w-[280px] py-2"
          style={{ boxShadow: "0 24px 48px -20px rgba(60,40,15,0.20)" }}
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center justify-between px-5 py-3 group/item border-l-2 transition-all ${
                  isActive
                    ? "bg-[var(--brand-cream)]/60 border-[var(--brand-gold)]"
                    : "border-transparent hover:bg-[var(--brand-cream)]/40 hover:border-[var(--brand-gold)]/40"
                }`}
              >
                <span
                  className={`block font-serif text-[15px] leading-tight transition-colors ${
                    isActive ? "text-[var(--brand-gold-dark)]" : "text-gray-900 group-hover/item:text-[var(--brand-gold-dark)]"
                  }`}
                >
                  {link.label}
                </span>
                <ArrowRight
                  size={12}
                  strokeWidth={1.5}
                  className="text-[var(--brand-gold)]/40 group-hover/item:text-[var(--brand-gold)] group-hover/item:translate-x-1 transition-all"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── Mobile drawer ───────── */

function MobileDrawer({
  open,
  onClose,
  session,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  session: ReturnType<typeof useSession>["data"];
  pathname: string;
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
        {/* Filet gold top */}
        <div
          aria-hidden
          className="h-px bg-gradient-to-r from-transparent via-[var(--brand-gold)]/50 to-transparent"
        />

        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[var(--brand-gold)]/15 flex items-start justify-between">
          <Link href="/" onClick={onClose} className="block">
            <Image
              src={LOGO_SRC}
              alt="Entre Maman et Moi"
              width={140}
              height={56}
              className="h-14 object-contain"
              style={{ width: "auto" }}
            />
            <p className="mt-2 text-[10px] uppercase tracking-[0.45em] text-gray-400">
              Cuisine indienne · Rennes
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
          <DrawerLink href="/" active={pathname === "/"} onClick={onClose}>
            Accueil
          </DrawerLink>

          <DrawerSection
            label="Nos kits"
            links={KIT_LINKS}
            onClose={onClose}
            pathname={pathname}
          />
          <DrawerSection
            label="Ateliers"
            links={ATELIER_LINKS}
            onClose={onClose}
            pathname={pathname}
          />
          <DrawerSection
            label="Traiteur"
            links={TRAITEUR_LINKS}
            onClose={onClose}
            pathname={pathname}
          />

          <DrawerLink
            href="/cartes-cadeaux"
            active={pathname === "/cartes-cadeaux"}
            onClick={onClose}
          >
            Carte cadeau
          </DrawerLink>

          <DrawerLink
            href="/contact"
            active={pathname === "/contact"}
            onClick={onClose}
          >
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
            <a
              href="mailto:entremamanetmoicook@gmail.com"
              className="flex items-center gap-1.5 hover:text-[var(--brand-gold)] transition"
            >
              <Mail size={12} strokeWidth={1.5} />
              Écrire
            </a>
            <span className="w-px h-3 bg-gray-200" />
            <a
              href="tel:0767360926"
              className="flex items-center gap-1.5 hover:text-[var(--brand-gold)] transition"
            >
              <Phone size={12} strokeWidth={1.5} />
              07 67 36 09 26
            </a>
          </div>
        </div>
      </aside>
    </>,
    document.body,
  );
}

function DrawerLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between py-5 first:pt-0 last:pb-0"
    >
      <span
        className={`font-serif text-[22px] leading-tight transition ${
          active ? "italic text-[var(--brand-gold)]" : "text-gray-900 group-hover:text-[var(--brand-gold)]"
        }`}
      >
        {children}
      </span>
      <ArrowRight
        size={16}
        className={`transition-all duration-300 ${
          active
            ? "text-[var(--brand-gold)] translate-x-1"
            : "text-[var(--brand-gold)]/40 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1"
        }`}
      />
    </Link>
  );
}

function DrawerSection({
  label,
  links,
  onClose,
  pathname,
}: {
  label: string;
  links: { href: string; label: string; tagline: string }[];
  onClose: () => void;
  pathname: string;
}) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--brand-gold)] mb-4">
        {label}
      </p>
      <div className="space-y-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="group flex items-center justify-between"
            >
              <span
                className={`block font-serif text-[18px] leading-tight transition ${
                  active ? "italic text-[var(--brand-gold)]" : "text-gray-800 group-hover:text-[var(--brand-gold)]"
                }`}
              >
                {link.label}
              </span>
              <ArrowRight
                size={13}
                className={`transition-all duration-300 ${
                  active
                    ? "text-[var(--brand-gold)] translate-x-1"
                    : "text-[var(--brand-gold)]/30 group-hover:text-[var(--brand-gold)] group-hover:translate-x-1"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
