import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition mb-4"
      >
        <ArrowLeft size={14} /> Retour aux produits
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
