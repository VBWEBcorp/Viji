import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";
import { sendEmail } from "@/lib/resend";
import { generateOrderConfirmationEmail } from "@/components/emails/OrderConfirmation";
import { redeemForOrder } from "@/lib/giftcard";

/**
 * Marque une commande comme payée et déclenche les effets de bord associés :
 * décrément du stock, incrément du code promo, débit de la carte cadeau,
 * vidage du panier et email de confirmation.
 *
 * Idempotent : ne fait rien si la commande est déjà payée. Appelé depuis le
 * webhook Stripe (paiement par carte) et depuis le checkout pour les commandes
 * intégralement réglées par carte cadeau (sans paiement Stripe).
 */
export async function fulfillPaidOrder(orderId: string): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus === "paid") return;

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

  // Débiter la carte cadeau (atomique). Best-effort : on ne ré-échoue pas un
  // paiement déjà encaissé si le solde a changé entre-temps — on journalise.
  if (order.giftCard?.code && order.giftCard.amount > 0) {
    try {
      await redeemForOrder(
        order.giftCard.code,
        order.giftCard.amount,
        order._id,
        order.orderNumber
      );
    } catch (err) {
      console.error(
        `Gift card redemption failed for order ${order.orderNumber}:`,
        err
      );
    }
  }

  // Vider le panier
  await Cart.findOneAndDelete({ user: order.user });

  // Email de confirmation (best-effort)
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
          giftCardAmount: order.giftCard?.amount || 0,
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
