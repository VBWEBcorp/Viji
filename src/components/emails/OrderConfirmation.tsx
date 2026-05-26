interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  giftCardAmount?: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

export function generateOrderConfirmationEmail(
  props: OrderConfirmationProps
): string {
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
    <h1 style="font-size: 24px; margin: 0;">Ma Boutique</h1>
  </div>

  <div style="padding: 30px 0;">
    <h2 style="font-size: 20px;">Merci pour votre commande !</h2>
    <p>Bonjour ${props.customerName},</p>
    <p>Votre commande <strong>${props.orderNumber}</strong> a bien été confirmée.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #eee;">
          <th style="text-align: left; padding: 10px 0;">Produit</th>
          <th style="text-align: center; padding: 10px 0;">Qté</th>
          <th style="text-align: right; padding: 10px 0;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${props.items
          .map(
            (item) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0;">${item.name}</td>
            <td style="text-align: center; padding: 10px 0;">${item.quantity}</td>
            <td style="text-align: right; padding: 10px 0;">${formatPrice(item.unitPrice * item.quantity)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div style="text-align: right; padding: 10px 0;">
      <p style="margin: 5px 0;">Sous-total: ${formatPrice(props.subtotal)}</p>
      ${props.discount > 0 ? `<p style="margin: 5px 0; color: #22c55e;">Réduction: -${formatPrice(props.discount)}</p>` : ""}
      <p style="margin: 5px 0;">Livraison: ${props.shippingCost === 0 ? "Gratuit" : formatPrice(props.shippingCost)}</p>
      ${props.giftCardAmount && props.giftCardAmount > 0 ? `<p style="margin: 5px 0; color: #b08438;">Carte cadeau: -${formatPrice(props.giftCardAmount)}</p>` : ""}
      <p style="margin: 10px 0; font-size: 18px; font-weight: bold;">Total: ${formatPrice(props.total)}</p>
      ${props.giftCardAmount && props.giftCardAmount > 0 ? `<p style="margin: 5px 0; font-size: 13px; color: #666;">Réglé par carte bancaire: ${formatPrice(Math.max(0, props.total - props.giftCardAmount))}</p>` : ""}
    </div>

    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px;">Adresse de livraison</h3>
      <p style="margin: 0; font-size: 14px; color: #666;">
        ${props.shippingAddress.name}<br>
        ${props.shippingAddress.street}<br>
        ${props.shippingAddress.zip} ${props.shippingAddress.city}<br>
        ${props.shippingAddress.country}
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Ma Boutique. Tous droits réservés.</p>
  </div>
</body>
</html>`;
}
