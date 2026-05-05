import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

// Webhook Sendcloud — mise à jour statut livraison
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { action, parcel } = body;

    if (!parcel?.id) {
      return NextResponse.json({ received: true });
    }

    const order = await Order.findOne({
      sendcloudParcelId: parcel.id.toString(),
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Mapping des statuts Sendcloud
    const statusMap: Record<number, string> = {
      1: "processing", // Announced
      3: "shipped", // Handed to carrier
      4: "shipped", // Sorting
      5: "shipped", // In transit
      6: "shipped", // Out for delivery
      11: "delivered", // Delivered
      12: "returned", // Delivery attempt failed
      62: "returned", // Returned to sender
    };

    if (parcel.status?.id && statusMap[parcel.status.id]) {
      order.fulfillmentStatus = statusMap[parcel.status.id] as typeof order.fulfillmentStatus;
    }

    if (parcel.tracking_number) {
      order.tracking = {
        carrier: parcel.carrier?.code || order.tracking?.carrier,
        trackingNumber: parcel.tracking_number,
        trackingUrl: parcel.tracking_url || order.tracking?.trackingUrl,
      };
    }

    await order.save();

    // TODO: Envoyer email de notification au client (expédié, livré)

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Sendcloud webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
