import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { getContents, c } from "@/lib/content";
import ContactForm from "@/components/shop/ContactForm";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const cms = await getContents(["page_contact_title", "page_contact_subtitle"]);
  return {
    title: c(cms, "page_contact_title", "Nous contacter"),
    description: c(cms, "page_contact_subtitle", "Une question ? Notre equipe vous repond sous 24h."),
  };
}

export default async function ContactPage() {
  await connectDB();
  const [settings, cms] = await Promise.all([
    SiteSettings.findOne().lean(),
    getContents([
      "page_contact_title",
      "page_contact_subtitle",
      "page_contact_email",
      "page_contact_phone",
      "page_contact_address",
      "page_contact_hours",
    ]),
  ]);

  const formspreeId = settings?.integrations?.formspreeId;
  const email = c(cms, "page_contact_email", settings?.contactEmail || "");
  const phone = c(cms, "page_contact_phone", settings?.contactPhone || "");
  const address = c(cms, "page_contact_address", settings?.address || "");
  const hours = c(cms, "page_contact_hours", "");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {c(cms, "page_contact_title", "Nous contacter")}
        </h1>
        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
          {c(cms, "page_contact_subtitle", "Une question ? Notre equipe vous repond sous 24h.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            <ContactForm formspreeId={formspreeId} />
          </div>
        </div>

        {/* Coordonnees */}
        <aside className="space-y-3">
          {email && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail size={16} className="text-gray-600" />
                </div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
              </div>
              <a href={`mailto:${email}`} className="text-sm text-gray-900 hover:underline break-all">
                {email}
              </a>
            </div>
          )}

          {phone && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone size={16} className="text-gray-600" />
                </div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Telephone</p>
              </div>
              <a href={`tel:${phone}`} className="text-sm text-gray-900 hover:underline">
                {phone}
              </a>
            </div>
          )}

          {address && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin size={16} className="text-gray-600" />
                </div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Adresse</p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{address}</p>
            </div>
          )}

          {hours && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-gray-600" />
                </div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Horaires</p>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{hours}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
