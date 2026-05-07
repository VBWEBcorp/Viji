import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import EmailTemplate from "@/models/EmailTemplate";

// Default templates — used if DB is empty
const DEFAULT_TEMPLATES = [
  {
    key: "order_confirmation",
    name: "Confirmation de commande",
    subject: "Commande {{orderNumber}} confirmée. Merci !",
    description: "Envoyée au client après validation du paiement",
    variables: ["customerName", "orderNumber", "items", "subtotal", "shippingCost", "discount", "total", "shippingAddress"],
    body: `<h2>Merci pour votre commande !</h2>
<p>Bonjour {{customerName}},</p>
<p>Votre commande <strong>{{orderNumber}}</strong> a bien été confirmée.</p>
<p>Nous préparons vos articles et vous enverrons un email dès qu'ils seront expédiés.</p>
<p><strong>Total : {{total}}</strong></p>
<p>À bientôt !</p>`,
  },
  {
    key: "shipping_notification",
    name: "Expédition de commande",
    subject: "Votre commande {{orderNumber}} est en route !",
    description: "Envoyée quand la commande est expédiée avec le numéro de suivi",
    variables: ["customerName", "orderNumber", "carrier", "trackingNumber", "trackingUrl"],
    body: `<h2>Votre commande est en route !</h2>
<p>Bonjour {{customerName}},</p>
<p>Votre commande <strong>{{orderNumber}}</strong> a été expédiée.</p>
<p>Transporteur : <strong>{{carrier}}</strong></p>
<p>Numéro de suivi : <strong>{{trackingNumber}}</strong></p>
<p><a href="{{trackingUrl}}">Suivre mon colis</a></p>`,
  },
  {
    key: "welcome",
    name: "Bienvenue",
    subject: "Bienvenue chez nous, {{customerName}} !",
    description: "Envoyée automatiquement après la création d'un compte",
    variables: ["customerName"],
    body: `<h2>Bienvenue, {{customerName}} !</h2>
<p>Merci d'avoir créé votre compte.</p>
<p>Vous pouvez désormais passer commande, suivre vos livraisons et gérer vos informations personnelles.</p>
<p><a href="{{shopUrl}}/kits/decouverte">Découvrir nos kits</a></p>`,
  },
  {
    key: "order_cancelled",
    name: "Commande annulée",
    subject: "Commande {{orderNumber}} annulée",
    description: "Envoyée quand une commande est annulée",
    variables: ["customerName", "orderNumber", "reason"],
    body: `<h2>Commande annulée</h2>
<p>Bonjour {{customerName}},</p>
<p>Votre commande <strong>{{orderNumber}}</strong> a été annulée.</p>
<p>Si un paiement a été effectué, le remboursement sera traité sous 5 à 10 jours ouvrables.</p>`,
  },
  {
    key: "refund",
    name: "Remboursement",
    subject: "Remboursement confirmé · {{orderNumber}}",
    description: "Envoyée quand un remboursement est effectué",
    variables: ["customerName", "orderNumber", "refundAmount"],
    body: `<h2>Remboursement confirmé</h2>
<p>Bonjour {{customerName}},</p>
<p>Un remboursement de <strong>{{refundAmount}}</strong> a été effectué pour votre commande <strong>{{orderNumber}}</strong>.</p>
<p>Le montant apparaîtra sur votre compte sous 5 à 10 jours ouvrables.</p>`,
  },
  {
    key: "review_request",
    name: "Demande d'avis",
    subject: "Donnez votre avis sur votre commande {{orderNumber}}",
    description: "Envoyée 7 jours après la livraison pour demander un avis",
    variables: ["customerName", "orderNumber", "products"],
    body: `<h2>Donnez votre avis !</h2>
<p>Bonjour {{customerName}},</p>
<p>Vous avez reçu votre commande <strong>{{orderNumber}}</strong>. Nous espérons que tout vous convient !</p>
<p>Votre avis est précieux et aide les autres clients dans leurs choix.</p>
<p><a href="{{shopUrl}}/account/orders">Donner mon avis</a></p>`,
  },
  {
    key: "abandoned_cart",
    name: "Panier abandonné",
    subject: "Vous avez oublié quelque chose...",
    description: "Envoyée quand un panier est abandonné depuis plus d'1h",
    variables: ["customerName", "cartItems", "cartTotal"],
    body: `<h2>Vous avez oublié quelque chose !</h2>
<p>Bonjour {{customerName}},</p>
<p>Vous avez laissé des articles dans votre panier. Ils vous attendent encore !</p>
<p><strong>Total : {{cartTotal}}</strong></p>
<p><a href="{{shopUrl}}/cart">Reprendre ma commande</a></p>`,
  },
  {
    key: "back_in_stock",
    name: "Retour en stock",
    subject: "{{productName}} est de retour en stock !",
    description: "Envoyée quand un produit surveillé revient en stock",
    variables: ["customerName", "productName", "productUrl", "productImage"],
    body: `<h2>Bonne nouvelle !</h2>
<p>Bonjour {{customerName}},</p>
<p>Le produit <strong>{{productName}}</strong> que vous surveilliez est de nouveau disponible.</p>
<p><a href="{{productUrl}}">Voir le produit</a></p>
<p>Attention, les stocks sont limites !</p>`,
  },
];

// GET /api/emails — List all templates
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();

    let templates = await EmailTemplate.find().sort({ key: 1 }).lean();

    // Seed defaults if empty
    if (templates.length === 0) {
      await EmailTemplate.insertMany(DEFAULT_TEMPLATES.map((t) => ({ ...t, isActive: true })));
      templates = await EmailTemplate.find().sort({ key: 1 }).lean();
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/emails error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/emails — Update template
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { key, subject, body, isActive } = await req.json();

    const template = await EmailTemplate.findOneAndUpdate(
      { key },
      { subject, body, ...(isActive !== undefined && { isActive }) },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("PUT /api/emails error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
