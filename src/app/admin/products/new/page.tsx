import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-[var(--brand-gold)] transition mb-4"
      >
        <ArrowLeft size={14} /> Retour aux produits
      </Link>
      <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1] mb-8">Nouveau produit</h1>
      <ProductForm />
    </div>
  );
}
