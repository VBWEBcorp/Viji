import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getApiKeys } from "@/lib/apikeys";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { fulfillPaidOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    const stripeClient = await getStripe();
    const keys = await getApiKeys();
    event = stripeClient.webhooks.constructEvent(
      body,
      sig,
      keys.stripeWebhookSecret
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    // Les PaymentIntents d'achat de carte cadeau n'ont pas d'orderId : ils sont
    // traités côté /api/gift-cards/purchase, pas ici.
    if (orderId) {
      await fulfillPaidOrder(orderId);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
  }

  return NextResponse.json({ received: true });
}
