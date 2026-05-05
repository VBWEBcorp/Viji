"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import { CreditCard, ArrowLeft, ArrowRight, Check, Home, MapPin } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import MondialRelayWidget, { MondialRelayPoint } from "@/components/shop/MondialRelayWidget";

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  variant?: string;
  quantity: number;
  subtotal: number;
}

type Step = "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("shipping");
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [promoCode, setPromoCode] = useState("");

  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    city: "",
    zip: "",
    country: "FR",
    phone: "",
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    name: "",
    street: "",
    city: "",
    zip: "",
    country: "FR",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe"
  );

  const [shippingMethod, setShippingMethod] = useState<"home" | "pickup">("home");
  const [pickupPoint, setPickupPoint] = useState<MondialRelayPoint | null>(null);
  const [mondialRelayBrandCode, setMondialRelayBrandCode] = useState<string>("");
  const [homeEnabled, setHomeEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(false);

  // Tarifs de livraison (chargés depuis settings)
  const [shippingRates, setShippingRates] = useState({
    homeRate: 499,
    pickupRate: 399,
    homeFreeThreshold: 5000,
    pickupFreeThreshold: 5000,
  });
  const [taxConfig, setTaxConfig] = useState({ rate: 20, pricesIncludeTax: true, label: "TVA" });

  // Calcul des frais de port selon le mode et le seuil
  function computeShipping(method: "home" | "pickup"): number {
    const rate = method === "pickup" ? shippingRates.pickupRate : shippingRates.homeRate;
    const threshold = method === "pickup" ? shippingRates.pickupFreeThreshold : shippingRates.homeFreeThreshold;
    if (threshold > 0 && cartTotal >= threshold) return 0;
    return rate;
  }

  const shippingCost = computeShipping(shippingMethod);

  // Calcul TVA
  // pricesIncludeTax = true : cartTotal est TTC → on extrait la part TVA
  // pricesIncludeTax = false : cartTotal est HT → on ajoute la TVA
  const taxableBase = cartTotal + shippingCost;
  const taxAmount = taxConfig.pricesIncludeTax
    ? Math.round(taxableBase - taxableBase / (1 + taxConfig.rate / 100))
    : Math.round(taxableBase * (taxConfig.rate / 100));
  const total = taxConfig.pricesIncludeTax ? taxableBase : taxableBase + taxAmount;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
      return;
    }

    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        setCartItems(data.items || []);
        setCartTotal(data.total || 0);
      });

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const home = data?.shipping?.homeDeliveryEnabled ?? true;
        const pickup =
          (data?.shipping?.mondialRelayEnabled ?? false) &&
          !!data?.apiKeys?.mondialRelayBrandCode;
        setHomeEnabled(home);
        setPickupEnabled(pickup);
        if (data?.apiKeys?.mondialRelayBrandCode) {
          setMondialRelayBrandCode(data.apiKeys.mondialRelayBrandCode);
        }
        setShippingRates({
          homeRate: data?.shipping?.homeRate ?? 499,
          pickupRate: data?.shipping?.pickupRate ?? 399,
          homeFreeThreshold: data?.shipping?.homeFreeThreshold ?? 5000,
          pickupFreeThreshold: data?.shipping?.pickupFreeThreshold ?? 5000,
        });
        setTaxConfig({
          rate: data?.tax?.rate ?? 20,
          pricesIncludeTax: data?.tax?.pricesIncludeTax ?? true,
          label: data?.tax?.label || "TVA",
        });
        // Si seul pickup actif, le selectionner par defaut
        if (!home && pickup) setShippingMethod("pickup");
        else setShippingMethod("home");
      })
      .catch(() => {});
  }, [status, router]);

  async function handlePlaceOrder() {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress,
          billingAddress: sameAsBilling ? shippingAddress : billingAddress,
          paymentMethod,
          shippingCost,
          shippingMethod,
          pickupPoint:
            shippingMethod === "pickup" && pickupPoint
              ? {
                  id: pickupPoint.ID,
                  name: pickupPoint.Nom,
                  street: [pickupPoint.Adresse1, pickupPoint.Adresse2]
                    .filter(Boolean)
                    .join(" "),
                  city: pickupPoint.Ville,
                  zip: pickupPoint.CP,
                  country: pickupPoint.Pays || "FR",
                  carrier: "mondialrelay",
                }
              : undefined,
          promoCode: promoCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la commande");
        setLoading(false);
        return;
      }

      if (data.paymentMethod === "stripe" && data.clientSecret) {
        // Rediriger vers la page de paiement Stripe
        // En production, utiliser Stripe Elements ici
        setStep("confirmation");
        toast.success(
          `Commande ${data.orderNumber} créée ! Paiement Stripe à finaliser.`
        );
      } else if (data.paymentMethod === "paypal" && data.paypalOrderId) {
        // Capture PayPal
        const captureRes = await fetch("/api/webhooks/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paypalOrderId: data.paypalOrderId,
            orderId: data.orderId,
          }),
        });

        if (captureRes.ok) {
          setStep("confirmation");
          toast.success(`Commande ${data.orderNumber} confirmée !`);
        } else {
          toast.error("Erreur lors du paiement PayPal");
        }
      }
    } catch {
      toast.error("Erreur serveur");
    }

    setLoading(false);
  }

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-96 flex items-center justify-center text-gray-500">
          Chargement...
        </div>
      </div>
    );
  }

  if (step === "confirmation") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-gray-500 mb-8">
          Vous recevrez un email de confirmation avec les détails de votre
          commande.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/account"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Mes commandes
          </Link>
          <Link
            href="/products"
            className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6"
      >
        <ArrowLeft size={16} /> Retour au panier
      </Link>

      <h1 className="text-3xl font-bold mb-8">Passer commande</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`flex items-center gap-2 text-sm font-medium ${
            step === "shipping" ? "text-black" : "text-gray-400"
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">
            1
          </span>
          Livraison
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div
          className={`flex items-center gap-2 text-sm font-medium ${
            step === "payment" ? "text-black" : "text-gray-400"
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === "payment"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </span>
          Paiement
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === "shipping" && (
            <div className="space-y-4">
              {/* Mode de livraison - uniquement si choix entre les 2 */}
              {homeEnabled && pickupEnabled && (
                <div className="bg-white rounded-xl border p-6 space-y-3">
                  <h2 className="text-lg font-semibold">Mode de livraison</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("home")}
                      className={`flex items-center gap-3 p-4 border rounded-lg text-left transition ${
                        shippingMethod === "home"
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Home size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">Domicile</p>
                        <p className="text-xs text-gray-500">Livraison standard</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod("pickup")}
                      className={`flex items-center gap-3 p-4 border rounded-lg text-left transition ${
                        shippingMethod === "pickup"
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <MapPin size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-sm">Point Relais</p>
                        <p className="text-xs text-gray-500">Mondial Relay</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Selecteur point relais */}
              {shippingMethod === "pickup" && pickupEnabled && mondialRelayBrandCode && (
                <div className="bg-white rounded-xl border p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Choisir un point relais</h2>
                  {pickupPoint && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                      <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">{pickupPoint.Nom}</p>
                        <p className="text-green-700">
                          {pickupPoint.Adresse1}
                          {pickupPoint.Adresse2 ? `, ${pickupPoint.Adresse2}` : ""},{" "}
                          {pickupPoint.CP} {pickupPoint.Ville}
                        </p>
                      </div>
                    </div>
                  )}
                  <MondialRelayWidget
                    brandCode={mondialRelayBrandCode}
                    postCode={shippingAddress.zip}
                    onSelect={(p) => setPickupPoint(p)}
                  />
                </div>
              )}

              {/* Coordonnees */}
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold">
                  {shippingMethod === "pickup" ? "Vos coordonnees" : "Adresse de livraison"}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  />
                </div>

                {shippingMethod === "home" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            street: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.zip}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              zip: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              city: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {shippingMethod === "pickup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal (pour rechercher un point) *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zip}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          zip: e.target.value,
                        })
                      }
                      required
                      placeholder="75001"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telephone {shippingMethod === "pickup" ? "*" : ""}
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        phone: e.target.value,
                      })
                    }
                    required={shippingMethod === "pickup"}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">
                    Adresse de facturation identique
                  </span>
                </label>

                <button
                  onClick={() => {
                    if (!shippingAddress.name) {
                      toast.error("Veuillez renseigner votre nom");
                      return;
                    }
                    if (shippingMethod === "home") {
                      if (!shippingAddress.street || !shippingAddress.zip || !shippingAddress.city) {
                        toast.error("Veuillez remplir l'adresse de livraison");
                        return;
                      }
                    } else {
                      if (!pickupPoint) {
                        toast.error("Veuillez choisir un point relais");
                        return;
                      }
                      if (!shippingAddress.phone) {
                        toast.error("Le telephone est obligatoire pour la livraison en point relais");
                        return;
                      }
                      setShippingAddress({
                        ...shippingAddress,
                        street: [pickupPoint.Adresse1, pickupPoint.Adresse2].filter(Boolean).join(" "),
                        city: pickupPoint.Ville,
                        zip: pickupPoint.CP,
                        country: pickupPoint.Pays || "FR",
                      });
                    }
                    setStep("payment");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Continuer vers le paiement <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Code promo */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Code promo</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) =>
                      setPromoCode(e.target.value.toUpperCase())
                    }
                    placeholder="Entrez votre code"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  />
                  <button className="px-4 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                    Appliquer
                  </button>
                </div>
              </div>

              {/* Méthode de paiement */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Mode de paiement
                </h2>

                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                      paymentMethod === "stripe"
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === "stripe"}
                      onChange={() => setPaymentMethod("stripe")}
                      className="w-4 h-4"
                    />
                    <CreditCard size={20} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">
                        Carte bancaire (Stripe)
                      </p>
                      <p className="text-xs text-gray-500">
                        Visa, Mastercard, CB
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                      paymentMethod === "paypal"
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                      className="w-4 h-4"
                    />
                    <span className="text-blue-600 font-bold text-sm">
                      PayPal
                    </span>
                    <div>
                      <p className="font-medium text-sm">PayPal</p>
                      <p className="text-xs text-gray-500">
                        Payez avec votre compte PayPal
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("shipping")}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {loading
                    ? "Traitement..."
                    : `Payer ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Récapitulatif */}
        <div className="bg-white rounded-xl border p-6 h-fit sticky top-24">
          <h2 className="text-lg font-semibold mb-4">Votre commande</h2>

          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.name} x{item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Sous-total{taxConfig.pricesIncludeTax ? " TTC" : " HT"}
              </span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Livraison</span>
              <span>
                {shippingCost === 0 ? (
                  <span className="text-green-600">Gratuit</span>
                ) : (
                  formatPrice(shippingCost)
                )}
              </span>
            </div>
            {taxConfig.rate > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {taxConfig.pricesIncludeTax ? "Dont " : ""}{taxConfig.label} ({taxConfig.rate}%)
                </span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-semibold">Total TTC</span>
            <span className="text-xl font-bold">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
