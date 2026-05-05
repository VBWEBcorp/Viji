"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On cherche par ID via l'API
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          // Convertir les prix de centimes en euros pour le form
          setProduct({
            ...data,
            price: data.price / 100,
            compareAtPrice: data.compareAtPrice
              ? data.compareAtPrice / 100
              : 0,
            category: data.category?._id || data.category || "",
          });
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Modifier le produit</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded w-1/2" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8">Produit non trouvé</h1>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Modifier le produit</h1>
      <ProductForm initialData={product} slug={id as string} />
    </div>
  );
}
