import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";

// POST /api/webhooks/paypal — Capture PayPal payment
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { paypalOrderId, orderId } = await req.json();

    // Capturer le paiement PayPal
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status === "COMPLETED") {
      const order = await Order.findById(orderId);

      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paymentId = paypalOrderId;
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

        // TODO: Envoyer email de confirmation via Resend
      }

      return NextResponse.json({ success: true, orderNumber: order?.orderNumber });
    }

    return NextResponse.json(
      { error: "Paiement non complété" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
