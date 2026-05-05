"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Avis clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reviews.length} avis dont {pendingCount} en attente
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { value: "all" as const, label: "Tous" },
          { value: "pending" as const, label: `En attente (${pendingCount})` },
          { value: "approved" as const, label: "Approuvés" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              filter === f.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Star size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Aucun avis</p>
          </div>
        ) : (
          filtered.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                        />
                      ))}
                    </div>
                    {review.isVerified && (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        Verifie
                      </span>
                    )}
                    {!review.isApproved && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        En attente
                      </span>
                    )}
                  </div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{review.title}</h3>
                  <p className="text-[13px] text-gray-600 mt-1">{review.comment}</p>
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-gray-400">
                    <span>{review.user?.name}</span>
                    <span>sur {review.product?.name}</span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {!review.isApproved && (
                    <button
                      onClick={() => updateReview(review._id, true)}
                      className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition"
                      title="Approuvér"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => updateReview(review._id, false)}
                      className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition"
                      title="Rejetér"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
