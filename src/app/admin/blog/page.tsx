"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, PenSquare, Search, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { PageHeader, Card, GoldButton, Badge, EmptyState } from "@/components/admin/ui";

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
        <PageHeader eyebrow="Contenu" title="Blog" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[var(--brand-gold)]/15 h-24 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — aucun article
  if (posts.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Contenu"
          title="Blog"
          subtitle="Publiez des articles pour ameliorer votre referencement"
        />

        <Card className="px-6 py-12 sm:px-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
            <PenSquare size={24} strokeWidth={1.5} />
          </div>
          <p className="font-serif italic text-xl sm:text-2xl text-gray-900 mb-2">
            Lancez votre blog
          </p>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
            Un blog ameliore votre referencement sur Google et attire du trafic organique.
            Redigez des guides, des conseils ou des actualites liees a vos produits.
          </p>

          <div className="bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/15 p-4 mb-6 text-left">
            <p className="text-[12px] font-medium text-gray-700 mb-2">Idees d&apos;articles :</p>
            <ul className="text-[12px] text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-gold)]/50 mt-0.5">•</span>
                Guide d&apos;achat pour vos produits phares
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-gold)]/50 mt-0.5">•</span>
                Conseils d&apos;utilisation et d&apos;entretien
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-gold)]/50 mt-0.5">•</span>
                Tendances et nouveautes de votre secteur
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand-gold)]/50 mt-0.5">•</span>
                FAQ et reponses aux questions frequentes
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <GoldButton href="/admin/blog/new">
              <PenSquare size={14} /> Ecrire mon premier article
            </GoldButton>
          </div>
        </Card>
      </div>
    );
  }

  // Liste des articles
  return (
    <div>
      <PageHeader
        eyebrow="Contenu"
        title="Blog"
        subtitle={`${posts.length} article${posts.length > 1 ? "s" : ""} · ${publishedCount} publié${publishedCount > 1 ? "s" : ""}, ${draftCount} brouillon${draftCount > 1 ? "s" : ""}`}
      >
        <GoldButton href="/admin/blog/new">
          <Plus size={14} /> Nouvel article
        </GoldButton>
      </PageHeader>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-1 border border-[var(--brand-gold)]/20 p-1">
          {[
            { value: "all" as const, label: "Tous" },
            { value: "published" as const, label: `Publies (${publishedCount})` },
            { value: "draft" as const, label: `Brouillons (${draftCount})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] font-medium transition ${
                filter === f.value
                  ? "bg-[var(--brand-cream)] text-[var(--brand-gold-dark)]"
                  : "text-gray-500 hover:text-[var(--brand-gold)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--brand-gold)]/20 text-sm focus:ring-2 focus:ring-[var(--brand-gold)]/15 focus:border-[var(--brand-gold)]/40 outline-none transition placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Articles en cartes */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Search size={18} strokeWidth={1.5} />}
              title="Aucun article"
              description="Aucun article ne correspond a votre recherche."
            />
          </Card>
        ) : (
          filtered.map((post) => (
            <Card key={post._id} className="p-4 hover:bg-[var(--brand-cream)]/40 transition-colors">
              <div className="flex gap-4">
                {/* Thumbnail */}
                {post.coverImage ? (
                  <div className="w-24 h-18 sm:w-28 sm:h-20 overflow-hidden bg-[var(--brand-cream)]/60 shrink-0">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={112}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-18 sm:w-28 sm:h-20 bg-[var(--brand-cream)]/60 flex items-center justify-center shrink-0">
                    <PenSquare size={20} className="text-[var(--brand-gold)]/30" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-serif text-[15px] text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <button
                          onClick={() => togglePublish(post.slug, post.isPublished)}
                          className="shrink-0 cursor-pointer"
                          title={post.isPublished ? "Depublier" : "Publier"}
                        >
                          <Badge tone={post.isPublished ? "green" : "amber"}>
                            {post.isPublished ? "Publié" : "Brouillon"}
                          </Badge>
                        </button>
                      </div>
                      <p className="text-[12px] text-gray-400 line-clamp-1">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-400">
                        {post.category && (
                          <span className="bg-[var(--brand-cream)]/60 text-[var(--brand-gold-dark)] px-2 py-0.5">
                            {post.category}
                          </span>
                        )}
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
                          className="p-2 text-gray-400 hover:text-[var(--brand-gold)] transition"
                          title="Voir sur le site"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post.slug}`}
                        className="p-2 text-gray-400 hover:text-[var(--brand-gold)] transition"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => deletePost(post.slug)}
                        className="p-2 text-gray-400 hover:text-red-600 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
