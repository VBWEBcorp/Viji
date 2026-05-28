import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, ArrowLeft, ArrowDown } from "lucide-react";
import { connectDB } from "@/lib/db";
import AtelierSession from "@/models/AtelierSession";
import AtelierReservationForm from "./AtelierReservationForm";

export const dynamic = "force-dynamic";

function formatEUR(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

type Occurrence = {
  date: string;
  dateISO?: string;
  schedule: string;
  location: string;
};

type SessionDetail = {
  slug: string;
  title: string;
  image: string;
  intro: string;
  occurrences: Occurrence[];
  price: number;
  menu: string;
  program: { title: string; body: string }[];
  notes: { title: string; body: string }[];
};

async function fetchSession(slug: string): Promise<SessionDetail | null> {
  try {
    await connectDB();
    const doc = await AtelierSession.findOne({ slug, isActive: true }).lean();
    if (!doc) return null;

    // Calcule les occurrences depuis le tableau OU le fallback legacy.
    let occurrences: Occurrence[] = [];
    if (Array.isArray(doc.occurrences) && doc.occurrences.length > 0) {
      occurrences = doc.occurrences.map((o) => ({
        date: o.date,
        dateISO: o.dateISO || undefined,
        schedule: o.schedule,
        location: o.location,
      }));
    } else if (doc.date && doc.schedule && doc.location) {
      occurrences = [
        {
          date: doc.date,
          dateISO: doc.dateISO || undefined,
          schedule: doc.schedule,
          location: doc.location,
        },
      ];
    }

    return {
      slug: doc.slug,
      title: doc.title,
      image: doc.image,
      intro: doc.intro,
      occurrences,
      price: doc.price,
      menu: doc.menu,
      program: doc.program || [],
      notes: doc.notes || [],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;
  const data = await fetchSession(session);
  if (!data) return { title: "Atelier" };
  return { title: data.title, description: data.intro };
}

export default async function AtelierSessionDetailPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;
  const data = await fetchSession(session);
  if (!data) notFound();

  const firstOcc = data.occurrences[0];
  const hasMultiple = data.occurrences.length > 1;
  // Lieux uniques pour affichage condensé dans le hero
  const uniqueLocations = Array.from(
    new Set(data.occurrences.map((o) => o.location))
  );

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href="/ateliers/collectif"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-500 hover:text-[var(--brand-gold)] transition"
        >
          <ArrowLeft size={13} /> Toutes les sessions
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10 md:pt-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)]">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="md:pt-4">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">
              Atelier collectif
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-[1.1] mb-6">
              {data.title}
            </h1>
            <div className="w-10 h-px bg-[var(--brand-gold)]/40 mb-7" />

            <p className="font-serif italic text-[15px] md:text-[16px] text-gray-700 leading-relaxed mb-8">
              {data.intro}
            </p>

            <div className="space-y-3 mb-8">
              {hasMultiple ? (
                <>
                  <InfoRow
                    Icon={Calendar}
                    label="Dates"
                    value={`${data.occurrences.length} créneaux disponibles`}
                  />
                  <InfoRow
                    Icon={Clock}
                    label="Horaires"
                    value={firstOcc?.schedule || ""}
                  />
                  <InfoRow
                    Icon={MapPin}
                    label={uniqueLocations.length > 1 ? "Lieux" : "Lieu"}
                    value={uniqueLocations.join(" · ")}
                  />
                </>
              ) : firstOcc ? (
                <>
                  <InfoRow Icon={Calendar} label="Date" value={firstOcc.date} />
                  <InfoRow Icon={Clock} label="Horaires" value={firstOcc.schedule} />
                  <InfoRow Icon={MapPin} label="Lieu" value={firstOcc.location} />
                </>
              ) : null}
            </div>

            <p className="font-serif text-2xl text-gray-900 mb-7">
              {formatEUR(data.price)}
              <span className="text-[12px] text-gray-400 uppercase tracking-wider ml-2">
                / personne
              </span>
            </p>

            <a
              href="#reservation"
              className="inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
            >
              Réserver ma place
              <ArrowDown size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Menu + programme */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
              Menu de la session
            </p>
            <p className="font-serif text-[18px] md:text-[20px] text-gray-900 leading-relaxed">
              {data.menu}
            </p>
          </div>

          {data.program.length > 0 && (
            <div className="space-y-6">
              {data.program.map((p) => (
                <div key={p.title}>
                  <h2 className="font-serif text-[18px] text-gray-900 mb-2">{p.title}</h2>
                  <p className="text-[14px] text-gray-600 leading-[1.8]">{p.body}</p>
                </div>
              ))}
            </div>
          )}

          {data.notes.length > 0 && (
            <div className="mt-10 pt-8 border-t border-[var(--brand-gold)]/15 space-y-4">
              {data.notes.map((n) => (
                <p key={n.title} className="text-[13px] text-gray-600 leading-[1.7]">
                  <span className="font-semibold text-gray-900">{n.title}&nbsp;:</span> {n.body}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Réservation */}
      <section id="reservation" className="py-14 md:py-20 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-3">
              Réservation
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-tight mb-4">
              Réservez votre <span className="italic text-[var(--brand-gold)]">place</span>
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed max-w-md mx-auto">
              {hasMultiple
                ? "Choisissez la date et le lieu, indiquez le nombre de participants et réglez votre place en ligne."
                : "Indiquez le nombre de participants, vos coordonnées et réglez votre place en ligne."}
            </p>
          </div>

          <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-10 py-10 sm:py-12">
            <AtelierReservationForm
              sessionSlug={data.slug}
              sessionTitle={data.title}
              price={data.price}
              occurrences={data.occurrences}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-[14px]">
      <span className="w-9 h-9 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-0.5">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  );
}
