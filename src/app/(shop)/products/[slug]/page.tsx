import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Breadcrumbs from "@/components/shop/Breadcrumbs";
import { ProductJsonLd } from "@/components/shop/JsonLd";
import ProductClientSection from "@/components/shop/ProductClientSection";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";

// ═══════════════════════════════════════
// SEO: generateMetadata — Google lit ca
// ═══════════════════════════════════════
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true })
    .populate("category", "name")
    .lean();

  if (!product) return { title: "Produit non trouvé" };

  const title = product.seo?.metaTitle || product.name;
  const description =
    product.seo?.metaDescription ||
    product.shortDescription ||
    product.description.replace(/<[^>]*>/g, "").slice(0, 160);
  const image = product.images?.[0]?.url;
  const price = (product.price / 100).toFixed(2);
  const categoryName = product.category
    ? (product.category as unknown as { name: string }).name
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products/${slug}`,
      type: "website",
      ...(image && { images: [{ url: image, width: 800, height: 800, alt: product.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    other: {
      "product:price:amount": price,
      "product:price:currency": "EUR",
      ...(categoryName && { "product:category": categoryName }),
    },
  };
}

// ═══════════════════════════════════════
// PAGE: Server Component — SSR complet
// ═══════════════════════════════════════
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const product = await Product.findOne({ slug, isActive: true })
    .populate("category", "name slug")
    .lean();

  if (!product) notFound();

  const categoryData = product.category as unknown as { name: string; slug: string } | null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* JSON-LD — Google structured data */}
      <ProductJsonLd
        name={product.name}
        description={product.description}
        image={product.images.map((img) => img.url)}
        sku={product.sku || product.slug}
        price={product.price}
        compareAtPrice={product.compareAtPrice}
        availability={product.stock > 0 ? "InStock" : "OutOfStock"}
        url={`${baseUrl}/products/${product.slug}`}
        category={categoryData?.name}
      />

      {/* Breadcrumbs — avec JSON-LD */}
      <Breadcrumbs
        items={[
          { label: "Catalogue", href: "/products" },
          ...(categoryData
            ? [{ label: categoryData.name, href: `/products?category=${categoryData.slug}` }]
            : []),
          { label: product.name },
        ]}
        baseUrl={baseUrl}
      />

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* ═══ IMAGES — SSR, indexable ═══ */}
        <ProductImages images={product.images} name={product.name} />

        {/* ═══ PRODUCT INFO — SSR ═══ */}
        <div>
          {categoryData && (
            <Link
              href={`/products?category=${categoryData.slug}`}
              className="text-[12px] text-gray-400 uppercase tracking-widest font-semibold hover:text-gray-600 transition"
            >
              {categoryData.name}
            </Link>
          )}

          {/* H1 — le plus important pour le SEO */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>

          {product.shortDescription && (
            <p className="mt-3 text-gray-500 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Client section: price, variants, add to cart, wishlist, reviews */}
          <ProductClientSection
            productId={String(product._id)}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            stock={product.stock}
            variants={product.variants.map((v) => ({
              name: v.name,
              options: v.options.map((o) => ({
                value: o.value,
                priceModifier: o.priceModifier,
                stock: o.stock,
              })),
            }))}
          />

          {/* Description — SSR, indexable par Google */}
          <div className="mt-10 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div
              className="prose prose-sm text-gray-600 max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {/* Tags SEO — liens internes */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?search=${encodeURIComponent(tag)}`}
                  className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Image gallery — Server Component (SSR)
// avec gestion du state cote client
// ═══════════════════════════════════════
function ProductImages({
  images,
  name,
}: {
  images: { url: string; alt: string; order: number }[];
  name: string;
}) {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
        <ShoppingCart size={64} />
      </div>
    );
  }

  return <ProductImageGallery images={images} name={name} />;
}

// Client component pour le switch d'images
import ProductImageGallery from "@/components/shop/ProductImageGallery";
