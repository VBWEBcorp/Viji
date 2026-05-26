import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getApiKeys } from "@/lib/apikeys";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";
import { sendEmail } from "@/lib/resend";
import { generateOrderConfirmationEmail } from "@/components/emails/OrderConfirmation";

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

    const order = await Order.findById(orderId);
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.fulfillmentStatus = "processing";
      await order.save();

      // Décrémenter les stocks
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // Incrémenter l'utilisation du code promo
      if (order.promoCode) {
        await PromoCode.findByIdAndUpdate(order.promoCode, {
          $inc: { currentUses: 1 },
        });
      }

      // Vider le panier
      await Cart.findOneAndDelete({ user: order.user });

      // Email de confirmation (best-effort : ne doit jamais faire échouer le webhook)
      try {
        const customer = await User.findById(order.user).select("email").lean();
        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: `Confirmation de votre commande ${order.orderNumber}`,
            html: generateOrderConfirmationEmail({
              orderNumber: order.orderNumber,
              customerName: order.shippingAddress.name,
              items: order.items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              discount: order.discount,
              total: order.total,
              shippingAddress: {
                name: order.shippingAddress.name,
                street: order.shippingAddress.street,
                city: order.shippingAddress.city,
                zip: order.shippingAddress.zip,
                country: order.shippingAddress.country,
              },
            }),
          });
        }
      } catch (err) {
        console.error("Order confirmation email failed:", err);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
  }

  return NextResponse.json({ received: true });
}
