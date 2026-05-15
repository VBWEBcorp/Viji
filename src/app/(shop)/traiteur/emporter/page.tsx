import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import EmporterFlow, { type Dish } from "./EmporterFlow";

export const metadata = {
  title: "Traiteur à emporter",
  description:
    "Plats indiens à emporter en click & collect. Menu du moment, retrait à Vern-sur-Seiche.",
};

export default async function TraiteurEmporterPage() {
  let items: Dish[] = [];

  try {
    await connectDB();
    const cat = await Category.findOne({ slug: "traiteur", isActive: true }).lean();
    if (cat) {
      const products = await Product.find({ category: cat._id, isActive: true })
        .sort({ sectionOrder: 1, createdAt: 1 })
        .lean();
      items = products.map((p) => ({
        _id: String(p._id),
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || "",
        price: p.price,
        image: p.images?.[0]?.url,
        servings: p.tags?.[0],
        section: p.section,
        sectionOrder: p.sectionOrder ?? 0,
      }));
    }
  } catch {
    // ignore
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">Traiteur</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          À emporter
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          Click &amp; Collect : commandez en ligne, retirez vos plats frais à Vern-sur-Seiche.
        </p>
      </header>

      {/* Infos pratiques : horaires + adresse en 2 cartes */}
      <section className="bg-[var(--brand-cream)]/40 border-b border-[var(--brand-gold)]/15 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 items-stretch">
          {/* Card Horaires */}
          <div className="bg-white border border-[var(--brand-gold)]/20 px-7 sm:px-9 py-9 sm:py-10 flex flex-col text-center h-full">
            <div className="w-12 h-12 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
              <Clock size={17} strokeWidth={1.5} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] font-medium mb-2">
              Horaires de retrait
            </p>
            <div className="w-8 h-px bg-[var(--brand-gold)]/40 mx-auto mb-6" />

            <p className="font-serif text-[17px] text-gray-900 mb-6">
              Du lundi au dimanche
            </p>

            <div className="flex-1 flex flex-col justify-center space-y-3">
              <div className="flex items-baseline justify-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium w-10 text-right">
                  Midi
                </span>
                <span className="font-serif text-[18px] text-gray-900">
                  12h – 14h
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium w-10 text-right">
                  Soir
                </span>
                <span className="font-serif text-[18px] text-gray-900">
                  19h – 22h
                </span>
              </div>
            </div>
          </div>

          {/* Card Adresse */}
          <div className="bg-white border border-[var(--brand-gold)]/20 px-7 sm:px-9 py-9 sm:py-10 flex flex-col text-center h-full">
            <div className="w-12 h-12 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
              <MapPin size={17} strokeWidth={1.5} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] font-medium mb-2">
              Adresse de retrait
            </p>
            <div className="w-8 h-px bg-[var(--brand-gold)]/40 mx-auto mb-6" />

            <div className="flex-1 flex flex-col justify-center">
              <p className="font-serif text-[18px] text-gray-900 leading-relaxed">
                3 rue de la Libération
                <br />
                <span className="text-gray-700">35770 Vern-sur-Seiche</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu + formulaire : flow interactif client */}
      <EmporterFlow items={items} />

      {/* CTA événementiel */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="pt-12 border-t border-gray-100 text-center">
          <p className="text-[13px] text-gray-600 mb-2">Vous organisez un événement&nbsp;?</p>
          <Link
            href="/traiteur/evenementiel"
            className="inline-flex items-center gap-2 text-[var(--brand-gold)] uppercase tracking-widest text-[12px] font-medium hover:text-[var(--brand-gold-dark)] transition"
          >
            Voir le traiteur événementiel →
          </Link>
        </div>
      </section>
    </div>
  );
}
