import Link from "next/link";

/**
 * Kit d'UI partagé pour l'administration — charte « Entre Maman et Moi »
 * (or, crème, serif, angles nets). À réutiliser sur toutes les pages admin
 * pour garantir une cohérence visuelle totale.
 */

/** En-tête de page : surtitre discret + titre serif + actions à droite. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-9">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{children}</div>
      )}
    </div>
  );
}

/** Bouton CTA doré (action principale). Rendu <button> ou <Link>. */
export function GoldButton({
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
  children,
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls =
    "inline-flex items-center justify-center gap-2 bg-[var(--brand-gold)] text-white text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-50 disabled:pointer-events-none " +
    className;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** Bouton secondaire (contour). */
export function GhostButton({
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
  children,
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls =
    "inline-flex items-center justify-center gap-2 border border-[var(--brand-gold)]/25 text-gray-600 text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)]/50 transition disabled:opacity-50 " +
    className;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

type Tone = "gold" | "green" | "amber" | "red" | "gray" | "blue";

const toneStyles: Record<Tone, string> = {
  gold: "border-[var(--brand-gold)]/30 text-[var(--brand-gold-dark)] bg-[var(--brand-cream)]/70",
  green: "border-emerald-200 text-emerald-700 bg-emerald-50",
  amber: "border-amber-200 text-amber-700 bg-amber-50",
  red: "border-red-200 text-red-600 bg-red-50",
  gray: "border-gray-200 text-gray-500 bg-gray-50",
  blue: "border-blue-200 text-blue-700 bg-blue-50",
};

/** Pastille de statut, style éditorial (petites capitales). */
export function Badge({
  tone = "gray",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] border ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}

/** Carte / surface standard de l'admin (angles nets, liseré doré discret). */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white border border-[var(--brand-gold)]/15 ${className}`}>
      {children}
    </div>
  );
}

/** État vide centré (icône cerclée dorée + texte + CTA optionnel). */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <p className="font-serif italic text-xl sm:text-2xl text-gray-900 mb-2">{title}</p>
      {description && <p className="text-[13px] text-gray-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
