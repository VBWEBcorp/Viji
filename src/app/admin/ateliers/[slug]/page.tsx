import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import AtelierSession from "@/models/AtelierSession";
import AtelierSessionForm from "@/components/admin/AtelierSessionForm";

export const dynamic = "force-dynamic";

export default async function EditAtelierSessionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectDB();
  const doc = await AtelierSession.findOne({ slug }).lean();
  if (!doc) notFound();

  // Compose les occurrences depuis le tableau OU le fallback legacy.
  let occurrences: { date: string; dateISO?: string; schedule: string; location: string }[] = [];
  if (Array.isArray(doc.occurrences) && doc.occurrences.length > 0) {
    occurrences = doc.occurrences.map((o) => ({
      date: o.date,
      dateISO: o.dateISO || "",
      schedule: o.schedule,
      location: o.location,
    }));
  } else if (doc.date && doc.schedule && doc.location) {
    occurrences = [
      {
        date: doc.date,
        dateISO: doc.dateISO || "",
        schedule: doc.schedule,
        location: doc.location,
      },
    ];
  } else {
    occurrences = [{ date: "", dateISO: "", schedule: "10h – 12h30", location: "" }];
  }

  const initial = {
    slug: doc.slug,
    shortTitle: doc.shortTitle,
    title: doc.title,
    image: doc.image,
    occurrences,
    priceEUR: doc.price / 100,
    intro: doc.intro,
    menu: doc.menu,
    program: doc.program || [],
    notes: doc.notes || [],
    isActive: doc.isActive,
    order: doc.order,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin/ateliers"
        className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.15em] text-gray-500 hover:text-[var(--brand-gold)] transition mb-6"
      >
        <ArrowLeft size={14} /> Retour aux sessions
      </Link>

      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">Ateliers</p>
        <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 leading-[1.1]">
          Modifier la session
        </h1>
        <p className="text-[13px] text-gray-500 mt-2 truncate">{doc.title}</p>
      </div>

      <AtelierSessionForm initialSlug={doc.slug} initial={initial} />
    </div>
  );
}
