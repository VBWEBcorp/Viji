import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Wishlist from "@/models/Wishlist";

// GET /api/wishlist
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ products: [] });
    }

    await connectDB();
    const wishlist = await Wishlist.findOne({ user: session.user.id })
      .populate({
        path: "products",
        select: "name slug price compareAtPrice images stock isActive",
        match: { isActive: true },
      })
      .lean();

    return NextResponse.json({
      products: wishlist?.products?.filter(Boolean) || [],
    });
  } catch (error) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/wishlist — Add product
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    await connectDB();
    const { productId } = await req.json();

    let wishlist = await Wishlist.findOne({ user: session.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: session.user.id,
        products: [productId],
      });
    } else {
      if (!wishlist.products.some((p) => p.toString() === productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    return NextResponse.json({ message: "Ajouté aux favoris" });
  } catch (error) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/wishlist — Remove product
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    await connectDB();
    const { productId } = await req.json();

    await Wishlist.findOneAndUpdate(
      { user: session.user.id },
      { $pull: { products: productId } }
    );

    return NextResponse.json({ message: "Retiré des favoris" });
  } catch (error) {
    console.error("DELETE /api/wishlist error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
