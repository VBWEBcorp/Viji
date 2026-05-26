"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Package, FolderTree } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { PageHeader, Card, Badge, GoldButton, EmptyState } from "@/components/admin/ui";

const CategoriesManager = dynamic(() => import("@/components/admin/CategoriesManager"), {
  ssr: false,
  loading: () => <div className="h-64 bg-white border border-[var(--brand-gold)]/15 animate-pulse" />,
});

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  images: { url: string; alt: string }[];
  category?: { name: string };
}

export default function AdminProductsPage() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (tab === "products") fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", "50");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  async function deleteProduct(slug: string) {
    if (!confirm("Supprimer ce produit ?")) return;

    const res = await fetch(`/api/products/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Produit supprimé");
      setProducts((prev) => prev.filter((p) => p.slug !== slug));
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  function stockColor(stock: number) {
    if (stock <= 0) return "text-red-500";
    if (stock <= 5) return "text-amber-500";
    return "text-gray-700";
  }

  return (
    <div>
      <PageHeader eyebrow="Catalogue" title="Produits">
        {tab === "products" && (
          <GoldButton href="/admin/products/new">
            <Plus size={14} /> Ajouter
          </GoldButton>
        )}
      </PageHeader>

      {/* Onglets Produits / Catégories */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="inline-flex bg-white border border-[var(--brand-gold)]/15 p-1">
          {[
            { key: "products" as const, label: "Produits", icon: Package },
            { key: "categories" as const, label: "Catégories", icon: FolderTree },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                tab === t.key
                  ? "bg-[var(--brand-gold)] text-white"
                  : "text-gray-500 hover:text-[var(--brand-gold)]"
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
        {tab === "products" && !loading && (
          <p className="text-[13px] text-gray-400">
            {products.length} produit{products.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {tab === "products" && (
        <>
          {/* Recherche */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              placeholder="Rechercher un produit…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
            />
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Chargement…</div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package size={18} strokeWidth={1.5} />}
                title="Aucun produit"
                description="Créez votre premier produit pour commencer à vendre."
                action={
                  <GoldButton href="/admin/products/new">
                    <Plus size={14} /> Ajouter un produit
                  </GoldButton>
                }
              />
            ) : (
              <>
                {/* Desktop : tableau */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--brand-gold)]/15">
                        {["Produit", "Prix", "Stock", "Statut", "Actions"].map((h, i) => (
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
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-[var(--brand-cream)]/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <ProductThumb product={product} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-gray-900 truncate">{product.name}</p>
                                {product.category && (
                                  <p className="text-[11px] text-gray-400">{product.category.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-serif text-[15px] text-gray-900">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[13px] font-medium ${stockColor(product.stock)}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={product.isActive ? "green" : "gray"}>
                              {product.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/admin/products/${product._id}`}
                                className="p-2 text-gray-400 hover:text-[var(--brand-gold)] hover:bg-[var(--brand-cream)]/60 transition"
                                aria-label="Modifier"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() => deleteProduct(product.slug)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                aria-label="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile : cartes */}
                <div className="md:hidden divide-y divide-[var(--brand-gold)]/10">
                  {products.map((product) => (
                    <div key={product._id} className="flex items-center gap-3 px-4 py-3.5">
                      <ProductThumb product={product} />
                      <Link href={`/admin/products/${product._id}`} className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-serif text-[14px] text-gray-900">{formatPrice(product.price)}</span>
                          <span className={`text-[12px] ${stockColor(product.stock)}`}>· {product.stock} en stock</span>
                        </div>
                        <div className="mt-1.5">
                          <Badge tone={product.isActive ? "green" : "gray"}>
                            {product.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.slug)}
                        className="p-2 text-gray-400 hover:text-red-600 transition shrink-0"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {tab === "categories" && <CategoriesManager />}
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  if (product.images?.[0]) {
    return (
      <Image
        src={product.images[0].url}
        alt=""
        width={44}
        height={44}
        className="object-cover w-11 h-11 shrink-0"
      />
    );
  }
  return (
    <div className="w-11 h-11 bg-[var(--brand-cream)] flex items-center justify-center shrink-0">
      <Package size={16} className="text-[var(--brand-gold)]/40" />
    </div>
  );
}
