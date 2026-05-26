import type { ContentPageDef } from "../registry";

/**
 * Pied de page — `src/components/shop/Footer.tsx`.
 * Les liens de navigation (colonnes Nos kits / S'initier) et les réseaux sociaux
 * restent gérés ailleurs (structure du site / Paramètres › réseaux). On expose ici
 * le texte éditorial et les coordonnées.
 */
export const footerComponent: ContentPageDef = {
  id: "footer",
  name: "Pied de page",
  route: "Composant global",
  icon: "Layout",
  category: "component",
  description: "Logo, accroche, libellés de colonnes et coordonnées du footer",
  sections: [
    {
      id: "brand",
      title: "Bloc de marque",
      fields: [
        { key: "footer_eyebrow", type: "text", label: "Surtitre", default: "À Vern-sur-Seiche · cuisine indienne maison" },
        { key: "footer_logo", type: "image", label: "Logo", default: "https://i.ibb.co/5WWqVbC2/cropped-Entre-Maman-Et-Moi-1.png" },
        { key: "footer_tagline", type: "text", label: "Accroche", default: "Voyagez au cœur de l'Inde, depuis votre cuisine." },
      ],
    },
    {
      id: "columns",
      title: "Libellés des colonnes",
      fields: [
        { key: "footer_col1_label", type: "text", label: "Colonne 1", default: "Nos kits" },
        { key: "footer_col2_label", type: "text", label: "Colonne 2", default: "S'initier" },
        { key: "footer_col3_label", type: "text", label: "Colonne 3", default: "L'atelier" },
      ],
    },
    {
      id: "contact",
      title: "Coordonnées",
      fields: [
        { key: "footer_address", type: "textarea", label: "Adresse", default: "3 rue de la Libération\n35770 Vern-sur-Seiche · France" },
        { key: "footer_email", type: "text", label: "Email", default: "entremamanetmoicook@gmail.com" },
        { key: "footer_response", type: "text", label: "Délai de réponse", default: "Sous 48h en moyenne" },
        { key: "footer_socials_label", type: "text", label: "Libellé réseaux", default: "Suivez-nous" },
      ],
    },
  ],
};
