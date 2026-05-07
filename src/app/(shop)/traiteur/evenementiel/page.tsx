import Image from "next/image";
import DevisForm from "./DevisForm";

export const metadata = {
  title: "Traiteur événementiel",
  description:
    "Service traiteur indien pour vos événements privés : anniversaires, mariages, repas de famille.",
};

const HIGHLIGHTS = [
  { label: "Format", value: "Anniversaires, mariages, repas privés" },
  { label: "Cuisine", value: "Indienne authentique, recettes familiales" },
  { label: "Service", value: "Devis sur mesure, dressage et présentation" },
  { label: "Zone", value: "Rennes et alentours" },
];

export default function TraiteurEvenementielPage() {
  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">Traiteur</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          Événementiel
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          Pour vos événements privés, devis sur mesure.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)] mb-8">
            <Image
              src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&h=1100&fit=crop"
              alt="Plateau traiteur indien"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-2 text-[14px] text-gray-700">
            {HIGHLIGHTS.map((h) => (
              <p key={h.label}>
                <strong className="text-gray-900">{h.label}&nbsp;:</strong> {h.value}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[14px] uppercase tracking-[0.2em] text-[var(--brand-gold)] mb-5 pb-3 border-b border-[var(--brand-gold)]/30">
            Demande de devis
          </h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
            Décrivez votre projet (date, nombre de personnes, lieu, préférences) et je reviens vers vous sous 48h.
          </p>
          <DevisForm />
        </div>
      </div>
    </div>
  );
}
