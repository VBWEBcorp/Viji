import Link from "next/link";
import SiteSettings from "@/models/SiteSettings";
import { getContents, c } from "@/lib/content";
import { connectDB } from "@/lib/db";

export default async function Footer() {
  await connectDB();
  const [settings, cms] = await Promise.all([
    SiteSettings.findOne().lean(),
    getContents([
      "footer_about",
      "footer_contact_email",
      "footer_contact_phone",
      "footer_contact_address",
      "footer_copyright",
    ]),
  ]);

  const shopName = settings?.shopName || "Ma Boutique";
  const year = new Date().getFullYear();
  const copyright = c(cms, "footer_copyright", `© ${year} ${shopName}. Tous droits reserves.`);

  return (
    <footer className="bg-gray-950 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold mb-3">{shopName}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {c(cms, "footer_about", "Votre boutique en ligne de confiance. Produits de qualite, livraison rapide, paiement securise.")}
            </p>
            <div className="flex gap-3">
              {["facebook", "instagram", "twitter"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                  <span className="text-xs font-bold uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Boutique</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/products", label: "Catalogue" },
                { href: "/blog", label: "Blog" },
                { href: "/track", label: "Suivre ma commande" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Informations</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/pages/cgv", label: "CGV" },
                { href: "/pages/mentions-legales", label: "Mentions legales" },
                { href: "/pages/politique-retour", label: "Politique de retour" },
                { href: "/pages/politique-confidentialite", label: "Confidentialite" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {(cms.footer_contact_email || settings?.contactEmail) && (
                <li>{cms.footer_contact_email || settings?.contactEmail}</li>
              )}
              {(cms.footer_contact_phone || settings?.contactPhone) && (
                <li>{cms.footer_contact_phone || settings?.contactPhone}</li>
              )}
              {(cms.footer_contact_address || settings?.address) && (
                <li>{cms.footer_contact_address || settings?.address}</li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{copyright}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
            <span>Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
