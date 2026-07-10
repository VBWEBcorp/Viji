"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import {
  Gift,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Mail,
  Clock,
  ShieldCheck,
  Heart,
  Search,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import GiftCardVisual, {
  type GiftCardTemplate,
} from "@/components/shop/GiftCardVisual";

// ── Formatage EUROS (l'API renvoie désormais des euros, plus de centimes) ─────
const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n
  );

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "details" | "payment" | "confirmation";

interface GiftCardConfig {
  enabled: boolean;
  shopName: string;
  template: GiftCardTemplate | null;
  presets: number[]; // euros : [10, 20, …, 100]
  min: number; // 5
  max: number; // 500
  stripeConfigured: boolean;
  stripePublishableKey: string;
}

interface PurchaseResult {
  id: string;
  code: string;
  amount: number; // euros
  recipient?: { name?: string; email?: string; message?: string };
  expiresAt?: string | null;
  testMode?: boolean;
}

export default function GiftCardPurchasePage() {
  usePageTitle("Carte cadeau");

  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<GiftCardConfig | null>(null);

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false); // init paiement (mode réel)
  const [processing, setProcessing] = useState(false); // finalisation achat
  const processingRef = useRef(false);

  // Montant en euros (source de vérité)
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [purchaser, setPurchaser] = useState({ name: "", email: "" });
  const [recipient, setRecipient] = useState({ name: "", email: "", message: "" });

  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  // ── Chargement config ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/gift-cards/config")
      .then((r) => r.json())
      .then((data: GiftCardConfig) => {
        setConfig(data);
        if (Array.isArray(data.presets) && data.presets.length > 0) {
          setAmount(data.presets[0]);
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Instance Stripe créée à partir de la clé publique renvoyée par la config.
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (config?.stripeConfigured && config.stripePublishableKey) {
      return loadStripe(config.stripePublishableKey);
    }
    return null;
  }, [config?.stripeConfigured, config?.stripePublishableKey]);

  // ── Validation étape details ────────────────────────────────────
  function validateDetails(): string | null {
    if (!config) return "Configuration indisponible.";
    if (amount < config.min || amount > config.max) {
      return `Le montant doit être entre ${config.min}€ et ${config.max}€.`;
    }
    if (!purchaser.name.trim()) return "Votre nom est requis.";
    if (!emailRe.test(purchaser.email.trim())) return "Votre email est invalide.";
    if (recipient.email.trim() && !emailRe.test(recipient.email.trim())) {
      return "L'email du destinataire est invalide.";
    }
    return null;
  }

  async function goToPayment() {
    if (!config) return;
    const err = validateDetails();
    if (err) {
      setDetailsError(err);
      return;
    }
    setDetailsError(null);
    setPaymentError(null);

    // Mode test : pas de PaymentIntent, on simule le paiement à l'étape suivante.
    if (!config.stripeConfigured) {
      setStep("payment");
      return;
    }

    // Mode réel : on crée le PaymentIntent (metadata acheteur/destinataire côté API).
    setLoading(true);
    try {
      const res = await fetch("/api/gift-cards/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          purchaser: { name: purchaser.name.trim(), email: purchaser.email.trim() },
          recipient: {
            name: recipient.name.trim() || undefined,
            email: recipient.email.trim() || undefined,
            message: recipient.message.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDetailsError(data.error || "Erreur lors de l'initialisation du paiement.");
        return;
      }
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setDetailsError("Erreur lors de l'initialisation du paiement.");
    } finally {
      setLoading(false);
    }
  }

  // ── Finalisation (commune mode réel / mode test) ────────────────
  async function finalizePurchase(stripePaymentIntentId: string) {
    if (processingRef.current || !config) return;
    processingRef.current = true;
    setProcessing(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          purchaser: { name: purchaser.name.trim(), email: purchaser.email.trim() },
          recipient: {
            name: recipient.name.trim() || undefined,
            email: recipient.email.trim() || undefined,
            message: recipient.message.trim() || undefined,
          },
          stripePaymentIntentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || "Erreur lors de l'achat.");
        return;
      }
      setResult(data as PurchaseResult);
      setStep("confirmation");
    } catch {
      setPaymentError("Erreur lors de l'achat.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }

  function handleTestPay() {
    const id = `pi_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    void finalizePurchase(id);
  }

  function backToDetails() {
    setStep("details");
    setClientSecret(null);
    setPaymentError(null);
  }

  // ── États chargement / indisponible ─────────────────────────────
  if (configLoading) {
    return (
      <div className="bg-[var(--brand-cream)]/30 min-h-[70vh] flex items-center justify-center">
        <p className="font-serif italic text-gray-500">Chargement…</p>
      </div>
    );
  }

  if (!config || !config.enabled) {
    return (
      <div className="bg-[var(--brand-cream)]/30 min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Gift
            className="w-12 h-12 text-[var(--brand-gold)] mx-auto mb-5"
            strokeWidth={1.25}
          />
          <h1 className="font-serif text-2xl text-gray-900 mb-3">
            Cartes cadeaux indisponibles
          </h1>
          <p className="font-serif italic text-[14px] text-gray-500">
            Les cartes cadeaux ne sont pas disponibles pour le moment. Revenez
            bientôt&nbsp;!
          </p>
        </div>
      </div>
    );
  }

  // ── Confirmation ────────────────────────────────────────────────
  if (step === "confirmation" && result) {
    return (
      <Confirmation
        result={result}
        shopName={config.shopName}
        template={config.template ?? undefined}
      />
    );
  }

  const canContinue = amount >= config.min && amount <= config.max;

  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh]">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] mb-6">
          <Gift className="w-6 h-6" strokeWidth={1.25} />
        </span>
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
          Offrir
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Une <span className="italic text-[var(--brand-gold)]">carte cadeau</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-7 mb-7" />
        <p className="font-serif italic text-[15px] text-gray-600 leading-relaxed max-w-xl mx-auto">
          Le cadeau idéal&nbsp;: un montant, un code unique, et votre proche
          choisit librement ce qui lui fait plaisir.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Steps */}
        <div className="flex items-center gap-5 mb-10 max-w-xs mx-auto">
          <StepDot
            label="Votre carte"
            active={step === "details"}
            done={step === "payment"}
            number={1}
          />
          <span
            className={`flex-1 h-px ${
              step === "payment" ? "bg-[var(--brand-gold)]/40" : "bg-gray-200"
            }`}
          />
          <StepDot label="Paiement" active={step === "payment"} done={false} number={2} />
        </div>

        {/* ── ÉTAPE DETAILS ─────────────────────────────────────── */}
        {step === "details" && (
          <div className="space-y-8">
            {/* Montant */}
            <Card eyebrow="Montant" title="Quel montant souhaitez-vous offrir ?">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {config.presets.map((p) => {
                  const selected = !isCustom && amount === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setCustomAmount("");
                        setAmount(p);
                        setDetailsError(null);
                      }}
                      className={`relative py-5 px-2 text-center border transition ${
                        selected
                          ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/5"
                          : "border-gray-200 hover:border-[var(--brand-gold)]/40"
                      }`}
                    >
                      <span className="block font-serif text-2xl text-gray-900">
                        {eur(p)}
                      </span>
                      {selected && (
                        <span className="absolute top-2 right-2 text-[var(--brand-gold)]">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                  Ou un montant personnalisé
                </label>
                <div className="relative max-w-[200px]">
                  <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={isCustom ? customAmount : ""}
                    onFocus={() => setIsCustom(true)}
                    onChange={(e) => {
                      setIsCustom(true);
                      setCustomAmount(e.target.value);
                      setAmount(parseFloat(e.target.value) || 0);
                      setDetailsError(null);
                    }}
                    placeholder={`${config.min} – ${config.max}`}
                    className={`w-full px-0 py-2.5 bg-transparent border-0 border-b text-[15px] text-gray-900 focus:ring-0 outline-none transition ${
                      isCustom
                        ? "border-[var(--brand-gold)]"
                        : "border-gray-200 focus:border-[var(--brand-gold)]"
                    }`}
                  />
                  <span className="absolute right-0 top-2.5 text-gray-400">€</span>
                </div>
              </div>
            </Card>

            {/* Acheteur */}
            <Card eyebrow="Vous concernant" title="Vos coordonnées">
              <p className="font-serif italic text-[13px] text-gray-500 mb-6">
                Vous recevrez une confirmation d&apos;achat avec le code de la carte.
              </p>
              <div className="space-y-6">
                <Field
                  label="Votre nom"
                  required
                  value={purchaser.name}
                  onChange={(v) => setPurchaser({ ...purchaser, name: v })}
                />
                <Field
                  label="Votre email"
                  type="email"
                  required
                  placeholder="vous@exemple.com"
                  value={purchaser.email}
                  onChange={(v) => setPurchaser({ ...purchaser, email: v })}
                />
              </div>
            </Card>

            {/* Destinataire */}
            <Card eyebrow="Optionnel" title="Pour qui est cette carte ?">
              <p className="font-serif italic text-[13px] text-gray-500 mb-6">
                Renseignez le destinataire pour personnaliser la carte. Sinon, le
                code vous sera envoyé et vous pourrez le transmettre vous-même.
              </p>
              <div className="space-y-6">
                <Field
                  label="Nom du destinataire"
                  value={recipient.name}
                  onChange={(v) => setRecipient({ ...recipient, name: v })}
                />
                <Field
                  label="Email du destinataire"
                  type="email"
                  value={recipient.email}
                  onChange={(v) => setRecipient({ ...recipient, email: v })}
                />
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Un petit mot (optionnel)
                  </label>
                  <textarea
                    value={recipient.message}
                    maxLength={200}
                    rows={3}
                    onChange={(e) =>
                      setRecipient({ ...recipient, message: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition resize-none"
                    placeholder="Joyeux anniversaire…"
                  />
                  <p className="text-[11px] text-gray-400 text-right mt-1">
                    {recipient.message.length}/200
                  </p>
                </div>
              </div>
            </Card>

            {/* Récap + CTA */}
            <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">
                Total
              </span>
              <span className="font-serif text-2xl text-gray-900">
                {amount > 0 ? eur(amount) : "—"}
              </span>
            </div>

            {detailsError && (
              <p className="text-[13px] text-red-600 font-serif italic text-center">
                {detailsError}
              </p>
            )}

            <button
              onClick={() => void goToPayment()}
              disabled={loading || !canContinue}
              className="w-full inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Préparation du paiement…"
              ) : (
                <>
                  Continuer vers le paiement <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── ÉTAPE PAYMENT ─────────────────────────────────────── */}
        {step === "payment" && (
          <div className="space-y-6">
            <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-1">
                Carte cadeau de
              </p>
              <p className="font-serif text-3xl text-[var(--brand-gold-dark)]">
                {eur(amount)}
              </p>
              {recipient.name && (
                <p className="font-serif italic text-[13px] text-gray-500 mt-1">
                  Pour {recipient.name}
                </p>
              )}
            </div>

            {/* MODE RÉEL */}
            {config.stripeConfigured && stripePromise && clientSecret && (
              <Card eyebrow="Sécurisé" title="Paiement par carte">
                <Elements
                  stripe={stripePromise}
                  options={
                    {
                      clientSecret,
                      appearance: {
                        theme: "flat",
                        variables: {
                          colorPrimary: "#b8923c",
                          colorBackground: "#ffffff",
                          colorText: "#111827",
                          colorDanger: "#b91c1c",
                          fontFamily: "ui-sans-serif, system-ui, sans-serif",
                          borderRadius: "0px",
                          spacingUnit: "4px",
                        },
                      },
                    } as StripeElementsOptions
                  }
                >
                  <PaymentForm
                    amount={amount}
                    processing={processing}
                    onSuccess={finalizePurchase}
                    onBack={backToDetails}
                  />
                </Elements>
                {paymentError && (
                  <p className="text-[13px] text-red-600 font-serif italic mt-4">
                    {paymentError}
                  </p>
                )}
                <p className="font-serif italic text-[12px] text-gray-400 mt-6 text-center">
                  Carte de test Stripe : 4242 4242 4242 4242 · date future · CVC au
                  choix.
                </p>
              </Card>
            )}

            {/* MODE TEST */}
            {!config.stripeConfigured && (
              <Card eyebrow="Mode test" title="Paiement simulé">
                <div className="flex items-start gap-3 bg-[var(--brand-gold)]/5 border border-[var(--brand-gold)]/20 px-4 py-4 mb-6">
                  <FlaskConical
                    size={18}
                    className="text-[var(--brand-gold)] shrink-0 mt-0.5"
                  />
                  <p className="font-serif italic text-[13px] text-gray-600 leading-relaxed">
                    Stripe n&apos;est pas encore branché sur cette boutique. Aucune
                    transaction ne sera effectuée&nbsp;: une vraie carte cadeau sera
                    tout de même créée pour vous permettre de tester le parcours.
                  </p>
                </div>

                {paymentError && (
                  <p className="text-[13px] text-red-600 font-serif italic mb-4">
                    {paymentError}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={backToDetails}
                    disabled={processing}
                    className="px-5 py-4 border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/5 transition disabled:opacity-60"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPay}
                    disabled={processing}
                    className="flex-1 inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      "Création de la carte…"
                    ) : (
                      <>
                        Payer {eur(amount)} <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck size={13} />
              <span>
                {config.stripeConfigured
                  ? "Paiement sécurisé par Stripe."
                  : "Environnement de test — aucun débit réel."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Avantages + vérification de solde (uniquement à l'étape details) */}
      {step === "details" && (
        <>
          <section className="bg-white border-t border-[var(--brand-gold)]/15 py-14 px-4">
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                {
                  icon: Mail,
                  title: "Livraison instantanée",
                  desc: "Le code est envoyé par email immédiatement après l'achat.",
                },
                {
                  icon: Clock,
                  title: "Valable un an",
                  desc: "Un code unique à utiliser en une fois, sans précipitation.",
                },
                {
                  icon: Heart,
                  title: "Un cadeau qui plaît",
                  desc: "Votre proche choisit librement ce qui lui fait envie.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title}>
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--brand-gold)]/25 text-[var(--brand-gold)] mb-4">
                    <Icon size={18} strokeWidth={1.5} />
                  </span>
                  <h3 className="font-serif text-[15px] text-gray-900 mb-1.5">
                    {title}
                  </h3>
                  <p className="font-serif italic text-[13px] text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <BalanceChecker />
        </>
      )}
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────────
function Confirmation({
  result,
  shopName,
  template,
}: {
  result: PurchaseResult;
  shopName: string;
  template?: GiftCardTemplate;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh] py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-7">
          <Check size={22} strokeWidth={1.5} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">
          C&apos;est cadeau
        </p>
        <h1 className="font-serif text-4xl text-gray-900 leading-[1.05] mb-6">
          Carte <span className="italic text-[var(--brand-gold)]">prête</span>
        </h1>
        <p className="font-serif italic text-[15px] text-gray-600 mb-10 max-w-md mx-auto">
          Votre carte cadeau de{" "}
          <span className="not-italic font-medium text-gray-900">
            {eur(result.amount)}
          </span>{" "}
          est créée.
          {result.recipient?.email
            ? ` Un email a été envoyé à ${result.recipient.email}.`
            : " Le code vous a été envoyé par email."}
        </p>

        {result.testMode && (
          <div className="bg-[var(--brand-gold)]/5 border border-[var(--brand-gold)]/25 px-5 py-3 mb-8 text-[12px] uppercase tracking-[0.2em] text-[var(--brand-gold-dark)]">
            Mode test : aucune transaction réelle n&apos;a eu lieu.
          </div>
        )}

        <div className="mb-8">
          <GiftCardVisual
            shopName={shopName}
            amount={result.amount}
            code={result.code}
            recipientName={result.recipient?.name}
            message={result.recipient?.message}
            expiresAt={result.expiresAt}
            template={template}
          />
        </div>

        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 mb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">
            Code de la carte
          </p>
          <p className="font-mono text-2xl font-bold tracking-[0.18em] text-gray-900 mb-3">
            {result.code}
          </p>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(result.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.2em] border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/5 transition"
          >
            {copied ? (
              <>
                <Check size={13} /> Copié&nbsp;!
              </>
            ) : (
              <>
                <Copy size={13} /> Copier le code
              </>
            )}
          </button>
        </div>

        {result.recipient?.name && (
          <p className="font-serif italic text-[13px] text-gray-500 mb-8">
            Le code peut être transmis à {result.recipient.name}.
          </p>
        )}

        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            Découvrir la boutique <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Formulaire de paiement Stripe (mode réel) ─────────────────────
function PaymentForm({
  amount,
  processing,
  onSuccess,
  onBack,
}: {
  amount: number;
  processing: boolean;
  onSuccess: (stripePaymentIntentId: string) => Promise<void>;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/cartes-cadeaux`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Erreur lors du paiement.");
      setSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      await onSuccess(result.paymentIntent.id);
      setSubmitting(false);
    } else {
      setError("Paiement non finalisé. Merci de réessayer.");
      setSubmitting(false);
    }
  }

  const busy = submitting || processing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <p className="text-[13px] text-red-600 font-serif italic">{error}</p>
      )}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="px-5 py-4 border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/5 transition disabled:opacity-60"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          type="submit"
          disabled={!stripe || busy}
          className="flex-1 inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            "Paiement en cours…"
          ) : (
            <>
              Payer {eur(amount)} <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Vérification de solde ─────────────────────────────────────────
function BalanceChecker() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const res = await fetch("/api/gift-cards/check-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Carte introuvable");
        return;
      }
      setBalance(data.balance);
    } catch {
      setError("Carte introuvable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-[var(--brand-cream)]/30 border-t border-[var(--brand-gold)]/15 py-14 px-4">
      <div className="max-w-md mx-auto text-center">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--brand-gold)]/25 text-[var(--brand-gold)] mb-5">
          <Search size={18} strokeWidth={1.5} />
        </span>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
          Déjà une carte&nbsp;?
        </p>
        <h2 className="font-serif text-2xl text-gray-900 mb-3">
          Vérifier le solde
        </h2>
        <p className="font-serif italic text-[13px] text-gray-500 mb-8">
          Saisissez le code de votre carte cadeau pour consulter son solde
          disponible.
        </p>

        <form onSubmit={check} className="flex items-stretch gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
              setBalance(null);
            }}
            placeholder="GC-XXXX-XXXX"
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-[15px] font-mono tracking-[0.12em] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-6 bg-[var(--brand-gold)] text-white text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "…" : "Vérifier"}
          </button>
        </form>

        {balance !== null && (
          <div className="mt-6 bg-white border border-[var(--brand-gold)]/25 px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
              Solde disponible
            </p>
            <p className="font-serif text-3xl text-[var(--brand-gold-dark)]">
              {eur(balance)}
            </p>
          </div>
        )}
        {error && (
          <p className="mt-6 text-[13px] text-red-600 font-serif italic">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Sous-composants partagés ──────────────────────────────────────
function StepDot({
  label,
  active,
  done,
  number,
}: {
  label: string;
  active: boolean;
  done: boolean;
  number: number;
}) {
  const colorClass = active
    ? "text-[var(--brand-gold)]"
    : done
    ? "text-[var(--brand-gold)]/60"
    : "text-gray-400";
  const dotClass = active
    ? "bg-[var(--brand-gold)] text-white border-[var(--brand-gold)]"
    : done
    ? "bg-white text-[var(--brand-gold)] border-[var(--brand-gold)]"
    : "bg-white text-gray-400 border-gray-200";
  return (
    <div className={`flex items-center gap-3 ${colorClass}`}>
      <span
        className={`w-7 h-7 rounded-full border flex items-center justify-center text-[12px] font-serif ${dotClass}`}
      >
        {done ? <Check size={12} strokeWidth={2} /> : number}
      </span>
      <span className="text-[11px] uppercase tracking-[0.3em] font-medium hidden sm:inline">
        {label}
      </span>
    </div>
  );
}

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-7">
      <div className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
          {eyebrow}
        </p>
        <h2 className="font-serif text-2xl text-gray-900 leading-none">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
        {label}
        {required && <span className="text-[var(--brand-gold)] ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
      />
    </div>
  );
}
