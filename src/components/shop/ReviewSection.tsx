"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  user: { name: string };
  createdAt: string;
}

function Stars({ rating, size = 16, interactive = false, onChange }: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            className={`${
              star <= (hover || rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewStars({ rating, count, size = 14 }: { rating: number; count: number; size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Stars rating={Math.round(rating)} size={size} />
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setTotalReviews(data.totalReviews || 0);
        setAvgRating(data.avgRating || 0);
      });
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formRating === 0) {
      toast.error("Sélectionnez une note");
      return;
    }
    setSubmitting(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: formRating,
        title: formTitle,
        comment: formComment,
      }),
    });

    if (res.ok) {
      toast.success("Merci ! Votre avis sera publie apres verification.");
      setShowForm(false);
      setFormRating(0);
      setFormTitle("");
      setFormComment("");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
    setSubmitting(false);
  }

  return (
    <div id="reviews" className="mt-12 pt-8 border-t">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Avis clients</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(avgRating)} size={18} />
              <span className="text-sm text-gray-500">
                {avgRating.toFixed(1)} sur 5 ({totalReviews} avis)
              </span>
            </div>
          )}
        </div>
        {session && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Donner mon avis
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note *</label>
            <Stars rating={formRating} size={28} interactive onChange={setFormRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Résumez votre experience"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre avis *</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              required
              maxLength={2000}
              rows={4}
              placeholder="Partagez votre experience avec ce produit..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Publier mon avis"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Aucun avis pour le moment. Soyez le premier a donner votre avis !
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Stars rating={review.rating} size={16} />
                  <h3 className="font-semibold text-gray-900 mt-1">{review.title}</h3>
                </div>
                {review.isVerified && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Achat verifie
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-3">
                {review.user.name} · {formatDate(review.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
