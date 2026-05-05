"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: { url: string; alt: string }[];
    category?: { name: string; slug: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images?.[0];
  const secondImage = product.images?.[1];
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden mb-3">
        {mainImage ? (
          <>
            <Image
              src={mainImage.url}
              alt={mainImage.alt || product.name}
              fill
              className={`object-cover transition-all duration-500 ${
                secondImage ? "group-hover:opacity-0" : "group-hover:scale-105"
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {secondImage && (
              <Image
                src={secondImage.url}
                alt={secondImage.alt || product.name}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 transition-all duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-200">
            <ShoppingCart size={40} />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
              -{Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.category && (
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">
            {product.category.name}
          </p>
        )}
        <h3 className="text-[14px] font-medium text-gray-900 group-hover:text-gray-600 transition line-clamp-1">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[15px] font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[13px] text-gray-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
