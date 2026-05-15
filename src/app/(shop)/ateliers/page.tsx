import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Ateliers cuisine indienne",
  description:
    "Ateliers de cuisine indienne à Rennes et alentours. Plusieurs formules : à domicile, collectif ou cheffe privée.",
};

type Atelier = {
  slug: string;
  title: string;
  image: string;
  /** Lieu affiché sous le titre (« à Rennes », « chez vous »…). */
  location: string;
  /** Prix en centimes, ou null pour « sur devis ». */
  price: number | null;
};

const ATELIERS: Atelier[] = [
  {
    slug: "a-domicile",
    title: "Atelier cuisine indienne à domicile",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=1100&fit=crop",
    location: "Chez vous · Rennes et alentours",
    price: 6000,
  },
  {
    slug: "collectif",
    title: "Atelier cuisine indienne collectif",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&h=1100&fit=crop",
    location: "En groupe · région rennaise",
    price: 6000,
  },
  {
    slug: "chef-prive",
    title: "Cheffe privée à domicile",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&h=1100&fit=crop",
    location: "Chez vous · service traiteur",
    price: null,
  },
];

function formatEUR(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function AteliersIndex() {
  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">
          Ateliers
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          Cuisine indienne
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          Apprenez les bases, les épices et les gestes. Plusieurs lieux disponibles à Rennes et alentours.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 md:gap-10">
          {ATELIERS.map((a) => (
            <article
              key={a.slug}
              className="bg-white border border-[var(--brand-gold)]/15 overflow-hidden flex flex-col"
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] sm:aspect-[5/4] bg-[var(--brand-cream)] overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                />
              </div>

              {/* Bloc contenu */}
              <div className="flex-1 flex flex-col items-center text-center px-3 sm:px-5 py-4 sm:py-6">
                <h2 className="font-serif text-[15px] sm:text-[17px] md:text-[19px] leading-tight text-[var(--brand-gold)] mb-2 sm:mb-3">
                  {a.title}
                </h2>

                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-3 sm:mb-4 leading-snug">
                  {a.location}
                </p>

                <p className="font-serif text-[16px] sm:text-[18px] text-gray-900 mb-4 sm:mb-5">
                  {a.price === null ? "Sur devis" : formatEUR(a.price)}
                </p>

                <Link
                  href={`/ateliers/${a.slug}`}
                  className="mt-auto w-full inline-flex items-center justify-center bg-[var(--brand-gold)] text-white py-2.5 sm:py-3 px-4 text-[11px] sm:text-[12px] uppercase tracking-[0.25em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
                >
                  Réserver
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Mention multi-lieux à venir */}
        <p className="text-center text-[12px] sm:text-[13px] text-gray-500 mt-12 max-w-xl mx-auto leading-relaxed font-serif italic">
          De nouveaux lieux d&apos;ateliers seront annoncés prochainement à Rennes et dans ses alentours.
        </p>
      </div>
    </div>
  );
}
