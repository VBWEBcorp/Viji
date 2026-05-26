import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import User from "@/models/User";
import PromoCode from "@/models/PromoCode";
import SiteSettings from "@/models/SiteSettings";
import { getStripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/utils";
import GiftCard from "@/models/GiftCard";
import { sendEmail } from "@/lib/resend";
import { fulfillPaidOrder } from "@/lib/orders";
import { cookies } from "next/headers";
import { z } from "zod";
import crypto from "node:crypto";

// Montant minimum facturable par Stripe (50 centimes pour l'EUR). En dessous,
// on ne peut pas créer de PaymentIntent : la carte cadeau doit couvrir le reste.
const STRIPE_MIN_CHARGE = 50;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}

function passwordSetupEmailHtml(name: string, link: string, orderNumber: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#faf6ee; margin:0; padding:0;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:48px 32px;">
    <p style="font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:#b08438; margin:0 0 20px;">Entre Maman et Moi</p>
    <h1 style="font-family:Georgia, serif; font-size:28px; color:#111827; margin:0 0 24px;">Bienvenue, ${escapeHtml(name)}</h1>
    <p style="font-size:15px; line-height:1.7; color:#374151;">Merci pour votre commande <strong>${escapeHtml(orderNumber)}</strong>. Un compte client a été créé pour vous, afin que vous puissiez retrouver vos commandes et leur suivi à tout moment.</p>
    <p style="font-size:15px; line-height:1.7; color:#374151; margin-top:16px;">Choisissez votre mot de passe pour activer votre espace client&nbsp;:</p>
    <p style="margin:32px 0;">
      <a href="${link}" style="display:inline-block; background:#b08438; color:#ffffff; padding:14px 28px; text-decoration:none; font-size:13px; letter-spacing:0.2em; text-transform:uppercase;">Choisir mon mot de passe</a>
    </p>
    <p style="font-size:13px; color:#6b7280; line-height:1.7;">Ce lien est valable 30 jours. Vous pourrez aussi le redemander à tout moment depuis la page de connexion en cliquant sur «&nbsp;Mot de passe oublié&nbsp;?&nbsp;».</p>
    <p style="font-size:13px; color:#6b7280; word-break:break-all; margin-top:24px;">Lien direct&nbsp;:<br/>${link}</p>
  </div>
</body></html>`;
}

const checkoutSchema = z.object({
  email: z.string().email("Email invalide"),
  // Mot de passe optionnel choisi par le client pendant le checkout.
  // Si présent et que l'email n'a pas encore de compte, on crée le compte avec
  // ce mot de passe et on connecte automatiquement le client après paiement.
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .optional(),
  shippingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1).default("FR"),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1).default("FR"),
    phone: z.string().optional(),
  }),
  paymentMethod: z.enum(["stripe"]),
  shippingMethod: z.enum(["home", "pickup"]).default("home"),
  pickupPoint: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
      street: z.string().min(1),
      city: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1).default("FR"),
      carrier: z.literal("mondialrelay"),
    })
    .optional(),
  shippingMethodId: z.number().optional(),
  shippingCost: z.number().min(0).default(0),
  promoCode: z.string().optional(),
  giftCardCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;

    // L'utilisateur est TOUJOURS déterminé par l'email saisi dans le formulaire,
    // pas par la session. Sinon un admin connecté qui teste avec un autre email
    // verrait toutes ces commandes rattachées à son propre compte.
    const emailLower = validated.email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    let userId: string;
    let isNewAccount = false;
    let accountHasPassword = false;
    let passwordSetupToken: string | null = null;
    if (existingUser) {
      // Compte déjà existant : on ne touche pas au mot de passe même si le
      // client en a saisi un (sinon n'importe qui pourrait écraser le mdp
      // d'un autre simplement en utilisant son email lors d'un checkout).
      userId = String(existingUser._id);
    } else if (validated.password) {
      // Le client a choisi un mot de passe pendant le checkout : on crée
      // directement le compte avec, et il pourra se connecter sans email.
      const newUser = await User.create({
        email: emailLower,
        name: validated.shippingAddress.name,
        passwordHash: validated.password, // hashed by pre-save hook
        role: "customer",
        phone: validated.shippingAddress.phone,
      });
      userId = String(newUser._id);
      isNewAccount = true;
      accountHasPassword = true;
    } else {
      // Pas de mot de passe choisi : compte créé avec un mot de passe aléatoire
      // + un token envoyé par email pour le configurer plus tard.
      const randomPwd = crypto.randomBytes(16).toString("hex");
      passwordSetupToken = crypto.randomBytes(32).toString("hex");
      const newUser = await User.create({
        email: emailLower,
        name: validated.shippingAddress.name,
        passwordHash: randomPwd,
        role: "customer",
        phone: validated.shippingAddress.phone,
        passwordResetToken: passwordSetupToken,
        passwordResetExpires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 jours
      });
      userId = String(newUser._id);
      isNewAccount = true;
    }

    // Récupérer le panier (par user ou par sessionId pour les guests)
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart && sessionId) {
      cart = await Cart.findOne({ sessionId }).populate("items.product");
      // Lier le cart au user à la commande
      if (cart) {
        cart.user = userId as unknown as typeof cart.user;
        cart.sessionId = undefined;
        await cart.save();
      }
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Votre panier est vide" },
        { status: 400 }
      );
    }

    // Calculer le sous-total et vérifier les stocks
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product as unknown as {
        _id: string;
        name: string;
        price: number;
        stock: number;
        images: { url: string }[];
      };

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    // Appliquer le code promo
    let discount = 0;
    let promoCodeId = undefined;

    if (validated.promoCode) {
      const promo = await PromoCode.findOne({
        code: validated.promoCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (promo) {
        if (promo.maxUses && promo.currentUses >= promo.maxUses) {
          return NextResponse.json(
            { error: "Ce code promo a atteint son nombre maximum d'utilisations" },
            { status: 400 }
          );
        }

        if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
          return NextResponse.json(
            { error: `Montant minimum de commande non atteint` },
            { status: 400 }
          );
        }

        if (promo.type === "percentage") {
          discount = Math.round(subtotal * (promo.value / 100));
        } else {
          discount = promo.value;
        }

        promoCodeId = promo._id;
      }
    }

    // Validation: si livraison en point relais, le point relais est obligatoire
    if (validated.shippingMethod === "pickup" && !validated.pickupPoint) {
      return NextResponse.json(
        { error: "Veuillez choisir un point relais" },
        { status: 400 }
      );
    }

    // Récupérer les réglages (frais de port + TVA, source de vérité)
    const settings = await SiteSettings.findOne().lean();
    const sShipping = settings?.shipping || {};
    const sTax = settings?.tax || {};

    const shippingRate =
      validated.shippingMethod === "pickup"
        ? sShipping.pickupRate ?? 399
        : sShipping.homeRate ?? 499;
    const shippingThreshold =
      validated.shippingMethod === "pickup"
        ? sShipping.pickupFreeThreshold ?? 0
        : sShipping.homeFreeThreshold ?? 0;
    const shippingCost =
      shippingThreshold > 0 && subtotal - discount >= shippingThreshold ? 0 : shippingRate;

    // Calcul TVA côté serveur
    const taxRate = sTax.rate ?? 20;
    const pricesIncludeTax = sTax.pricesIncludeTax ?? true;
    const taxableBase = subtotal - discount + shippingCost;
    let tax: number;
    let total: number;
    if (pricesIncludeTax) {
      // Prix TTC : extraire la part TVA
      tax = Math.round(taxableBase - taxableBase / (1 + taxRate / 100));
      total = taxableBase;
    } else {
      // Prix HT : ajouter la TVA
      tax = Math.round(taxableBase * (taxRate / 100));
      total = taxableBase + tax;
    }

    // ── Carte cadeau ───────────────────────────────────────────────
    // La carte cadeau réduit le montant prélevé par carte bancaire, sans
    // modifier le total ni la TVA (c'est un moyen de paiement, pas une remise).
    // Le débit effectif a lieu une fois la commande payée (fulfillPaidOrder).
    let giftCardData:
      | { card: import("mongoose").Types.ObjectId; code: string; amount: number }
      | undefined;
    let amountDue = total;
    if (validated.giftCardCode) {
      const code = validated.giftCardCode.toUpperCase().trim();
      const card = await GiftCard.findOne({ code });
      const expired = card?.expiresAt ? card.expiresAt < new Date() : false;
      if (!card || card.status !== "active" || expired || card.balance <= 0) {
        return NextResponse.json(
          { error: "Carte cadeau invalide ou inutilisable" },
          { status: 400 }
        );
      }
      let used = Math.min(card.balance, total);
      const remaining = total - used;
      // Stripe ne peut pas facturer entre 1 et 49 centimes : on garde au moins
      // le minimum facturable à régler par carte (sauf si la carte couvre tout).
      if (remaining > 0 && remaining < STRIPE_MIN_CHARGE) {
        used = total - STRIPE_MIN_CHARGE;
      }
      amountDue = total - used;
      giftCardData = { card: card._id, code: card.code, amount: used };
    }

    const orderNumber = generateOrderNumber();

    // Créer la commande
    const order = await Order.create({
      orderNumber,
      user: userId,
      items: orderItems,
      subtotal,
      shippingCost,
      discount,
      tax,
      total,
      promoCode: promoCodeId,
      giftCard: giftCardData,
      shippingAddress: validated.shippingAddress,
      billingAddress: validated.billingAddress,
      shippingMethod: validated.shippingMethod,
      pickupPoint: validated.pickupPoint,
      paymentMethod: validated.paymentMethod,
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
    });

    // Pour un nouveau compte créé par checkout invité, on envoie tout de suite
    // le lien « définir mon mot de passe » par email. L'envoi est best-effort —
    // si Resend échoue (quota, clé manquante), on ne bloque pas la commande.
    if (isNewAccount && passwordSetupToken) {
      const link = `${req.nextUrl.origin}/reinitialiser-mot-de-passe?token=${passwordSetupToken}`;
      sendEmail({
        to: emailLower,
        subject: "Bienvenue chez Entre Maman et Moi – choisissez votre mot de passe",
        html: passwordSetupEmailHtml(validated.shippingAddress.name, link, orderNumber),
      }).catch((err) => console.error("Password setup email failed:", err));
    }

    // Si la carte cadeau couvre la totalité, aucun paiement Stripe n'est requis :
    // la commande est validée immédiatement (débit de la carte inclus).
    if (amountDue <= 0) {
      await fulfillPaidOrder(order._id.toString());
      return NextResponse.json({
        orderId: order._id,
        orderNumber,
        clientSecret: null,
        paid: true,
        paymentMethod: "gift_card",
        isNewAccount,
        accountHasPassword,
      });
    }

    // Initier le paiement (Stripe) pour le reste à charge
    const stripeClient = await getStripe();
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountDue,
      currency: "eur",
      metadata: {
        orderId: order._id.toString(),
        orderNumber,
      },
    });

    order.paymentId = paymentIntent.id;
    await order.save();

    return NextResponse.json({
      orderId: order._id,
      orderNumber,
      clientSecret: paymentIntent.client_secret,
      amountDue,
      giftCardAmount: giftCardData?.amount || 0,
      paymentMethod: "stripe",
      isNewAccount,
      accountHasPassword,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/checkout error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
