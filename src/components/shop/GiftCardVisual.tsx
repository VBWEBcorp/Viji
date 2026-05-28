import { formatPrice } from "@/lib/utils";

export interface GiftCardTemplate {
  logoUrl?: string;
  primaryColor?: string; // accent (titres, montant)
  backgroundColor?: string; // fond de la carte
  backgroundImageUrl?: string;
  headline?: string;
  footerText?: string;
}

const DEFAULTS = {
  primary: "#b08438",
  primaryDark: "#8a6a2c",
  background: "#faf6ee",
  headline: "Carte cadeau",
};

/**
 * Visuel brandé d'une carte cadeau (HTML/CSS, sans dépendance externe).
 * Affiché sur la page de confirmation d'achat, le détail admin et l'aperçu réglages.
 * Le rendu est piloté par `template` (logo, couleurs, fond, textes) — valeurs
 * par défaut = charte dorée/crème.
 */
export default function GiftCardVisual({
  shopName,
  amount,
  code,
  recipientName,
  message,
  expiresAt,
  template,
}: {
  shopName: string;
  amount: number; // centimes
  code: string;
  recipientName?: string;
  message?: string;
  expiresAt?: string | Date | null;
  template?: GiftCardTemplate;
}) {
  const primary = template?.primaryColor || DEFAULTS.primary;
  const background = template?.backgroundColor || DEFAULTS.background;
  const headline = template?.headline || DEFAULTS.headline;
  const bgImage = template?.backgroundImageUrl;
  const logo = template?.logoUrl;
  const footer = template?.footerText;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div
      className="relative w-full max-w-md mx-auto overflow-hidden border"
      style={{
        borderColor: `${primary}4D`,
        background: bgImage
          ? `linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${bgImage}) center/cover`
          : `linear-gradient(135deg, #fffdf8 0%, ${background} 100%)`,
        color: bgImage ? "#fff" : undefined,
      }}
    >
      {/* Ornements discrets (seulement sans image de fond) */}
      {!bgImage && (
        <>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ background: `${primary}1A` }} />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full" style={{ background: `${primary}1A` }} />
        </>
      )}

      <div className="relative px-8 py-10 text-center">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={shopName} className="h-10 mx-auto mb-4 object-contain" />
        ) : (
          <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: bgImage ? "#fff" : primary }}>
            {shopName}
          </p>
        )}
        <p
          className="font-serif text-[13px] uppercase tracking-[0.25em] mb-1"
          style={{ color: bgImage ? "rgba(255,255,255,0.85)" : "#6b7280" }}
        >
          {headline}
        </p>
        {recipientName && (
          <p className="font-serif text-xl mt-2" style={{ color: bgImage ? "#fff" : "#111827" }}>
            Pour {recipientName}
          </p>
        )}
        <p className="font-serif text-5xl font-bold mt-3 mb-1" style={{ color: bgImage ? "#fff" : DEFAULTS.primaryDark }}>
          {formatPrice(amount)}
        </p>
        {message && (
          <p className="font-serif italic text-[13px] mt-2 mb-3" style={{ color: bgImage ? "rgba(255,255,255,0.9)" : "#6b7280" }}>
            «&nbsp;{message}&nbsp;»
          </p>
        )}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: bgImage ? "rgba(255,255,255,0.4)" : `${primary}40` }}>
          <p className="text-[9px] uppercase tracking-[0.3em] mb-1.5" style={{ color: bgImage ? "rgba(255,255,255,0.8)" : "#9ca3af" }}>
            Code
          </p>
          <p className="font-mono text-2xl font-bold tracking-[0.18em]" style={{ color: bgImage ? "#fff" : "#111827" }}>
            {code}
          </p>
        </div>
        {expiryLabel && (
          <p className="text-[10px] uppercase tracking-[0.2em] mt-4" style={{ color: bgImage ? "rgba(255,255,255,0.8)" : "#9ca3af" }}>
            Valable jusqu&apos;au {expiryLabel}
          </p>
        )}
        {footer && (
          <p className="text-[11px] mt-3" style={{ color: bgImage ? "rgba(255,255,255,0.85)" : "#6b7280" }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
