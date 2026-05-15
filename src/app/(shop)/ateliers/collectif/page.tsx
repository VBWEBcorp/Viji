import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import AtelierSession from "@/models/AtelierSession";
import { getOccurrences, type AtelierOccurrence } from "@/lib/ateliers-collectifs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ateliers collectifs · cuisine indienne",
  description:
    "Sessions d'ateliers collectifs de cuisine indienne, à plusieurs participants. Dates et lieux à venir dans la région rennaise.",
};

function formatEUR(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

type SessionCard = {
  slug: string;
  shortTitle: string;
  image: string;
  price: number;
  occurrences: AtelierOccurrence[];
};

async function fetchSessions(): Promise<SessionCard[]> {
  try {
    await connectDB();
    const docs = await AtelierSession.find({ isActive: true })
      .sort({ dateISO: 1, order: 1, createdAt: 1 })
      .lean();
    return docs.map((d) => ({
      slug: d.slug,
      shortTitle: d.shortTitle,
      image: d.image,
      price: d.price,
      occurrences: getOccurrences(d),
    }));
  } catch {
    return [];
  }
}

export default async function AtelierCollectifIndex() {
  const sessions = await fetchSessions();

  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">
          Atelier collectif
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          Prochaines sessions
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          Réservez une session conviviale dans une cuisine partagée. Ingrédients, épices, matériel et tablier sont fournis.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-serif italic text-[16px] md:text-[18px] text-gray-700 mb-2">
              Aucune session ouverte pour le moment.
            </p>
            <p className="text-[13px] text-gray-500 max-w-md mx-auto leading-relaxed">
              Contactez-nous pour être informé de la prochaine session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 md:gap-10">
            {sessions.map((s) => {
              const first = s.occurrences[0];
              const extraCount = s.occurrences.length - 1;

              return (
                <article
                  key={s.slug}
                  className="bg-white border border-[var(--brand-gold)]/15 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/3] sm:aspect-[5/4] bg-[var(--brand-cream)] overflow-hidden">
                    <Image
                      src={s.image}
                      alt={s.shortTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                    />
                    {extraCount > 0 && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-[var(--brand-gold)] text-white text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-1">
                        +{extraCount} date{extraCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center text-center px-3 sm:px-5 py-4 sm:py-6">
                    {first && (
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[var(--brand-gold)] font-medium mb-2 sm:mb-3">
                        {first.date}
                      </p>
                    )}

                    <h2 className="font-serif text-[15px] sm:text-[17px] md:text-[19px] leading-tight text-gray-900 mb-1 sm:mb-2">
                      {s.shortTitle}
                    </h2>

                    {first && (
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3 sm:mb-4 leading-snug">
                        {first.location} · {first.schedule}
                      </p>
                    )}

                    <p className="font-serif text-[16px] sm:text-[18px] text-gray-900 mb-4 sm:mb-5">
                      {formatEUR(s.price)}
                    </p>

                    <Link
                      href={`/ateliers/collectif/${s.slug}`}
                      className="mt-auto w-full inline-flex items-center justify-center bg-[var(--brand-gold)] text-white py-2.5 sm:py-3 px-4 text-[11px] sm:text-[12px] uppercase tracking-[0.25em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
                    >
                      Réserver
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="text-center text-[12px] sm:text-[13px] text-gray-500 mt-12 max-w-xl mx-auto leading-relaxed font-serif italic">
          De nouvelles sessions seront annoncées prochainement à Rennes et dans ses alentours.
        </p>
      </div>
    </div>
  );
}
