import type { ContentPageDef } from "../registry";

/**
 * Page Contact — `src/app/(shop)/contact/page.tsx`.
 * Textes, coordonnées et photo éditables depuis l'admin. Le formulaire lui-même
 * (champs, envoi) reste géré dans le code.
 */
export const contactPage: ContentPageDef = {
  id: "contact",
  name: "Contact",
  route: "/contact",
  icon: "Mail",
  category: "page",
  description: "Textes, coordonnées et photo de la page Contact",
  sections: [
    {
      id: "entete",
      title: "En-tête",
      fields: [
        { key: "contact_eyebrow", type: "text", label: "Surtitre", default: "Nous contacter" },
        { key: "contact_title", type: "text", label: "Titre", default: "Écrivez-" },
        { key: "contact_title_accent", type: "text", label: "Titre · mot doré", default: "nous" },
        {
          key: "contact_intro",
          type: "textarea",
          label: "Texte d'introduction",
          default:
            "Une question, une envie d'atelier ou une demande de devis traiteur ? Je vous réponds personnellement sous 48h.",
        },
      ],
    },
    {
      id: "coordonnees",
      title: "Coordonnées",
      fields: [
        { key: "contact_coord_label", type: "text", label: "Titre du bloc", default: "Coordonnées" },
        { key: "contact_email", type: "text", label: "Email", default: "entremamanetmoicook@gmail.com" },
        { key: "contact_address", type: "text", label: "Adresse", default: "3 rue de la Libération, 35770 Vern-sur-Seiche" },
        { key: "contact_delay", type: "text", label: "Délai de réponse", default: "Sous 48h en moyenne" },
      ],
    },
    {
      id: "formulaire",
      title: "Bloc formulaire",
      fields: [
        { key: "contact_form_eyebrow", type: "text", label: "Surtitre", default: "Formulaire" },
        { key: "contact_form_title", type: "text", label: "Titre", default: "Votre message" },
      ],
    },
    {
      id: "visuel",
      title: "Photo",
      fields: [
        {
          key: "contact_image",
          type: "image",
          label: "Photo (colonne de gauche)",
          help: "Format portrait recommandé (4:5).",
          default: "https://i.ibb.co/F4318X0S/Ourka-citron.jpg",
        },
      ],
    },
  ],
};
