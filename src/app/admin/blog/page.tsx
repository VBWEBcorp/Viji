"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, PenSquare, Eye, Search, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  author?: { name: string };
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    fetch("/api/blog?all=true&limit=50")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      });
  }, []);

  async function deletePost(slug: string) {
    if (!confirm("Supprimer cet article ?")) return;
    const res = await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      toast.success("Article supprimé");
    }
  }

  async function togglePublish(slug: string, isPublished: boolean) {
    const res = await fetch(`/api/blog/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, isPublished: !isPublished } : p))
      );
      toast.success(!isPublished ? "Article publié" : "Article depublié");
    }
  }

  const filtered = posts.filter((p) => {
    if (filter === "published" && !p.isPublished) return false;
    if (filter === "draft" && p.isPublished) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    }
    return true;
  });

  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.filter((p) => !p.isPublished).length;

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Blog</h1>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — aucun article
  if (posts.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-400 mt-0.5">Publiez des articles pour ameliorer votre referencement</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <PenSquare size={28} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Lancez votre blog
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Un blog ameliore votre referencement sur Google et attire du trafic organique.
            Redigez des guides, des conseils ou des actualites liees a vos produits.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-[13px] font-medium text-gray-700 mb-2">Idees d&apos;articles :</p>
            <ul className="text-[12px] text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                Guide d&apos;achat pour vos produits phares
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                Conseils d&apos;utilisation et d&apos;entretien
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                Tendances et nouveautes de votre secteur
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                FAQ et reponses aux questions frequentes
              </li>
            </ul>
          </div>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            <PenSquare size={16} /> Ecrire mon premier article
          </Link>
        </div>
      </div>
    );
  }

  // Liste des articles
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {posts.length} article{posts.length > 1 ? "s" : ""} — {publishedCount} publie{publishedCount > 1 ? "s" : ""}, {draftCount} brouillon{draftCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> Nouvel article
        </Link>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { value: "all" as const, label: "Tous" },
            { value: "published" as const, label: `Publies (${publishedCount})` },
            { value: "draft" as const, label: `Brouillons (${draftCount})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                filter === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Articles en cartes */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">Aucun article correspond a votre recherche</p>
          </div>
        ) : (
          filtered.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {post.coverImage ? (
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={112}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-20 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <PenSquare size={20} className="text-gray-200" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[14px] font-semibold text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <button
                          onClick={() => togglePublish(post.slug, post.isPublished)}
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border cursor-pointer transition ${
                            post.isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          {post.isPublished ? "Publié" : "Brouillon"}
                        </button>
                      </div>
                      <p className="text-[12px] text-gray-400 line-clamp-1">{post.excerpt}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                        {post.category && <span className="bg-gray-100 px-2 py-0.5 rounded">{post.category}</span>}
                        <span>{post.author?.name}</span>
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        {post.tags.length > 0 && (
                          <span className="text-gray-300">
                            {post.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {post.isPublished && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          title="Voir sur le site"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post.slug}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => deletePost(post.slug)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
