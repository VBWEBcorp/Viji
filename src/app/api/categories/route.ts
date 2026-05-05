import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

// GET /api/categories
export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .populate("parent", "name slug")
      .sort({ order: 1, name: 1 })
      .lean();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const filterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["select", "multiselect", "range", "color"]),
  options: z.array(z.string()).optional().default([]),
  unit: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().nullable().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  filters: z.array(filterSchema).optional().default([]),
});

// POST /api/categories (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await req.json();
    const validated = categorySchema.parse(body);

    await connectDB();

    const slug = generateSlug(validated.name);
    const existing = await Category.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const category = await Category.create({
      ...validated,
      slug: finalSlug,
      parent: validated.parent || undefined,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
