import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Review from "@/models/Review";
import Order from "@/models/Order";
import { z } from "zod";

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const all = searchParams.get("all"); // admin: get all reviews

    const session = await auth();

    if (all === "true" && session?.user.role === "admin") {
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .populate("user", "name email")
        .populate("product", "name slug images")
        .lean();
      return NextResponse.json(reviews);
    }

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const reviews = await Review.find({ product: productId, isApproved: true })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .lean();

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    return NextResponse.json({ reviews, totalReviews, avgRating });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  comment: z.string().min(1).max(2000),
  photos: z.array(z.string()).optional(),
});

// POST /api/reviews — Create review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const validated = reviewSchema.parse(body);

    // Check if user already reviewed this product
    const existing = await Review.findOne({
      product: validated.productId,
      user: session.user.id,
    });
    if (existing) {
      return NextResponse.json({ error: "Vous avez deja donne votre avis" }, { status: 400 });
    }

    // Check if user purchased this product (verified review)
    const hasPurchased = await Order.findOne({
      user: session.user.id,
      "items.product": validated.productId,
      paymentStatus: "paid",
    });

    const review = await Review.create({
      product: validated.productId,
      user: session.user.id,
      rating: validated.rating,
      title: validated.title,
      comment: validated.comment,
      photos: validated.photos || [],
      isVerified: !!hasPurchased,
      isApproved: false, // needs admin approval
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/reviews — Approve/reject (admin)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { reviewId, isApproved } = await req.json();

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("PUT /api/reviews error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/reviews — Delete (admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { reviewId } = await req.json();
    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({ message: "Avis supprimé" });
  } catch (error) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
