import { formatPrice } from "@/lib/utils";

/**
 * Visuel brandé d'une carte cadeau (HTML/CSS, sans dépendance externe).
 * Affiché sur la page de confirmation d'achat et dans le détail admin.
 */
export default function GiftCardVisual({
  shopName,
  amount,
  code,
  recipientName,
  message,
}: {
  shopName: string;
  amount: number; // centimes
  code: string;
  recipientName?: string;
  message?: string;
}) {
  return (
    <div
      className="relative w-full max-w-md mx-auto overflow-hidden border border-[var(--brand-gold)]/30"
      style={{
        background:
          "linear-gradient(135deg, #fffdf8 0%, var(--brand-cream) 100%)",
      }}
    >
      {/* Ornements discrets */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--brand-gold)]/10" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[var(--brand-gold)]/10" />

      <div className="relative px-8 py-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-4">
          {shopName}
        </p>
        <p className="font-serif text-[13px] uppercase tracking-[0.25em] text-gray-500 mb-1">
          Carte cadeau
        </p>
        {recipientName && (
          <p className="font-serif text-xl text-gray-900 mt-2">
            Pour {recipientName}
          </p>
        )}
        <p className="font-serif text-5xl font-bold text-[var(--brand-gold-dark)] mt-3 mb-1">
          {formatPrice(amount)}
        </p>
        {message && (
          <p className="font-serif italic text-[13px] text-gray-600 mt-2 mb-3">
            «&nbsp;{message}&nbsp;»
          </p>
        )}
        <div className="mt-5 pt-4 border-t border-[var(--brand-gold)]/25">
          <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-1.5">
            Code
          </p>
          <p className="font-mono text-2xl font-bold tracking-[0.18em] text-gray-900">
            {code}
          </p>
        </div>
      </div>
    </div>
  );
}
