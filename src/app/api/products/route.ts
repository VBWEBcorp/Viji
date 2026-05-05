import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

// GET /api/products — Liste avec pagination, filtres, recherche
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");

    const session = await auth();
    const isAdmin = session?.user?.role === "admin";
    const filter: Record<string, unknown> = {};
    if (!isAdmin) {
      filter.isActive = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice)
        (filter.price as Record<string, number>).$gte = parseInt(minPrice);
      if (maxPrice)
        (filter.price as Record<string, number>).$lte = parseInt(maxPrice);
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, 1 | -1> = {
      [sort]: order === "asc" ? 1 : -1,
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/products — Créer un produit (admin)
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  category: z.string().min(1),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        options: z.array(
          z.object({
            value: z.string(),
            priceModifier: z.number().optional(),
            stock: z.number().optional(),
            sku: z.string().optional(),
          })
        ),
      })
    )
    .optional(),
  stock: z.number().min(0).optional(),
  sku: z.string().optional(),
  weight: z.number().min(0).optional(),
  fulfillmentType: z.enum(["self", "dropship"]).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const validated = productSchema.parse(body);

    await connectDB();

    const slug = generateSlug(validated.name);

    // Vérifier unicité du slug
    const existingProduct = await Product.findOne({ slug });
    const finalSlug = existingProduct
      ? `${slug}-${Date.now()}`
      : slug;

    const product = await Product.create({
      ...validated,
      slug: finalSlug,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
