import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import BlogPost from "@/models/BlogPost";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

// GET /api/blog
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const all = searchParams.get("all"); // admin: include drafts

    const session = await auth();
    const isAdmin = session?.user.role === "admin";

    const filter: Record<string, unknown> = {};
    if (all !== "true" || !isAdmin) {
      filter.isPublished = true;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name")
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const blogSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().min(1).max(500),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }).optional(),
  isPublished: z.boolean().optional(),
});

// POST /api/blog — Create post (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const validated = blogSchema.parse(body);

    const slug = generateSlug(validated.title);
    const existing = await BlogPost.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const post = await BlogPost.create({
      ...validated,
      slug: finalSlug,
      author: session.user.id,
      publishedAt: validated.isPublished ? new Date() : undefined,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
