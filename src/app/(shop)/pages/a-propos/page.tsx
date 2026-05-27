import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notre histoire · Entre Maman et Moi",
  description:
    "Mon projet est né dans la cuisine de ma maman. Découvrez l'histoire de Viji et la transmission qui a donné naissance à Entre Maman et Moi.",
};

const VIJI_PHOTO = "https://i.ibb.co/qLvzCsJS/Viji.jpg";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/50 py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-6">
            L&apos;histoire
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-900 leading-[1.05] mb-8">
            Découvrez{" "}
            <span className="italic text-[var(--brand-gold)]">mon histoire</span>
          </h1>
          <div className="w-16 h-px bg-[var(--brand-gold)]/50 mx-auto" />
        </div>
      </section>

      {/* ── PORTRAIT + INTRO ─────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-5">
            <div className="relative pl-8 sm:pl-10 pb-10 sm:pb-12">
              {/* Decorative gold offset frame */}
              <div className="absolute -bottom-3 right-3 sm:-bottom-4 sm:right-4 top-3 left-11 sm:top-4 sm:left-14 border border-[var(--brand-gold)]/40 pointer-events-none" />

              {/* Portrait — arched top */}
              <div
                className="relative aspect-[4/5] overflow-hidden"
                style={{ borderTopLeftRadius: "999px", borderTopRightRadius: "999px" }}
              >
                <Image
                  src={VIJI_PHOTO}
                  alt="Viji · Entre Maman et Moi"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>

            </div>
          </div>

          <div className="md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-6">
              Une cuisine, une transmission
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-[1.15] mb-10">
              Mon projet est né dans la{" "}
              <span className="italic text-[var(--brand-gold)]">
                cuisine de ma maman
              </span>
              , là où tout commençait par le parfum des épices.
            </h2>

            <div className="space-y-6 text-[15px] text-gray-700 leading-[1.85] max-w-xl">
              <p>
                Je plongeais mon nez dans les bocaux et les sachets d&apos;épices,
                pendant que les casseroles mijotaient et que leurs parfums se
                répandaient dans la pièce.
              </p>
              <p>
                Enfant, j&apos;observais chaque geste, chaque mélange, sans savoir
                que j&apos;apprenais bien plus que des recettes&nbsp;:
                j&apos;apprenais une façon d&apos;aimer, de partager, et même de
                faire naître l&apos;eau à la bouche dès la préparation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE 1 ──────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-12" />
          <p className="font-serif italic text-2xl md:text-4xl text-gray-900 leading-[1.3] mb-8">
            Avec{" "}
            <span className="text-[var(--brand-gold)] not-italic">
              Entre Maman et Moi
            </span>
            , j&apos;ai voulu rendre cette émotion accessible à tous, même à ceux
            qui pensent que la cuisine indienne est trop compliquée, trop longue
            ou réservée aux restaurants.
          </p>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto" />
        </div>
      </section>

      {/* ── L'EXPÉRIENCE KITS ────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-6 text-center">
            Les kits
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-[1.1] mb-12 text-center">
            Une invitation au{" "}
            <span className="italic text-[var(--brand-gold)]">voyage</span>,<br />
            sans quitter votre cuisine.
          </h2>

          <div className="space-y-6 text-[15px] text-gray-700 leading-[1.85]">
            <p>
              Avec Entre Maman et Moi, vous découvrez des recettes indiennes
              authentiques, pensées pour le quotidien&nbsp;: des ingrédients
              justes, des quantités maîtrisées, zéro gaspillage et un vrai gain
              de temps.
            </p>
            <p>
              Tout est expliqué, guidé, simplifié. Vous cuisinez à votre rythme,
              vous apprenez les bases, vous comprenez les épices, et
              surtout&nbsp;: vous prenez plaisir à cuisiner.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/kits/decouverte"
              className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
            >
              Voir les kits
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE 2 ──────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-12" />
          <p className="font-serif italic text-2xl md:text-4xl text-gray-900 leading-[1.3] mb-8">
            Entre Maman et Moi, ce n&apos;est pas seulement un kit ou un
            atelier&nbsp;: c&apos;est une{" "}
            <span className="text-[var(--brand-gold)] not-italic">
              histoire de transmission
            </span>
            , d&apos;émotion et de plaisir à table.
          </p>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto" />
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-14">
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
              Ma mission
            </p>
            <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-[1.1]">
              Trois engagements,
              <br />
              <span className="italic text-[var(--brand-gold)]">une même âme</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            <MissionPillar
              eyebrow="Voyage"
              title="Faire voyager vos papilles"
              text="En vous ouvrant aux saveurs authentiques de l'Inde."
            />
            <MissionPillar
              eyebrow="Lien"
              title="Créer du lien"
              text="En partageant des moments de convivialité, en famille, entre amis ou entre collègues."
            />
            <MissionPillar
              eyebrow="Héritage"
              title="Transmettre un héritage culinaire"
              text="Qui dépasse la simple cuisine pour devenir une expérience culturelle et humaine."
            />
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/50 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-6">
            Prêt·e à cuisiner&nbsp;?
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-[1.1] mb-10">
            Partageons un{" "}
            <span className="italic text-[var(--brand-gold)]">
              moment chaleureux
            </span>
            <br />
            autour d&apos;un plat sincère.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/kits/decouverte"
              className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
            >
              Découvrir les kits
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/ateliers/a-domicile"
              className="inline-flex items-center gap-2 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Voir les ateliers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MissionPillar({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center md:text-left">
      <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
        {eyebrow}
      </p>
      <h3 className="font-serif text-xl md:text-2xl text-gray-900 leading-tight mb-4">
        {title}
      </h3>
      <div className="w-8 h-px bg-[var(--brand-gold)]/40 mx-auto md:mx-0 mb-4" />
      <p className="font-serif italic text-[14px] text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
        {text}
      </p>
    </div>
  );
}
