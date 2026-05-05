"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/shop/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  category?: { name: string; slug: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    if (currentSearch) params.set("search", currentSearch);
    params.set("sort", currentSort);
    params.set("order", currentOrder);
    params.set("page", currentPage.toString());
    params.set("limit", "12");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    setLoading(false);
  }, [currentCategory, currentSearch, currentSort, currentOrder, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/products?${params}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {currentSearch
              ? `Résultats pour "${currentSearch}"`
              : "Catalogue"}
          </h1>
          <p className="text-gray-500 mt-1">
            {pagination.total} produit{pagination.total > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={`${currentSort}-${currentOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-");
              updateParams("sort", sort);
              setTimeout(() => updateParams("order", order), 0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          >
            <option value="createdAt-desc">Plus récent</option>
            <option value="createdAt-asc">Plus ancien</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="name-asc">Nom A-Z</option>
          </select>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden p-2 border border-gray-300 rounded-lg"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filtres sidebar */}
        <aside
          className={`${
            filtersOpen ? "fixed inset-0 z-50 bg-white p-6" : "hidden"
          } lg:block lg:static lg:w-56 lg:shrink-0`}
        >
          <div className="flex items-center justify-between lg:hidden mb-6">
            <h2 className="text-lg font-bold">Filtres</h2>
            <button onClick={() => setFiltersOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Catégories
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => updateParams("category", "")}
                  className={`text-sm ${
                    !currentCategory
                      ? "text-black font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  Toutes les catégories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <button
                    onClick={() => updateParams("category", cat._id)}
                    className={`text-sm ${
                      currentCategory === cat._id
                        ? "text-black font-medium"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grille produits */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        updateParams("page", (i + 1).toString())
                      }
                      className={`w-10 h-10 rounded-lg text-sm font-medium ${
                        currentPage === i + 1
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
