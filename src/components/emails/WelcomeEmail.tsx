interface WelcomeEmailProps {
  customerName: string;
  shopName?: string;
}

export function generateWelcomeEmail({ customerName, shopName = "Ma Boutique" }: WelcomeEmailProps): string {
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

  <div style="padding: 30px 0; text-align: center;">
    <div style="width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
      <span style="font-size: 32px;">👋</span>
    </div>
    <h2 style="font-size: 22px; margin: 0 0 10px 0;">Bienvenue, ${customerName} !</h2>
    <p style="color: #666; line-height: 1.6;">
      Merci d'avoir cree votre compte sur ${shopName}. Vous pouvez desormais passer commande,
      suivre vos livraisons et gerer vos informations personnelles.
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/products"
       style="display: inline-block; background: #000; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
      Découvrir nos produits
    </a>
  </div>

  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${shopName}. Tous droits reserves.</p>
  </div>
</body>
</html>`;
}
