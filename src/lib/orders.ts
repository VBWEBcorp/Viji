import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";
import { sendEmail } from "@/lib/resend";
import { getNotificationEmail } from "@/lib/notify";
import { generateOrderConfirmationEmail } from "@/components/emails/OrderConfirmation";
import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailInfoBox,
  emailDivider,
  EMAIL_COLORS,
  esc,
} from "@/lib/email-layout";
import type { IOrder } from "@/models/Order";

function formatEUR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

/**
 * Récapitulatif interne d'une commande boutique payée, à destination de la
 * boutique (et non du client). Reprend la charte des emails transactionnels.
 */
function buildAdminOrderEmail(order: IOrder, customerEmail: string): string {
  const C = EMAIL_COLORS;

  const row = (label: string, value: string, strong = false) =>
    `<tr>
      <td style="padding:7px 0; font-size:14px; color:${C.muted};">${label}</td>
      <td style="padding:7px 0; font-size:14px; text-align:right; color:${strong ? C.ink : C.body}; font-weight:${strong ? 700 : 400};">${value}</td>
    </tr>`;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-size:14px; color:${C.ink};">${esc(i.name)}${i.variant ? ` <span style="color:${C.muted};">· ${esc(i.variant)}</span>` : ""}</td>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-size:14px; color:${C.body}; text-align:center; width:50px;">${i.quantity}</td>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-size:14px; color:${C.ink}; text-align:right; width:90px; font-weight:600;">${formatEUR(i.unitPrice * i.quantity)}</td>
        </tr>`
    )
    .join("");

  const a = order.shippingAddress;
  const livraison =
    order.shippingMethod === "pickup" && order.pickupPoint
      ? `<strong style="color:${C.ink};">Point relais</strong><br>${esc(order.pickupPoint.name)}<br>${esc(order.pickupPoint.street)}<br>${esc(order.pickupPoint.zip)} ${esc(order.pickupPoint.city)}`
      : `<strong style="color:${C.ink};">Livraison à domicile</strong><br>${esc(a.name)}<br>${esc(a.street)}<br>${esc(a.zip)} ${esc(a.city)}<br>${esc(a.country)}`;

  return emailShell({
    title: `Nouvelle commande ${order.orderNumber}`,
    preheader: `${a.name} · ${formatEUR(order.total)}`,
    content:
      emailEyebrow("Nouvelle commande payée") +
      emailHeading(`Commande ${esc(order.orderNumber)}`) +
      emailParagraph(
        `<strong style="color:${C.ink};">${esc(a.name)}</strong>` +
          (customerEmail
            ? ` · <a href="mailto:${esc(customerEmail)}" style="color:${C.gold}; text-decoration:none;">${esc(customerEmail)}</a>`
            : "") +
          (a.phone
            ? ` · <a href="tel:${esc(a.phone.replace(/\s/g, ""))}" style="color:${C.gold}; text-decoration:none;">${esc(a.phone)}</a>`
            : "")
      ) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;">${itemsHtml}</table>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
      row("Sous-total", formatEUR(order.subtotal)) +
      row("Livraison", order.shippingCost > 0 ? formatEUR(order.shippingCost) : "Offerte") +
      (order.discount > 0 ? row("Remise", `− ${formatEUR(order.discount)}`) : "") +
      (order.giftCard?.amount
        ? row(`Carte cadeau (${esc(order.giftCard.code)})`, `− ${formatEUR(order.giftCard.amount)}`)
        : "") +
      row("Total", formatEUR(order.total), true) +
      `</table>` +
      emailDivider() +
      emailInfoBox(
        `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:${C.body}; margin:0;">${livraison}</p>`
      ) +
      (order.notes
        ? emailInfoBox(
            `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:${C.body}; margin:0; white-space:pre-wrap;">${esc(order.notes)}</p>`
          )
        : ""),
  });
}

/**
 * Marque une commande comme payée et déclenche les effets de bord associés :
 * décrément du stock, incrément du code promo, vidage du panier et email de
 * confirmation.
 *
 * Idempotent : ne fait rien si la commande est déjà payée. Appelé depuis le
 * webhook Stripe après paiement par carte bancaire.
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

  // Vider le panier
  await Cart.findOneAndDelete({ user: order.user });

  // Emails (best-effort) : une commande déjà encaissée ne doit jamais échouer
  // parce qu'un envoi a échoué. Les deux envois sont indépendants — la
  // notification interne part même si la confirmation client échoue.
  let customerEmail = "";
  try {
    const customer = await User.findById(order.user).select("email").lean();
    customerEmail = customer?.email || "";
  } catch (err) {
    console.error("Lecture de l'email client impossible:", err);
  }

  // 1. Confirmation au client
  try {
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
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

  // 2. Notification interne : la boutique doit être prévenue de chaque
  // commande payée, au même titre que les réservations traiteur et atelier.
  try {
    await sendEmail({
      to: await getNotificationEmail(),
      subject: `Nouvelle commande – ${order.orderNumber} – ${formatEUR(order.total)}`,
      html: buildAdminOrderEmail(order, customerEmail),
      ...(customerEmail ? { replyTo: customerEmail } : {}),
    });
  } catch (err) {
    console.error("Admin order notification email failed:", err);
  }
}
