import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

async function getSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

async function getCart(userId?: string, sessionId?: string) {
  if (userId) {
    return Cart.findOne({ user: userId }).populate("items.product");
  }
  return Cart.findOne({ sessionId }).populate("items.product");
}

// GET /api/cart
export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    const sessionId = await getSessionId();

    const cart = await getCart(session?.user?.id, sessionId);

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const items = cart.items
      .filter((item) => item.product)
      .map((item) => {
        const product = item.product as unknown as {
          _id: string;
          name: string;
          slug: string;
          price: number;
          images: { url: string; alt: string }[];
          stock: number;
        };
        return {
          _id: (item as unknown as { _id: string })._id,
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.images?.[0]?.url,
            stock: product.stock,
          },
          variant: item.variant,
          quantity: item.quantity,
          subtotal: product.price * item.quantity,
        };
      });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/cart — Ajouter un produit
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const sessionId = await getSessionId();
    const { productId, variant, quantity = 1 } = await req.json();

    // Vérifier que le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    let cart = await getCart(session?.user?.id, sessionId);

    if (!cart) {
      cart = await Cart.create({
        user: session?.user?.id || undefined,
        sessionId: session?.user?.id ? undefined : sessionId,
        items: [],
      });
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant === (variant || undefined)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variant: variant || undefined,
        quantity,
      });
    }

    await cart.save();

    const response = NextResponse.json({ message: "Produit ajouté" });

    if (!session?.user?.id) {
      response.cookies.set("cart_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 jours
      });
    }

    return response;
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/cart — Modifier quantité
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const sessionId = await getSessionId();
    const { itemId, quantity } = await req.json();

    const cart = await getCart(session?.user?.id, sessionId);
    if (!cart) {
      return NextResponse.json(
        { error: "Panier non trouvé" },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (i) => (i as unknown as { _id: { toString(): string } })._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    return NextResponse.json({ message: "Panier mis à jour" });
  } catch (error) {
    console.error("PUT /api/cart error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/cart — Supprimer un article
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const sessionId = await getSessionId();
    const { itemId } = await req.json();

    const cart = await getCart(session?.user?.id, sessionId);
    if (!cart) {
      return NextResponse.json(
        { error: "Panier non trouvé" },
        { status: 404 }
      );
    }

    const idx = cart.items.findIndex(
      (i) => (i as unknown as { _id: { toString(): string } })._id.toString() === itemId
    );
    if (idx !== -1) cart.items.splice(idx, 1);
    await cart.save();

    return NextResponse.json({ message: "Article supprimé" });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
