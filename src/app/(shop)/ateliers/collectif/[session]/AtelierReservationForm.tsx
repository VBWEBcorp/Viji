"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Calendar, MapPin, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise: Promise<Stripe | null> | null =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

type Occurrence = {
  date: string;
  schedule: string;
  location: string;
};

interface Props {
  sessionSlug: string;
  sessionTitle: string;
  /** Prix par personne, en centimes. */
  price: number;
  occurrences: Occurrence[];
}

type Step = "form" | "payment" | "done";

export default function AtelierReservationForm({
  sessionSlug,
  sessionTitle,
  price,
  occurrences,
}: Props) {
  const hasMultiple = occurrences.length > 1;

  // Sélection visuelle : index numérique de l'occurrence choisie.
  // Présélectionne la 1re si une seule option, sinon laisse vide pour forcer un choix.
  const [occIndex, setOccIndex] = useState<number | null>(hasMultiple ? null : 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paiement : créés au passage à l'étape « paiement ».
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amountDue, setAmountDue] = useState<number>(price);

  const totalEstimate = price * participants;

  // Étape 1 → 2 : valide le formulaire puis crée l'intention de paiement.
  async function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (occIndex === null) {
      setError("Choisissez une date.");
      return;
    }
    const chosen = occurrences[occIndex];
    if (!chosen) {
      setError("Date / lieu invalide.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ateliers/reservation/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionSlug, participants }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'initialisation du paiement.");
        setSubmitting(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setAmountDue(typeof data.amount === "number" ? data.amount : totalEstimate);
      setStep("payment");
      setSubmitting(false);
    } catch {
      setError("Erreur réseau, réessayez.");
      setSubmitting(false);
    }
  }

  // Étape 2 → 3 : appelée après confirmation du paiement par Stripe.
  // Enregistre la réservation (email au commerçant) une fois le paiement validé.
  async function finalizeReservation() {
    if (occIndex === null) return;
    const chosen = occurrences[occIndex];
    if (!chosen) return;

    const res = await fetch("/api/ateliers/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionSlug,
        sessionTitle,
        sessionDate: `${chosen.date} · ${chosen.schedule}`,
        sessionLocation: chosen.location,
        name,
        phone,
        email,
        participants,
        notes,
        stripePaymentIntentId: paymentIntentId,
        website,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Le paiement a réussi mais l'enregistrement a échoué. Contactez-nous.");
      return;
    }
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="text-center py-10 px-6 bg-[var(--brand-cream)]/50 border border-[var(--brand-gold)]/20">
        <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
          <Check size={20} strokeWidth={1.5} />
        </div>
        <p className="font-serif italic text-[18px] text-gray-800 mb-2">
          Réservation confirmée et payée
        </p>
        <p className="text-[13px] text-gray-600 max-w-md mx-auto leading-relaxed">
          Votre place est réservée. Un reçu de paiement et les détails pratiques vous ont été envoyés par email.
        </p>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="space-y-6">
        <div className="bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/15 px-6 py-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-1">
            {participants} {participants > 1 ? "participants" : "participant"}
          </p>
          <p className="font-serif text-3xl text-[var(--brand-gold-dark)]">
            {formatPrice(amountDue)}
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic">
            {error}
          </div>
        )}

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
                    colorPrimary: "#b08438",
                    colorBackground: "#ffffff",
                    colorText: "#111827",
                    colorDanger: "#b91c1c",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    borderRadius: "0px",
                    spacingUnit: "4px",
                  },
                  rules: {
                    ".Input": { border: "1px solid #e5e7eb", padding: "10px 12px" },
                    ".Input:focus": { border: "1px solid #b08438", boxShadow: "none" },
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
              amountCents={amountDue}
              onSuccess={finalizeReservation}
              onBack={() => {
                setStep("form");
                setClientSecret(null);
                setPaymentIntentId(null);
                setError(null);
              }}
            />
          </Elements>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck size={13} />
          <span>Paiement sécurisé par Stripe.</span>
        </div>
        <p className="font-serif italic text-[12px] text-gray-400 text-center">
          Carte de test : 4242 4242 4242 4242 · date future · CVC au choix.
        </p>
      </div>
    );
  }

  // ── Étape 1 : formulaire ──────────────────────────────────────
  return (
    <form onSubmit={goToPayment} className="space-y-6">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] w-px h-px"
        aria-hidden
      />

      {error && (
        <div className="px-4 py-3 border border-red-200 bg-red-50/50 text-red-700 text-[13px] font-serif italic">
          {error}
        </div>
      )}

      {/* Sélecteur de date — dropdown WooCommerce-style */}
      <div>
        <label
          htmlFor="atelier-date"
          className="block text-[13px] font-medium text-gray-800 mb-2"
        >
          Date :
          <span className="text-[var(--brand-gold)] ml-1">*</span>
        </label>
        <div className="relative">
          <select
            id="atelier-date"
            required
            value={occIndex === null ? "" : String(occIndex)}
            onChange={(e) =>
              setOccIndex(e.target.value === "" ? null : parseInt(e.target.value, 10))
            }
            className="appearance-none w-full bg-white border border-gray-300 px-4 py-3 pr-10 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20 outline-none transition rounded-sm"
          >
            <option value="">Choisir une option</option>
            {occurrences.map((o, i) => (
              <option key={i} value={String(i)}>
                {o.date} – {o.location}
              </option>
            ))}
          </select>
          {/* Chevron custom (since appearance-none) */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            ▾
          </span>
        </div>

        {/* Récap visuel sous le select une fois la date choisie */}
        {occIndex !== null && occurrences[occIndex] && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-700">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} strokeWidth={1.7} className="text-[var(--brand-gold)]" />
              {occurrences[occIndex].date} · {occurrences[occIndex].schedule}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.7} className="text-[var(--brand-gold)]" />
              {occurrences[occIndex].location}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          Nombre de personnes <span className="text-[var(--brand-gold)] ml-1">*</span>
        </label>
        <input
          type="number"
          required
          min={1}
          max={20}
          value={participants}
          onChange={(e) => setParticipants(parseInt(e.target.value, 10) || 1)}
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nom complet" required value={name} onChange={setName} placeholder="Prénom Nom" autoComplete="name" />
        <Field label="Téléphone" type="tel" required value={phone} onChange={setPhone} placeholder="06 ..." autoComplete="tel" />
      </div>

      <Field label="Email (optionnel)" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" autoComplete="email" />

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
          Notes / allergies (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Précisez vos restrictions, allergies, ou questions particulières."
          className="w-full px-3 py-3 bg-transparent border border-gray-200 text-[14px] text-gray-800 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300 leading-relaxed"
        />
      </div>

      {/* Récap montant */}
      <div className="flex items-center justify-between border-t border-[var(--brand-gold)]/15 pt-5">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">
          Total ({participants} × {formatPrice(price)})
        </span>
        <span className="font-serif text-2xl text-gray-900">{formatPrice(totalEstimate)}</span>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Préparation du paiement…" : <>Réserver et payer <ArrowRight size={13} /></>}
      </button>
    </form>
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
      confirmParams: { return_url: window.location.href },
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

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
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
        autoComplete={autoComplete}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300"
      />
    </div>
  );
}
