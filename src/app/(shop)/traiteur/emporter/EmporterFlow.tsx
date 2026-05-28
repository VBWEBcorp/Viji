"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Minus, Plus, X, ClipboardList, ShieldCheck } from "lucide-react";
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

export type Dish = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  image?: string;
  servings?: string;
  /** Section dans la carte (Entrée, Plats, Boissons…). */
  section?: string;
  sectionOrder?: number;
};

/** Ordre canonique d'affichage des sections (sections en dehors → fin). */
const SECTION_ORDER = [
  "Entrée",
  "Plats",
  "Accompagnement",
  "Condiment",
  "Dessert",
  "Boissons",
];

interface Props {
  items: Dish[];
}

type SelectedDish = { dish: Dish; qty: number };

const LUNCH_SLOTS = ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45"];
const DINNER_SLOTS = [
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45",
];

function formatEUR(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function EmporterFlow({ items }: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Plats groupés par section (ordre canonique puis ordre custom).
  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const i of items) {
      const key = i.section || "Autres";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    const ordered: { section: string; dishes: Dish[] }[] = [];
    for (const s of SECTION_ORDER) {
      if (map.has(s)) ordered.push({ section: s, dishes: map.get(s)! });
    }
    for (const [s, dishes] of map) {
      if (!SECTION_ORDER.includes(s)) ordered.push({ section: s, dishes });
    }
    return ordered;
  }, [items]);

  // Filtre par section via dropdown. "all" = toute la carte.
  const [filterSection, setFilterSection] = useState<string>("all");
  const visibleGroups = useMemo(() => {
    if (filterSection === "all") return grouped;
    return grouped.filter((g) => g.section === filterSection);
  }, [grouped, filterSection]);

  // Selection : Map dish._id → SelectedDish
  const [selection, setSelection] = useState<Record<string, SelectedDish>>({});
  const selectedEntries = Object.values(selection);
  const selectionTotal = selectedEntries.reduce(
    (sum, e) => sum + e.dish.price * e.qty,
    0
  );

  function addDish(dish: Dish) {
    setSelection((sel) => {
      const existing = sel[dish._id];
      return {
        ...sel,
        [dish._id]: { dish, qty: existing ? existing.qty + 1 : 1 },
      };
    });
    // Plus de toast — le récap sticky en bas fait office de feedback visuel.
  }

  function incQty(id: string) {
    setSelection((sel) =>
      sel[id] ? { ...sel, [id]: { ...sel[id], qty: sel[id].qty + 1 } } : sel
    );
  }

  function decQty(id: string) {
    setSelection((sel) => {
      if (!sel[id]) return sel;
      if (sel[id].qty <= 1) {
        const { [id]: _removed, ...rest } = sel;
        void _removed;
        return rest;
      }
      return { ...sel, [id]: { ...sel[id], qty: sel[id].qty - 1 } };
    });
  }

  function removeDish(id: string) {
    setSelection((sel) => {
      const { [id]: _removed, ...rest } = sel;
      void _removed;
      return rest;
    });
  }

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paiement : on passe à l'étape carte après validation du formulaire.
  const [paying, setPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amountDue, setAmountDue] = useState<number>(0);

  // Étape 1 → 2 : valide la commande puis crée l'intention de paiement.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedEntries.length === 0) {
      setError("Sélectionnez au moins un plat dans le menu ci-dessus.");
      return;
    }
    if (!pickupTime) {
      setError("Choisissez un créneau de retrait.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/traiteur/reservation/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedEntries.map((e) => ({ id: e.dish._id, quantity: e.qty })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue, réessayez.");
        setSubmitting(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setAmountDue(typeof data.amount === "number" ? data.amount : selectionTotal);
      setPaying(true);
      setSubmitting(false);
    } catch {
      setError("Erreur réseau, réessayez.");
      setSubmitting(false);
    }
  }

  // Étape 2 → 3 : appelée après confirmation du paiement par Stripe.
  async function finalizeReservation() {
    const res = await fetch("/api/traiteur/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        pickupDate,
        pickupTime,
        items: selectedEntries.map((e) => ({ id: e.dish._id, quantity: e.qty })),
        comment: comment.trim() || undefined,
        stripePaymentIntentId: paymentIntentId,
        website,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Le paiement a réussi mais l'enregistrement a échoué. Contactez-nous.");
      return;
    }
    setDone(true);
    setPaying(false);
  }

  const selectionCount = selectedEntries.reduce((sum, e) => sum + e.qty, 0);

  function scrollToReservation() {
    document.getElementById("reservation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ── Menu — grille compacte avec filtres section ───── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-3">
            La carte
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-tight">
            Plats <span className="italic text-[var(--brand-gold)]">à emporter</span>
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-serif italic text-[16px] md:text-[18px] text-gray-700 mb-2">
              La carte de la semaine est en cours de préparation.
            </p>
            <p className="text-[13px] text-gray-500 max-w-md mx-auto leading-relaxed">
              Contactez-nous directement pour connaître les plats du moment.
            </p>
          </div>
        ) : (
          <>
            {/* Filtre dropdown — visible au-dessus de la carte */}
            {grouped.length > 1 && (
              <div className="flex items-center justify-center gap-3 mb-10 md:mb-12">
                <label
                  htmlFor="section-filter"
                  className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium"
                >
                  Filtrer
                </label>
                <div className="relative">
                  <select
                    id="section-filter"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    style={{ accentColor: "var(--brand-gold)" }}
                    className="appearance-none bg-white border border-[var(--brand-gold)]/40 pl-4 pr-9 py-2 text-[13px] text-gray-900 font-medium focus:border-[var(--brand-gold)] focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]/30 transition cursor-pointer caret-[var(--brand-gold)]"
                  >
                    <option value="all">Toute la carte</option>
                    {grouped.map((g) => (
                      <option key={g.section} value={g.section}>
                        {g.section}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-gold)] text-[11px]"
                  >
                    ▾
                  </span>
                </div>
              </div>
            )}

            {visibleGroups.length === 0 ? (
              <p className="text-center py-10 font-serif italic text-[14px] text-gray-500">
                Aucun plat dans cette section pour le moment.
              </p>
            ) : (
              <div className="space-y-12 md:space-y-16">
                {visibleGroups.map(({ section, dishes }) => (
              <div key={section}>
                {/* Titre de section : filets dorés de chaque côté, comme une vraie carte */}
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <span className="flex-1 h-px bg-[var(--brand-gold)]/30" aria-hidden />
                  <h3 className="font-serif italic text-[18px] sm:text-[22px] md:text-[26px] text-[var(--brand-gold)] tracking-wide">
                    {section}
                  </h3>
                  <span className="flex-1 h-px bg-[var(--brand-gold)]/30" aria-hidden />
                </div>

                {/* Grille flex-wrap centrée : les sections à 1 plat sont
                    centrées au lieu d'être collées à gauche d'une grille vide. */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5">
                  {dishes.map((item) => {
                    const inSelection = selection[item._id];
                    return (
                      <article
                        key={item._id}
                        className={`w-[calc(50%-0.375rem)] sm:w-[200px] md:w-[220px] lg:w-[240px] bg-white border overflow-hidden flex flex-col transition ${
                          inSelection
                            ? "border-[var(--brand-gold)] shadow-[0_0_0_1px_var(--brand-gold)]"
                            : "border-[var(--brand-gold)]/15"
                        }`}
                      >
                        <div className="relative aspect-square bg-[var(--brand-cream)] overflow-hidden">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                            />
                          )}
                          {inSelection && (
                            <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-[var(--brand-gold)] text-white text-[11px] font-semibold shadow">
                              {inSelection.qty}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col px-3 py-3 sm:px-4 sm:py-4">
                          <h4 className="font-serif text-[13px] sm:text-[14px] md:text-[15px] leading-tight text-gray-900 mb-1">
                            {item.name}
                          </h4>
                          {item.shortDescription && (
                            <p className="text-[10.5px] sm:text-[11px] text-gray-500 leading-snug line-clamp-2 mb-2">
                              {item.shortDescription}
                            </p>
                          )}
                          <p className="font-serif text-[14px] sm:text-[15px] text-[var(--brand-gold)] font-semibold mb-3">
                            {formatEUR(item.price)}
                          </p>

                          {inSelection ? (
                            <div className="mt-auto w-full flex items-stretch bg-[var(--brand-gold)] text-white">
                              <button
                                type="button"
                                onClick={() => decQty(item._id)}
                                className="flex-1 flex items-center justify-center py-2 active:bg-[var(--brand-gold-dark)] transition"
                                aria-label={`Diminuer ${item.name}`}
                              >
                                <Minus size={14} strokeWidth={2.5} />
                              </button>
                              <span className="flex-1 flex items-center justify-center font-serif text-[14px] sm:text-[15px] font-semibold select-none border-x border-white/20">
                                {inSelection.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => incQty(item._id)}
                                className="flex-1 flex items-center justify-center py-2 active:bg-[var(--brand-gold-dark)] transition"
                                aria-label={`Augmenter ${item.name}`}
                              >
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addDish(item)}
                              className="mt-auto w-full inline-flex items-center justify-center gap-1.5 bg-[var(--brand-gold)] text-white py-2 px-3 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
                            >
                              Ajouter
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Formulaire de réservation ─────────────────────── */}
      <section
        id="reservation"
        className="bg-[var(--brand-cream)]/30 py-14 md:py-20 border-t border-[var(--brand-gold)]/15 scroll-mt-20"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-3">
              Réservation
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-tight mb-5">
              Passez <span className="italic text-[var(--brand-gold)]">commande</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed max-w-md mx-auto">
              Sélectionnez vos plats dans le menu ci-dessus, choisissez un créneau et indiquez vos coordonnées.
            </p>
          </div>

          <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
                  <Check size={20} strokeWidth={1.5} />
                </div>
                <p className="font-serif italic text-[18px] text-gray-800 mb-2">
                  Commande payée
                </p>
                <p className="text-[13px] text-gray-600 max-w-md mx-auto leading-relaxed">
                  Votre commande est réglée et confirmée. Un reçu de paiement vous a été envoyé par email. Présentez-vous au créneau choisi pour le retrait.
                </p>
              </div>
            ) : paying ? (
              <div className="space-y-6">
                <div className="bg-[var(--brand-cream)]/40 border border-[var(--brand-gold)]/15 px-6 py-5 text-center">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-1">
                    Montant à régler
                  </p>
                  <p className="font-serif text-3xl text-[var(--brand-gold-dark)]">
                    {formatEUR(amountDue)}
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
                        setPaying(false);
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Honeypot */}
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

                {/* Sélection de plats */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">
                    Votre sélection
                    <span className="text-[var(--brand-gold)] ml-1">*</span>
                  </label>

                  {selectedEntries.length === 0 ? (
                    <div className="border border-dashed border-[var(--brand-gold)]/30 bg-[var(--brand-cream)]/30 px-5 py-6 text-center">
                      <ClipboardList size={20} className="text-[var(--brand-gold)]/60 mx-auto mb-3" strokeWidth={1.5} />
                      <p className="text-[13px] text-gray-600 font-serif italic leading-relaxed">
                        Cliquez sur <span className="text-[var(--brand-gold)] font-medium not-italic">Réserver</span> sur les plats ci-dessus pour les ajouter à votre commande.
                      </p>
                    </div>
                  ) : (
                    <ul className="border border-[var(--brand-gold)]/15 divide-y divide-[var(--brand-gold)]/10">
                      {selectedEntries.map(({ dish, qty }) => (
                        <li key={dish._id} className="px-3 sm:px-4 py-3">
                          {/* Ligne du haut : photo + nom + retirer (×) */}
                          <div className="flex items-start gap-3 mb-2.5 sm:mb-3">
                            {dish.image && (
                              <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[var(--brand-cream)] overflow-hidden shrink-0">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-[14px] sm:text-[15px] text-gray-900 leading-tight">
                                {dish.name}
                              </p>
                              <p className="text-[11.5px] sm:text-[12px] text-gray-500 mt-0.5">
                                {formatEUR(dish.price)} l&apos;unité
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDish(dish._id)}
                              className="text-gray-400 hover:text-red-600 transition p-1.5 -mr-1.5 shrink-0"
                              aria-label="Retirer ce plat"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Ligne du bas : stepper à gauche + sous-total à droite */}
                          <div className="flex items-center justify-between pl-15 sm:pl-17">
                            <div className="flex items-center border border-[var(--brand-gold)]/30 bg-white">
                              <button
                                type="button"
                                onClick={() => decQty(dish._id)}
                                className="w-9 h-9 flex items-center justify-center text-[var(--brand-gold)] active:bg-[var(--brand-gold)] active:text-white transition"
                                aria-label="Diminuer"
                              >
                                <Minus size={13} strokeWidth={2} />
                              </button>
                              <span className="w-9 text-center text-[14px] text-gray-900 font-semibold select-none">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => incQty(dish._id)}
                                className="w-9 h-9 flex items-center justify-center text-[var(--brand-gold)] active:bg-[var(--brand-gold)] active:text-white transition"
                                aria-label="Augmenter"
                              >
                                <Plus size={13} strokeWidth={2} />
                              </button>
                            </div>
                            <span className="font-serif text-[15px] text-gray-900 font-medium">
                              {formatEUR(dish.price * qty)}
                            </span>
                          </div>
                        </li>
                      ))}

                      {/* Total */}
                      <li className="flex items-center justify-between px-3 sm:px-4 py-3 bg-[var(--brand-cream)]/40">
                        <span className="text-[11px] uppercase tracking-[0.25em] text-gray-500">
                          Total estimé
                        </span>
                        <span className="font-serif text-[18px] text-gray-900">
                          {formatEUR(selectionTotal)}
                        </span>
                      </li>
                    </ul>
                  )}
                </div>

                {/* Coordonnées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Nom complet" required value={name} onChange={setName} placeholder="Prénom Nom" autoComplete="name" />
                  <Field label="Téléphone" type="tel" required value={phone} onChange={setPhone} placeholder="06 ..." autoComplete="tel" />
                </div>

                <Field label="Email (optionnel)" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" autoComplete="email" />

                {/* Créneau */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                      Date de retrait <span className="text-[var(--brand-gold)] ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                      Créneau de retrait <span className="text-[var(--brand-gold)] ml-1">*</span>
                    </label>
                    <select
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition"
                    >
                      <option value="">Sélectionner…</option>
                      <optgroup label="Midi (12h – 14h)">
                        {LUNCH_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Soir (19h – 22h)">
                        {DINNER_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Allergies, préférences, demandes particulières."
                    className="w-full px-3 py-3 bg-transparent border border-gray-200 text-[14px] text-gray-800 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition placeholder:text-gray-300 leading-relaxed"
                  />
                </div>

                <p className="text-[12px] text-gray-500 leading-relaxed">
                  Retrait à <span className="text-gray-800">3 rue de la Libération, 35770 Vern-sur-Seiche</span>. Paiement en ligne sécurisé pour confirmer votre commande.
                </p>

                <button
                  type="submit"
                  disabled={submitting || selectedEntries.length === 0}
                  className="w-full inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Préparation du paiement…" : <>Commander et payer {formatEUR(selectionTotal)} <ArrowRight size={13} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Barre flottante de récap : visible mobile ET desktop
          dès qu'au moins un plat est sélectionné. Au clic, scroll vers
          le formulaire en bas de page. */}
      {!done && selectionCount > 0 && (
        <>
          {/* Espace en bas pour ne pas masquer le dernier contenu */}
          <div aria-hidden className="h-20" />

          <div
            className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--brand-gold)]/30 shadow-[0_-10px_30px_-15px_rgba(60,40,15,0.25)] animate-slide-up-fade"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={scrollToReservation}
              className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 pt-3 pb-3 text-left active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative w-10 h-10 bg-[var(--brand-gold)] text-white flex items-center justify-center shrink-0">
                  <ClipboardList size={18} strokeWidth={1.7} />
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-white border border-[var(--brand-gold)] text-[var(--brand-gold)] text-[10px] font-bold flex items-center justify-center">
                    {selectionCount}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 leading-none mb-1">
                    Ma sélection
                  </p>
                  <p className="font-serif text-[16px] text-gray-900 leading-none">
                    {selectionCount} {selectionCount > 1 ? "plats" : "plat"} · {formatEUR(selectionTotal)}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 bg-[var(--brand-gold)] text-white px-4 sm:px-5 py-2.5 sm:py-3 text-[11px] uppercase tracking-[0.22em] font-medium shrink-0 hover:bg-[var(--brand-gold-dark)] transition">
                Réserver
                <ArrowRight size={12} strokeWidth={2} />
              </span>
            </button>
          </div>
        </>
      )}
    </>
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
          {submitting ? "Paiement en cours…" : <>Payer {formatEUR(amountCents)} <ArrowRight size={13} /></>}
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
