import Link from "next/link";
import Image from "next/image";
import SiteSettings from "@/models/SiteSettings";
import { connectDB } from "@/lib/db";
import { getContent } from "@/lib/content";

export default async function Footer() {
  const t = await getContent();
  let settings: {
    shopName?: string;
    social?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      youtube?: string;
    };
  } | null = null;
  try {
    await connectDB();
    settings = await SiteSettings.findOne().lean();
  } catch {
    // ignore
  }

  const shopName = settings?.shopName || "Entre Maman et Moi";
  const year = new Date().getFullYear();

  const socials = [
    { href: settings?.social?.facebook || "#", label: "Facebook", Icon: FacebookIcon },
    { href: settings?.social?.instagram || "#", label: "Instagram", Icon: InstagramIcon },
    { href: settings?.social?.tiktok || "#", label: "TikTok", Icon: TikTokIcon },
    { href: settings?.social?.youtube || "#", label: "YouTube", Icon: YoutubeIcon },
  ];

  return (
    <footer className="bg-[var(--brand-cream)]/60 mt-auto">
      {/* Brand block + columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-14">
        {/* Centered brand */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-6">
            {t("footer_eyebrow")}
          </p>
          <Link href="/" className="inline-block" aria-label={shopName}>
            <Image
              src={t("footer_logo")}
              alt={shopName}
              width={280}
              height={120}
              className="h-24 sm:h-28 md:h-32 w-auto object-contain mx-auto"
            />
          </Link>
          <div className="w-16 h-px bg-[var(--brand-gold)]/40 mx-auto mt-8" />
          <p className="font-serif italic text-lg md:text-xl text-gray-600 mt-7">
            {t("footer_tagline")}
          </p>
        </div>

        {/* 3 columns: Découvrir / S'initier / Adresse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 max-w-5xl mx-auto">
          <FooterColumn
            label={t("footer_col1_label")}
            links={[
              { href: "/kits/decouverte", label: "Kit Découverte" },
              { href: "/kits/signature", label: "Kit Signature" },
              { href: "/kits/familiale", label: "Kit Familiale" },
            ]}
          />

          <FooterColumn
            label={t("footer_col2_label")}
            links={[
              { href: "/ateliers/a-domicile", label: "Atelier à domicile" },
              { href: "/ateliers/collectif", label: "Atelier collectif" },
              { href: "/ateliers/chef-prive", label: "Cheffe privée à domicile" },
              { href: "/traiteur/emporter", label: "Traiteur à emporter" },
              { href: "/traiteur/evenementiel", label: "Traiteur événementiel" },
            ]}
          />

          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-5">
              {t("footer_col3_label")}
            </p>
            <div className="space-y-5 text-[13px] text-gray-700 leading-relaxed">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1.5">
                  Adresse
                </p>
                <p>
                  {t("footer_address").split("\n").map((line, i, arr) => (
                    <span key={i}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1.5">
                  Email
                </p>
                <a
                  href={`mailto:${t("footer_email")}`}
                  className="hover:text-[var(--brand-gold)] transition border-b border-transparent hover:border-[var(--brand-gold)]/40"
                >
                  {t("footer_email")}
                </a>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1.5">
                  Réponse
                </p>
                <p>{t("footer_response")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Socials — centered, refined */}
        <div className="mt-16 md:mt-20 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-6">
            {t("footer_socials_label")}
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center hover:bg-[var(--brand-gold)] hover:text-white hover:border-[var(--brand-gold)] transition"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-[var(--brand-gold)]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-gray-500">
            <span>© {year} {shopName}</span>
            <Link href="/blog" className="hover:text-[var(--brand-gold)] transition">
              Blog
            </Link>
            <Link href="/pages/mentions-legales" className="hover:text-[var(--brand-gold)] transition">
              Mentions légales
            </Link>
            <Link href="/pages/cgv" className="hover:text-[var(--brand-gold)] transition">
              CGV
            </Link>
            <Link href="/pages/politique-confidentialite" className="hover:text-[var(--brand-gold)] transition">
              Confidentialité
            </Link>
            <Link href="/contact" className="hover:text-[var(--brand-gold)] transition">
              Contact
            </Link>
          </div>
          <div
            aria-label="Moyens de paiement acceptés"
            className="flex items-center gap-2"
          >
            <PaymentBadge label="Visa"><VisaMark /></PaymentBadge>
            <PaymentBadge label="Mastercard"><MastercardMark /></PaymentBadge>
            <PaymentBadge label="Maestro"><MaestroMark /></PaymentBadge>
            <PaymentBadge label="Apple Pay"><ApplePayMark /></PaymentBadge>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  links,
}: {
  label: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-5">
        {label}
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] text-gray-700 hover:text-[var(--brand-gold)] transition border-b border-transparent hover:border-[var(--brand-gold)]/40 pb-0.5"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentBadge({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center w-10 h-7 border border-gray-200 rounded bg-white shrink-0"
    >
      {children}
    </span>
  );
}

/* ───────── Marques de paiement ───────── */

function VisaMark() {
  return (
    <svg
      viewBox="0 0 64 22"
      className="h-3 w-auto"
      aria-hidden="true"
    >
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fontFamily="Geist, Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="20"
        letterSpacing="0.5"
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 36 22" className="h-4 w-auto" aria-hidden="true">
      <circle cx="14" cy="11" r="8" fill="#EB001B" />
      <circle cx="22" cy="11" r="8" fill="#F79E1B" />
      <path
        d="M18 5.4a8 8 0 0 1 0 11.2 8 8 0 0 1 0-11.2Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function MaestroMark() {
  return (
    <svg viewBox="0 0 36 22" className="h-4 w-auto" aria-hidden="true">
      <circle cx="14" cy="11" r="8" fill="#0099DF" />
      <circle cx="22" cy="11" r="8" fill="#ED0006" />
      <path
        d="M18 5.4a8 8 0 0 1 0 11.2 8 8 0 0 1 0-11.2Z"
        fill="#6C6BBD"
      />
    </svg>
  );
}

function ApplePayMark() {
  return (
    <svg viewBox="0 0 50 22" className="h-3.5 w-auto" aria-hidden="true">
      {/* Apple logo */}
      <path
        d="M11.6 6.4c-.6.7-1.5 1.2-2.4 1.2-.1-.9.3-1.8.9-2.4.6-.7 1.5-1.2 2.3-1.3.1.9-.3 1.8-.8 2.5Zm.8.9c-1.3 0-2.4.7-3 .7-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.4 2.4-.4 6 1 7.9.7.9 1.5 2 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.6.6 2.6.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.2 0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.8-1.5Z"
        fill="#000"
      />
      <text
        x="22"
        y="15"
        fontFamily="Geist, Arial, sans-serif"
        fontWeight="600"
        fontSize="11"
        fill="#000"
      >
        Pay
      </text>
    </svg>
  );
}

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94Z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1.84-.05Z" />
    </svg>
  );
}

function YoutubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}
