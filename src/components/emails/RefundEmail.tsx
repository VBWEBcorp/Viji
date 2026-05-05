interface RefundEmailProps {
  orderNumber: string;
  customerName: string;
  amount: number;
  shopName?: string;
}

export function generateRefundEmail({
  orderNumber,
  customerName,
  amount,
  shopName = "Ma Boutique",
}: RefundEmailProps): string {
  const formatPrice = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
    <h1 style="font-size: 24px; margin: 0;">${shopName}</h1>
  </div>

  <div style="padding: 30px 0;">
    <h2 style="font-size: 20px;">Remboursement confirme</h2>
    <p>Bonjour ${customerName},</p>
    <p>Un remboursement a été effectue pour votre commande <strong>${orderNumber}</strong>.</p>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">Montant remboursé</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #166534;">${formatPrice(amount)}</p>
    </div>

    <p style="color: #666; font-size: 14px;">
      Le remboursement apparaitra sur votre compte sous 5 a 10 jours ouvrables selon votre banque.
    </p>
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${shopName}. Tous droits reserves.</p>
  </div>
</body>
</html>`;
}
