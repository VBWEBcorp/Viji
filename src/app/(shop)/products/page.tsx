import { Suspense } from "react";
import ProductsContent from "./ProductsContent";

export const metadata = {
  title: "Catalogue",
  description: "Découvrez tous nos produits",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-8 bg-gray-100 rounded animate-pulse w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
