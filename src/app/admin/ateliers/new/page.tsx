import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AtelierSessionForm from "@/components/admin/AtelierSessionForm";

const EMPTY = {
  slug: "",
  shortTitle: "",
  title: "",
  image: "",
  occurrences: [
    { date: "", dateISO: "", schedule: "10h – 12h30", location: "" },
  ],
  priceEUR: 60,
  intro: "",
  menu: "",
  program: [
    { title: "Au programme", body: "" },
    { title: "Moment convivial", body: "" },
  ],
  notes: [
    { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
    { title: "Adaptations alimentaires", body: "Allergies et restrictions à préciser à la réservation." },
  ],
  isActive: true,
  order: 0,
};

export default function NewAtelierSessionPage() {
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
          Nouvelle session
        </h1>
      </div>

      <AtelierSessionForm initial={EMPTY} />
    </div>
  );
}
