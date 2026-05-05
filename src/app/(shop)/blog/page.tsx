import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Actualites et conseils de notre boutique",
};

export default async function BlogPage() {
  await connectDB();

  const posts = await BlogPost.find({ isPublished: true })
    .sort({ publishedAt: -1 })
    .populate("author", "name")
    .lean();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-20">Aucun article pour le moment.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={String(post._id)}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {post.coverImage && (
                <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-5">
                {post.category && (
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {post.category}
                  </span>
                )}
                <h2 className="text-lg font-semibold text-gray-900 mt-1 group-hover:text-gray-600 transition line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                  <span>{(post.author as unknown as { name: string })?.name}</span>
                  <span>·</span>
                  <span>{post.publishedAt ? formatDate(post.publishedAt) : ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
