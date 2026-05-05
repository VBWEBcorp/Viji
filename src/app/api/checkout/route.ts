import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import SiteSettings from "@/models/SiteSettings";
import { getStripe } from "@/lib/stripe";
import { createPayPalOrder } from "@/lib/paypal";
import { generateOrderNumber } from "@/lib/utils";
import { cookies } from "next/headers";
import { z } from "zod";

const checkoutSchema = z.object({
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
  paymentMethod: z.enum(["stripe", "paypal"]),
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
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour commander" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    // Récupérer le panier
    const cart = await Cart.findOne({ user: session.user.id }).populate(
      "items.product"
    );

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

    const orderNumber = generateOrderNumber();

    // Créer la commande
    const order = await Order.create({
      orderNumber,
      user: session.user.id,
      items: orderItems,
      subtotal,
      shippingCost,
      discount,
      tax,
      total,
      promoCode: promoCodeId,
      shippingAddress: validated.shippingAddress,
      billingAddress: validated.billingAddress,
      shippingMethod: validated.shippingMethod,
      pickupPoint: validated.pickupPoint,
      paymentMethod: validated.paymentMethod,
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
    });

    // Initier le paiement
    if (validated.paymentMethod === "stripe") {
      const stripeClient = await getStripe();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: total,
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
        paymentMethod: "stripe",
      });
    } else {
      // PayPal
      const paypalOrder = await createPayPalOrder(total);

      order.paymentId = paypalOrder.id;
      await order.save();

      return NextResponse.json({
        orderId: order._id,
        orderNumber,
        paypalOrderId: paypalOrder.id,
        paymentMethod: "paypal",
      });
    }
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
