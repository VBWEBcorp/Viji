interface OrderCancelledEmailProps {
  orderNumber: string;
  customerName: string;
  reason?: string;
  shopName?: string;
}

export function generateOrderCancelledEmail({
  orderNumber,
  customerName,
  reason,
  shopName = "Ma Boutique",
}: OrderCancelledEmailProps): string {
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
    <h2 style="font-size: 20px;">Commande annulee</h2>
    <p>Bonjour ${customerName},</p>
    <p>Votre commande <strong>${orderNumber}</strong> a été annulee.</p>
    ${reason ? `<p style="color: #666;">Raison : ${reason}</p>` : ""}

    <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        Si un paiement a été effectue, le remboursement sera traite sous 5 a 10 jours ouvrables.
      </p>
    </div>

    <p style="color: #666;">
      Si vous avez des questions, n'hesitez pas a nous contacter.
    </p>
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${shopName}. Tous droits reserves.</p>
  </div>
</body>
</html>`;
}
