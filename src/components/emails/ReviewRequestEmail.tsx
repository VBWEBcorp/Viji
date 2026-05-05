interface ReviewRequestEmailProps {
  customerName: string;
  orderNumber: string;
  products: { name: string; slug: string; image?: string }[];
  shopName?: string;
}

export function generateReviewRequestEmail({
  customerName,
  orderNumber,
  products,
  shopName = "Ma Boutique",
}: ReviewRequestEmailProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

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
    <h2 style="font-size: 20px; text-align: center;">Donnez votre avis !</h2>
    <p>Bonjour ${customerName},</p>
    <p>Vous avez recu votre commande <strong>${orderNumber}</strong>. Nous esperons que tout vous convient !</p>
    <p>Votre avis est precieux et aide les autres clients dans leurs choix :</p>

    <div style="margin: 20px 0;">
      ${products
        .map(
          (p) => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" width="50" height="50" style="border-radius: 6px; object-fit: cover;" />` : ""}
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 600; font-size: 14px;">${p.name}</p>
          </div>
          <a href="${appUrl}/products/${p.slug}#reviews"
             style="display: inline-block; background: #000; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
            Donner mon avis
          </a>
        </div>
      `
        )
        .join("")}
    </div>
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${shopName}. Tous droits reserves.</p>
  </div>
</body>
</html>`;
}
