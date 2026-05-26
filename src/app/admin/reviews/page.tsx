"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  isApproved: boolean;
  user: { name: string; email: string };
  product: { name: string; slug: string };
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    fetch("/api/reviews?all=true")
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function updateReview(reviewId: string, isApproved: boolean) {
    const res = await fetch("/api/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, isApproved }),
    });
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, isApproved } : r))
      );
      toast.success(isApproved ? "Avis approuvé" : "Avis rejeté");
    }
  }

  async function deleteReview(reviewId: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    toast.success("Avis supprimé");
  }

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.isApproved;
    if (filter === "approved") return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div>
      <PageHeader
        eyebrow="Réputation"
        title="Avis clients"
        subtitle={loading ? undefined : `${reviews.length} avis · ${pendingCount} en attente`}
      />

      {/* Filtres */}
      <div className="inline-flex bg-white border border-[var(--brand-gold)]/15 p-1 mb-5 max-w-full overflow-x-auto scrollbar-hide">
        {[
          { value: "all" as const, label: "Tous" },
          { value: "pending" as const, label: `En attente (${pendingCount})` },
          { value: "approved" as const, label: "Approuvés" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-2 text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition ${
              filter === f.value
                ? "bg-[var(--brand-gold)] text-white"
                : "text-gray-500 hover:text-[var(--brand-gold)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center text-gray-400 text-sm">Chargement…</Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState icon={<Star size={18} strokeWidth={1.5} />} title="Aucun avis" />
          </Card>
        ) : (
          filtered.map((review) => (
            <Card key={review._id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= review.rating ? "fill-[var(--brand-gold)] text-[var(--brand-gold)]" : "fill-gray-200 text-gray-200"}
                        />
                      ))}
                    </div>
                    {review.isVerified && <Badge tone="green">Vérifié</Badge>}
                    {!review.isApproved && <Badge tone="amber">En attente</Badge>}
                  </div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{review.title}</h3>
                  <p className="text-[13px] text-gray-600 mt-1">{review.comment}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[12px] text-gray-400">
                    <span>{review.user?.name}</span>
                    <span>sur {review.product?.name}</span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!review.isApproved && (
                    <button
                      onClick={() => updateReview(review._id, true)}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 transition"
                      title="Approuver"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => updateReview(review._id, false)}
                      className="p-2 text-amber-500 hover:bg-amber-50 transition"
                      title="Rejeter"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
