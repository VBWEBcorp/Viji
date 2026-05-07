interface ShippingNotificationProps {
  orderNumber: string;
  customerName: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export function generateShippingNotificationEmail(
  props: ShippingNotificationProps
): string {
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
    <h2 style="font-size: 20px;">Votre commande est en route !</h2>
    <p>Bonjour ${props.customerName},</p>
    <p>Votre commande <strong>${props.orderNumber}</strong> a été expédiée.</p>

    ${
      props.trackingNumber
        ? `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">Transporteur: <strong>${props.carrier || "non précisé"}</strong></p>
      <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">N° de suivi: <strong>${props.trackingNumber}</strong></p>
      ${
        props.trackingUrl
          ? `<a href="${props.trackingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Suivre mon colis</a>`
          : ""
      }
    </div>
    `
        : ""
    }
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Ma Boutique. Tous droits réservés.</p>
  </div>
</body>
</html>`;
}
