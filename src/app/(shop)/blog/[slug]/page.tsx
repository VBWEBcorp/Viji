import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

  // Articles connexes (autres articles publiés)
  const related = await BlogPost.find({
    isPublished: true,
    slug: { $ne: post.slug },
  })
    .sort({ publishedAt: -1 })
    .limit(2)
    .lean();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)] mb-8 hover:text-[var(--brand-gold-dark)] transition"
          >
            <ArrowLeft size={12} /> Retour au carnet
          </Link>
          {post.category && (
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
              {post.category}
            </p>
          )}
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-gray-900 leading-[1.05]">
            {post.title}
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/50 mx-auto mt-7 mb-6" />
          <div className="flex items-center justify-center gap-3 text-[12px] font-serif italic text-gray-500">
            <span>{(post.author as unknown as { name: string })?.name}</span>
            <span className="text-[var(--brand-gold)]/60">·</span>
            <span>{post.publishedAt ? formatDate(post.publishedAt) : ""}</span>
          </div>
        </div>
      </section>

      {/* Cover */}
      {post.coverImage && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 md:-mt-12 mb-12 md:mb-16 relative z-10">
          <div className="relative aspect-[16/9] bg-[var(--brand-cream)] overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
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

      {/* Body */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-14 md:pb-20">
        <div
          className="prose prose-gray max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-5 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-[15px] prose-p:leading-[1.85] prose-p:text-gray-700 prose-li:text-[15px] prose-li:text-gray-700 prose-li:leading-[1.85] prose-a:text-[var(--brand-gold)] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-em:text-gray-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--brand-gold)]/15">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-4">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-[var(--brand-gold)] border border-[var(--brand-gold)]/30 px-3 py-1.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Articles connexes */}
      {related.length > 0 && (
        <section className="bg-[var(--brand-cream)]/40 py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
                Aller plus loin
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-900">
                Autres articles
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-12">
              {related.map((r) => (
                <Link
                  key={String(r._id)}
                  href={`/blog/${r.slug}`}
                  className="group block"
                >
                  {r.coverImage && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--brand-cream)] mb-5">
                      <Image
                        src={r.coverImage}
                        alt={r.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  {r.category && (
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
                      {r.category}
                    </p>
                  )}
                  <h3 className="font-serif text-xl md:text-2xl text-gray-900 leading-tight mb-3 group-hover:text-[var(--brand-gold)] transition">
                    {r.title}
                  </h3>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Lire <ArrowRight size={11} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
