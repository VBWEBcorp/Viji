"use client";

import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { formatPrice } from "@/lib/utils";
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
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import GiftCardVisual, { type GiftCardTemplate } from "@/components/shop/GiftCardVisual";

const stripePromise: Promise<Stripe | null> | null =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

const MIN = 5;
const MAX = 500;

interface Preset {
  amount: number; // centimes
  label?: string;
}

type Step = "details" | "payment" | "confirmation";

interface PurchaseResult {
  code: string;
  amount: number; // centimes
  recipient?: { name?: string; email?: string; message?: string };
  expiresAt?: string | null;
}

export default function GiftCardPurchasePage() {
  usePageTitle("Carte cadeau");

  const [configLoading, setConfigLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [shopName, setShopName] = useState("Ma Boutique");
  const [template, setTemplate] = useState<GiftCardTemplate>({});

  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);

  // Montant (en euros, source de vérité)
  const [amountEuros, setAmountEuros] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [purchaser, setPurchaser] = useState({ firstName: "", lastName: "", email: "" });
  const [recipient, setRecipient] = useState({ firstName: "", email: "", message: "" });

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setEnabled(Boolean(data?.giftCards?.enabled));
        const ps: Preset[] = data?.giftCards?.presets || [];
        setPresets(ps);
        setShopName(data?.shopName || "Ma Boutique");
        setTemplate(data?.giftCards?.template || {});
        if (ps.length > 0) setAmountEuros(ps[0].amount / 100);
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function validateDetails(): string | null {
    if (amountEuros < MIN || amountEuros > MAX) {
      return `Le montant doit être entre ${MIN} € et ${MAX} €.`;
    }
    if (!purchaser.firstName.trim()) return "Votre prénom est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaser.email)) {
      return "Votre email est invalide.";
    }
    if (recipient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      return "L'email du destinataire est invalide.";
    }
    return null;
  }

  async function goToPayment() {
    const err = validateDetails();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gift-cards/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountEuros, email: purchaser.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'initialisation du paiement");
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  async function finalizePurchase() {
    const res = await fetch("/api/gift-cards/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountEuros,
        purchaser: {
          name: [purchaser.firstName.trim(), purchaser.lastName.trim()].filter(Boolean).join(" "),
          email: purchaser.email.trim(),
        },
        recipient: {
          name: recipient.firstName.trim() || undefined,
          email: recipient.email.trim() || undefined,
          message: recipient.message.trim() || undefined,
        },
        stripePaymentIntentId: paymentIntentId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erreur lors de la création de la carte");
      return;
    }
    setResult(data);
    setStep("confirmation");
  }

  // ── Loading / disabled states ────────────────────────────────
  if (configLoading) {
    return (
      <div className="bg-[var(--brand-cream)]/30 min-h-[70vh] flex items-center justify-center">
        <p className="font-serif italic text-gray-500">Chargement…</p>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="bg-[var(--brand-cream)]/30 min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Gift className="w-12 h-12 text-[var(--brand-gold)] mx-auto mb-5" strokeWidth={1.25} />
          <h1 className="font-serif text-2xl text-gray-900 mb-3">
            Cartes cadeaux indisponibles
          </h1>
          <p className="font-serif italic text-[14px] text-gray-500">
            Les cartes cadeaux ne sont pas disponibles pour le moment. Revenez bientôt&nbsp;!
          </p>
        </div>
      </div>
    );
  }

  // ── Confirmation ──────────────────────────────────────────────
  if (step === "confirmation" && result) {
    return <Confirmation result={result} shopName={shopName} template={template} />;
  }

  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh]">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] mb-6">
          <Gift className="w-6 h-6" strokeWidth={1.25} />
        </span>
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">Offrir</p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Une <span className="italic text-[var(--brand-gold)]">carte cadeau</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mx-auto mt-7 mb-7" />
        <p className="font-serif italic text-[15px] text-gray-600 leading-relaxed max-w-xl mx-auto">
          Le cadeau idéal&nbsp;: votre proche reçoit un code par email et choisit librement ce qui lui fait plaisir, au moment qui lui convient.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-4 pb-20">
        {/* Steps */}
        <div className="flex items-center gap-5 mb-10 max-w-xs mx-auto">
          <StepDot label="Votre carte" active={step === "details"} done={step === "payment"} number={1} />
          <span className={`flex-1 h-px ${step === "payment" ? "bg-[var(--brand-gold)]/40" : "bg-gray-200"}`} />
          <StepDot label="Paiement" active={step === "payment"} done={false} number={2} />
        </div>

        {step === "details" && (
          <div className="space-y-8">
            {/* Montant */}
            <Card eyebrow="Montant" title="Quel montant souhaitez-vous offrir ?">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {presets.map((p, i) => {
                  const selected = !isCustom && Math.round(amountEuros * 100) === p.amount;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setCustomAmount("");
                        setAmountEuros(p.amount / 100);
                      }}
                      className={`relative py-5 px-2 text-center border transition ${
                        selected
                          ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/5"
                          : "border-gray-200 hover:border-[var(--brand-gold)]/40"
                      }`}
                    >
                      <span className="block font-serif text-2xl text-gray-900">
                        {formatPrice(p.amount)}
                      </span>
                      {p.label && (
                        <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--brand-gold)] mt-1">
                          {p.label}
                        </span>
                      )}
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
                    min={MIN}
                    max={MAX}
                    value={isCustom ? customAmount : ""}
                    onFocus={() => setIsCustom(true)}
                    onChange={(e) => {
                      setIsCustom(true);
                      setCustomAmount(e.target.value);
                      setAmountEuros(parseFloat(e.target.value) || 0);
                    }}
                    placeholder={`${MIN} – ${MAX}`}
                    className={`w-full px-0 py-2.5 bg-transparent border-0 border-b text-[15px] text-gray-900 focus:ring-0 outline-none transition ${
                      isCustom ? "border-[var(--brand-gold)]" : "border-gray-200 focus:border-[var(--brand-gold)]"
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
                <div className="grid grid-cols-2 gap-6">
                  <Field label="Prénom" required value={purchaser.firstName} onChange={(v) => setPurchaser({ ...purchaser, firstName: v })} />
                  <Field label="Nom" value={purchaser.lastName} onChange={(v) => setPurchaser({ ...purchaser, lastName: v })} />
                </div>
                <Field label="Votre email" type="email" required placeholder="vous@exemple.com" value={purchaser.email} onChange={(v) => setPurchaser({ ...purchaser, email: v })} />
              </div>
            </Card>

            {/* Destinataire */}
            <Card eyebrow="Optionnel" title="Pour qui est cette carte ?">
              <p className="font-serif italic text-[13px] text-gray-500 mb-6">
                Renseignez l&apos;email du destinataire pour qu&apos;il reçoive directement le code avec votre message. Sinon, le code vous sera envoyé.
              </p>
              <div className="space-y-6">
                <Field label="Prénom du destinataire" value={recipient.firstName} onChange={(v) => setRecipient({ ...recipient, firstName: v })} />
                <Field label="Email du destinataire" type="email" value={recipient.email} onChange={(v) => setRecipient({ ...recipient, email: v })} />
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Un petit mot (optionnel)
                  </label>
                  <textarea
                    value={recipient.message}
                    maxLength={200}
                    rows={3}
                    onChange={(e) => setRecipient({ ...recipient, message: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition resize-none"
                    placeholder="Joyeux anniversaire…"
                  />
                  <p className="text-[11px] text-gray-400 text-right mt-1">{recipient.message.length}/200</p>
                </div>
              </div>
            </Card>

            {/* Récap + CTA */}
            <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">Total</span>
              <span className="font-serif text-2xl text-gray-900">
                {amountEuros > 0 ? formatPrice(Math.round(amountEuros * 100)) : "—"}
              </span>
            </div>

            <button
              onClick={() => void goToPayment()}
              disabled={loading || amountEuros < MIN}
              className="w-full inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Préparation du paiement…" : <>Continuer vers le paiement <ArrowRight size={13} /></>}
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-1">Carte cadeau de</p>
              <p className="font-serif text-3xl text-[var(--brand-gold-dark)]">
                {formatPrice(Math.round(amountEuros * 100))}
              </p>
              {recipient.firstName && (
                <p className="font-serif italic text-[13px] text-gray-500 mt-1">Pour {recipient.firstName}</p>
              )}
            </div>

            <Card eyebrow="Sécurisé" title="Paiement par carte">
              {!stripePromise && (
                <p className="font-serif italic text-[13px] text-red-600">
                  Clé publique Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
                </p>
              )}
              {stripePromise && clientSecret && (
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
                        rules: {
                          ".Input": { border: "1px solid #e5e7eb", padding: "10px 12px" },
                          ".Input:focus": { border: "1px solid #b8923c", boxShadow: "none" },
                          ".Label": {
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.3em",
                            color: "#6b7280",
                          },
                        },
                      },
                    } as StripeElementsOptions
                  }
                >
                  <PaymentForm
                    amountCents={Math.round(amountEuros * 100)}
                    onSuccess={finalizePurchase}
                    onBack={() => {
                      setStep("details");
                      setClientSecret(null);
                      setPaymentIntentId(null);
                    }}
                  />
                </Elements>
              )}
              <p className="font-serif italic text-[12px] text-gray-400 mt-6 text-center">
                Carte de test Stripe : 4242 4242 4242 4242 · date future · CVC au choix.
              </p>
            </Card>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck size={13} />
              <span>Paiement sécurisé par Stripe.</span>
            </div>
          </div>
        )}
      </div>

      {/* Avantages */}
      {step === "details" && (
        <section className="bg-white border-t border-[var(--brand-gold)]/15 py-14 px-4">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Mail, title: "Livraison instantanée", desc: "Le code est envoyé par email immédiatement après l'achat." },
              { icon: Clock, title: "Valable longtemps", desc: "Utilisable en une ou plusieurs fois, sans précipitation." },
              { icon: Heart, title: "Un cadeau qui plaît", desc: "Votre proche choisit librement ce qui lui fait envie." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--brand-gold)]/25 text-[var(--brand-gold)] mb-4">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <h3 className="font-serif text-[15px] text-gray-900 mb-1.5">{title}</h3>
                <p className="font-serif italic text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Confirmation({ result, shopName, template }: { result: PurchaseResult; shopName: string; template?: GiftCardTemplate }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-[var(--brand-cream)]/30 min-h-[80vh] py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-7">
          <Check size={22} strokeWidth={1.5} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">C&apos;est cadeau</p>
        <h1 className="font-serif text-4xl text-gray-900 leading-[1.05] mb-6">
          Carte <span className="italic text-[var(--brand-gold)]">prête</span>
        </h1>
        <p className="font-serif italic text-[15px] text-gray-600 mb-10 max-w-md mx-auto">
          Votre carte cadeau de <span className="not-italic font-medium text-gray-900">{formatPrice(result.amount)}</span> est créée.
          {result.recipient?.email
            ? ` Un email a été envoyé à ${result.recipient.email}.`
            : " Le code vous a été envoyé par email."}
        </p>

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

        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-5 mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Code carte cadeau</p>
          <p className="font-mono text-2xl font-bold tracking-[0.18em] text-gray-900 mb-3">{result.code}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.2em] border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/5 transition"
          >
            {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier le code</>}
          </button>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
        >
          Découvrir la boutique <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function PaymentForm({
  amountCents,
  onSuccess,
  onBack,
}: {
  amountCents: number;
  onSuccess: () => Promise<void>;
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

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/cartes-cadeaux` },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Erreur lors du paiement");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await onSuccess();
    } else {
      setError("Paiement non finalisé. Merci de réessayer.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-[13px] text-red-600 font-serif italic">{error}</p>}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="px-5 py-4 border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/5 transition disabled:opacity-60"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Paiement en cours…" : <>Payer {formatPrice(amountCents)} <ArrowRight size={13} /></>}
        </button>
      </div>
    </form>
  );
}

// ── Sous-composants partagés ──────────────────────────────────
function StepDot({ label, active, done, number }: { label: string; active: boolean; done: boolean; number: number }) {
  const colorClass = active ? "text-[var(--brand-gold)]" : done ? "text-[var(--brand-gold)]/60" : "text-gray-400";
  const dotClass = active
    ? "bg-[var(--brand-gold)] text-white border-[var(--brand-gold)]"
    : done
    ? "bg-white text-[var(--brand-gold)] border-[var(--brand-gold)]"
    : "bg-white text-gray-400 border-gray-200";
  return (
    <div className={`flex items-center gap-3 ${colorClass}`}>
      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-[12px] font-serif ${dotClass}`}>
        {done ? <Check size={12} strokeWidth={2} /> : number}
      </span>
      <span className="text-[11px] uppercase tracking-[0.3em] font-medium hidden sm:inline">{label}</span>
    </div>
  );
}

function Card({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-7">
      <div className="mb-7">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">{eyebrow}</p>
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
