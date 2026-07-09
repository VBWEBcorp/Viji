import Image from "next/image";
import DevisForm from "./DevisForm";
import { getContent } from "@/lib/content";

// Rendu dynamique : la page relit la photo à chaque visite pour que les
// modifications faites dans l'admin apparaissent immédiatement.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Traiteur événementiel",
  description:
    "Service traiteur indien pour vos événements privés : anniversaires, mariages, repas de famille.",
};

export default async function TraiteurEvenementielPage() {
  const t = await getContent();
  const HIGHLIGHTS = [
    { label: t("traiteur_evenementiel_hl1_label"), value: t("traiteur_evenementiel_hl1_value") },
    { label: t("traiteur_evenementiel_hl2_label"), value: t("traiteur_evenementiel_hl2_value") },
    { label: t("traiteur_evenementiel_hl3_label"), value: t("traiteur_evenementiel_hl3_value") },
    { label: t("traiteur_evenementiel_hl4_label"), value: t("traiteur_evenementiel_hl4_value") },
  ];
  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">{t("traiteur_evenementiel_eyebrow")}</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          {t("traiteur_evenementiel_title")}
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          {t("traiteur_evenementiel_subtitle")}
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)] mb-8">
            <Image
              src={t("traiteur_evenementiel_image")}
              alt="Plateau traiteur indien"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-2 text-[14px] text-gray-700">
            {HIGHLIGHTS.map((h, i) => (
              <p key={i}>
                <strong className="text-gray-900">{h.label}&nbsp;:</strong> {h.value}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[14px] uppercase tracking-[0.2em] text-[var(--brand-gold)] mb-5 pb-3 border-b border-[var(--brand-gold)]/30">
            {t("traiteur_evenementiel_devis_title")}
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
            {t("traiteur_evenementiel_devis_intro")}
          </p>
          <DevisForm />
        </div>
      </div>
    </div>
  );
}
