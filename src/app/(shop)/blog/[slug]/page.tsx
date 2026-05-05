import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/shop/Breadcrumbs";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) return { title: "Article non trouvé" };

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const post = await BlogPost.findOne({ slug, isPublished: true })
    .populate("author", "name")
    .lean();

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
      >
        <ArrowLeft size={16} /> Retour au blog
      </Link>

      {post.category && (
        <span className="text-xs text-gray-500 uppercase tracking-wide">{post.category}</span>
      )}

      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">{post.title}</h1>

      <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
        <span>{(post.author as unknown as { name: string })?.name}</span>
        <span>·</span>
        <span>{post.publishedAt ? formatDate(post.publishedAt) : ""}</span>
      </div>

      {post.coverImage && (
        <div className="relative aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden mt-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* JSON-LD Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.seo?.metaTitle || post.title,
            description: post.seo?.metaDescription || post.excerpt,
            ...(post.coverImage && { image: post.coverImage }),
            author: {
              "@type": "Person",
              name: (post.author as unknown as { name: string })?.name,
            },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
          }),
        }}
      />

      <div
        className="prose prose-gray max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
