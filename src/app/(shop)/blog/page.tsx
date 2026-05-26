import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { getContent } from "@/lib/content";
import type { Metadata } from "next";

// Rendu dynamique pour refléter immédiatement les modifications de contenu.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog · Recettes & guides de cuisine indienne",
  description:
    "Recettes traditionnelles, guides d'épices et conseils pour cuisiner indien à la maison. Le carnet de cuisine d'Entre Maman et Moi.",
};

export default async function BlogPage() {
  await connectDB();
  const t = await getContent();

  const posts = await BlogPost.find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .populate("author", "name")
    .lean();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
            {t("blog_eyebrow")}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-900 leading-[1.05] mb-7">
            {t("blog_title")}{" "}
            <span className="italic text-[var(--brand-gold)]">{t("blog_title_accent")}</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/50 mx-auto mb-7" />
          <p className="font-serif italic text-[15px] md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            {t("blog_subtitle")}
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        {posts.length === 0 ? (
          <p className="font-serif italic text-gray-500 text-center py-20">
            {t("blog_empty")}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {posts.map((post) => (
              <Link
                key={String(post._id)}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                {post.coverImage && (
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)] mb-6">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                {post.category && (
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
                    {post.category}
                  </p>
                )}
                <h2 className="font-serif text-2xl md:text-[26px] text-gray-900 leading-tight mb-3 group-hover:text-[var(--brand-gold)] transition">
                  {post.title}
                </h2>
                <div className="w-8 h-px bg-[var(--brand-gold)]/40 mb-4" />
                <p className="font-serif italic text-[14px] text-gray-600 leading-relaxed mb-5 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-serif italic text-gray-500">
                    {post.publishedAt ? formatDate(post.publishedAt) : ""}
                  </span>
                  <span className="uppercase tracking-[0.3em] text-[var(--brand-gold)] inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Lire l&apos;article <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
