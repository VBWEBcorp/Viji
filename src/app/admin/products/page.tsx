"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Package, FolderTree } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const CategoriesManager = dynamic(() => import("@/components/admin/CategoriesManager"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />,
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

  return (
    <div>
      {/* Header + Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Toggle Produits / Categories */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setTab("products")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                tab === "products"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package size={14} />
              Produits
            </button>
            <button
              onClick={() => setTab("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                tab === "categories"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FolderTree size={14} />
              Categories
            </button>
          </div>

          {tab === "products" && (
            <p className="text-sm text-gray-400">
              {products.length} produit{products.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {tab === "products" && (
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Ajouter
          </Link>
        )}
      </div>

      {/* TAB: Products */}
      {tab === "products" && (
        <>
          {/* Search */}
          <div className="relative mb-5">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Aucun produit</p>
                <Link
                  href="/admin/products/new"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-gray-900 font-medium hover:underline"
                >
                  Ajouter votre premier produit <Plus size={14} />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt=""
                              width={40}
                              height={40}
                              className="rounded-lg object-cover w-10 h-10"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={16} className="text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-medium text-gray-900">{product.name}</p>
                            {product.category && (
                              <p className="text-[11px] text-gray-400">
                                {product.category.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-gray-700">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[13px] font-medium ${
                            product.stock <= 0
                              ? "text-red-500"
                              : product.stock <= 5
                              ? "text-amber-500"
                              : "text-gray-700"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {product.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.slug)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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
            )}
          </div>
        </>
      )}

      {/* TAB: Categories */}
      {tab === "categories" && <CategoriesManager />}
    </div>
  );
}
