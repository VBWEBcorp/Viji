"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingCart, User, Menu, X, Search, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const { data: session } = useSession();
  const { itemCount, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm shadow-gray-100/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left — Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 transition"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
              Ma Boutique
            </Link>
          </div>

          {/* Right — Nav + Actions */}
          <div className="flex items-center gap-1">
            <nav className="hidden lg:flex items-center gap-1 mr-1">
              {[
                { href: "/products", label: "Catalogue" },
                { href: "/blog", label: "Blog" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-[13px] text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/70 transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100/70 transition-colors"
            >
              <Search size={18} />
            </button>

            {session && (
              <Link
                href="/account/wishlist"
                className="p-2.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100/70 transition-colors hidden sm:flex"
              >
                <Heart size={18} />
              </Link>
            )}

            <Link
              href={session ? "/account" : "/login"}
              className="p-2.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100/70 transition-colors"
            >
              <User size={18} />
            </Link>

            <button
              onClick={toggleCart}
              className="p-2.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100/70 transition-colors relative"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-[16px] h-[16px] bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? "99" : itemCount}
                </span>
              )}
            </button>

            {session?.user.role === "admin" && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex ml-1 text-[12px] bg-gray-900 text-white px-3.5 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-400"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
          <nav className="px-4 py-5 space-y-1">
            {[
              { href: "/products", label: "Catalogue" },
              { href: "/blog", label: "Blog" },
              ...(session
                ? [{ href: "/account", label: "Mon compte" }]
                : [{ href: "/login", label: "Connexion" }]),
              ...(session?.user.role === "admin"
                ? [{ href: "/admin", label: "Administration" }]
                : []),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-[15px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
