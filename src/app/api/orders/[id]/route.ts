import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Order from "@/models/Order";
import { createParcel } from "@/lib/sendcloud";

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const scope = req.nextUrl.searchParams.get("scope");

    const filter: Record<string, unknown> = { _id: id };
    if (scope === "user" || session.user.role !== "admin") {
      filter.user = session.user.id;
    }

    const order = await Order.findOne(filter)
      .populate("user", "name email phone")
      .populate("items.product", "name slug images")
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/orders/[id] — Modifier statut (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    // Mise à jour du statut
    if (body.fulfillmentStatus) {
      order.fulfillmentStatus = body.fulfillmentStatus;
    }
    if (body.paymentStatus) {
      order.paymentStatus = body.paymentStatus;
    }
    if (body.notes !== undefined) {
      order.notes = body.notes;
    }

    // Expédier via Sendcloud
    if (body.action === "ship" && body.shippingMethodId) {
      try {
        const parcelResult = await createParcel({
          name: order.shippingAddress.name,
          address: order.shippingAddress.street,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.zip,
          country: order.shippingAddress.country,
          email:
            ((await Order.findById(id).populate("user", "email"))?.user as unknown as { email: string })?.email || "",
          phone: order.shippingAddress.phone,
          orderNumber: order.orderNumber,
          weight: 500, // poids par défaut, à calculer
          shippingMethodId: body.shippingMethodId,
        });

        if (parcelResult.parcel) {
          order.sendcloudParcelId = parcelResult.parcel.id.toString();
          order.tracking = {
            carrier: parcelResult.parcel.carrier?.code,
            trackingNumber: parcelResult.parcel.tracking_number,
            trackingUrl: parcelResult.parcel.tracking_url,
          };
          order.fulfillmentStatus = "shipped";
        }
      } catch (err) {
        console.error("Sendcloud error:", err);
      }
    }

    await order.save();
    return NextResponse.json(order);
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
