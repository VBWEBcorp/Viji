import Link from "next/link";

import Footer from "@/components/shop/Footer";
import Header from "@/components/shop/Header";

/**
 * Page 404.
 *
 * Clin d'œil à la box : ce qui n'y est pas, on ne le cuisine pas. Le header et
 * le footer sont repris ici parce qu'ils vivent dans le layout de (shop) :
 * une adresse inconnue n'y passe pas.
 */

const sorties = [
  { href: "/kits", label: "Les box" },
  { href: "/ateliers", label: "Les ateliers" },
  { href: "/traiteur", label: "Traiteur" },
  { href: "/cartes-cadeaux", label: "Carte cadeau" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-gold)]">
            Erreur 404
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
            Cette page n&apos;était pas
            <span className="block text-[var(--brand-gold)]">dans la box</span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-pretty text-[17px] leading-relaxed text-foreground/70">
            L&apos;adresse demandée n&apos;existe pas, ou elle a changé. Les
            épices, elles, sont toujours à leur place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--brand-gold)] px-7 text-[0.95rem] font-medium text-white transition-colors hover:bg-[var(--brand-gold-dark)]"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/kits"
              className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/25 px-7 text-[0.95rem] font-medium text-foreground transition-colors hover:bg-foreground hover:text-white"
            >
              Découvrir les box
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {sorties.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-sm text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
