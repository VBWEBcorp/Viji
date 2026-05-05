import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

// Helper: find product by slug OR by _id
function findQuery(slugOrId: string) {
  if (mongoose.Types.ObjectId.isValid(slugOrId)) {
    return { $or: [{ _id: slugOrId }, { slug: slugOrId }] };
  }
  return { slug: slugOrId };
}

// GET /api/products/[slug]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const product = await Product.findOne(findQuery(slug))
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[slug] — Modifier (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;
    const body = await req.json();

    const product = await Product.findOneAndUpdate(findQuery(slug), body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[slug] — Supprimer (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { slug } = await params;

    const product = await Product.findOneAndDelete(findQuery(slug));

    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Produit supprimé" });
  } catch (error) {
    console.error("DELETE /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
