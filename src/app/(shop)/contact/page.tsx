import Image from "next/image";
import { Mail, MapPin, Clock } from "lucide-react";
import ContactFormClient from "./ContactFormClient";
import { getContent } from "@/lib/content";

// Rendu dynamique : la page relit la photo à chaque visite pour que les
// modifications faites dans l'admin apparaissent immédiatement.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact",
  description: "Contactez Entre Maman et Moi pour vos questions, réservations ou demandes de devis.",
};

export default async function ContactPage() {
  const t = await getContent();
  const email = t("contact_email");
  const INFO = [
    { Icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { Icon: MapPin, label: "Lieu", value: t("contact_address") },
    { Icon: Clock, label: "Réponse", value: t("contact_delay") },
  ];
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
            {t("contact_eyebrow")}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-900 leading-[1.05] mb-7">
            {t("contact_title")}<span className="italic text-[var(--brand-gold)]">{t("contact_title_accent")}</span>
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/50 mx-auto mb-7" />
          <p className="font-serif italic text-[15px] md:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
            {t("contact_intro")}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
        {/* Colonne gauche — visuel + infos */}
        <div className="md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)] mb-10">
            <Image
              src={t("contact_image")}
              alt="Entre Maman et Moi — cuisine indienne"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>

          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-5">
            {t("contact_coord_label")}
          </p>
          <ul className="space-y-6">
            {INFO.map(({ Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
                  <Icon size={15} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="font-serif text-[15px] text-gray-900 hover:text-[var(--brand-gold)] transition"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="font-serif text-[15px] text-gray-900">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne droite — formulaire */}
        <div className="md:col-span-7">
          <div className="bg-white border border-[var(--brand-gold)]/15 px-6 sm:px-8 py-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
              {t("contact_form_eyebrow")}
            </p>
            <h2 className="font-serif text-2xl text-gray-900 leading-none mb-8">
              {t("contact_form_title")}
            </h2>
            <ContactFormClient />
          </div>
        </div>
      </div>
    </div>
  );
}
