import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Return from "@/models/Return";
import Order from "@/models/Order";
import { z } from "zod";

// GET /api/returns
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};
    if (session.user.role !== "admin") {
      filter.user = session.user.id;
    }

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const returns = await Return.find(filter)
      .sort({ createdAt: -1 })
      .populate("order", "orderNumber")
      .populate("user", "name email")
      .lean();

    return NextResponse.json(returns);
  } catch (error) {
    console.error("GET /api/returns error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const returnSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      name: z.string().min(1),
      variant: z.string().optional(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      reason: z.string().min(1),
    })
  ),
  reason: z.string().min(1),
});

// POST /api/returns — Request return
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const validated = returnSchema.parse(body);

    // Verify order belongs to user
    const order = await Order.findOne({
      _id: validated.orderId,
      user: session.user.id,
      paymentStatus: "paid",
    });

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });
    }

    const refundAmount = validated.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const returnRequest = await Return.create({
      order: validated.orderId,
      user: session.user.id,
      items: validated.items.map((item) => ({
        product: item.productId,
        name: item.name,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        reason: item.reason,
      })),
      reason: validated.reason,
      refundAmount,
      status: "requested",
    });

    return NextResponse.json(returnRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/returns error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/returns — Update status (admin)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { returnId, status, adminNotes } = await req.json();

    const returnReq = await Return.findByIdAndUpdate(
      returnId,
      {
        status,
        ...(adminNotes && { adminNotes }),
      },
      { new: true }
    );

    if (!returnReq) {
      return NextResponse.json({ error: "Retour non trouvé" }, { status: 404 });
    }

    return NextResponse.json(returnReq);
  } catch (error) {
    console.error("PUT /api/returns error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
