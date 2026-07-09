import type { ContentPageDef } from "../registry";

/**
 * Page Traiteur événementiel — `src/app/(shop)/traiteur/evenementiel/page.tsx`.
 * Textes, points clés et photo éditables depuis l'admin. Le formulaire de devis
 * reste géré dans le code.
 */
export const traiteurEvenementielPage: ContentPageDef = {
  id: "traiteur-evenementiel",
  name: "Traiteur — Événementiel",
  route: "/traiteur/evenementiel",
  icon: "ShoppingBag",
  category: "page",
  description: "Textes, points clés et photo de la page Traiteur événementiel",
  sections: [
    {
      id: "entete",
      title: "En-tête",
      fields: [
        { key: "traiteur_evenementiel_eyebrow", type: "text", label: "Surtitre", default: "Traiteur" },
        { key: "traiteur_evenementiel_title", type: "text", label: "Titre", default: "Événementiel" },
        {
          key: "traiteur_evenementiel_subtitle",
          type: "textarea",
          label: "Sous-titre",
          default: "Pour vos événements privés, devis sur mesure.",
        },
      ],
    },
    {
      id: "points-cles",
      title: "Points clés (sous la photo)",
      fields: [
        { key: "traiteur_evenementiel_hl1_label", type: "text", label: "Point 1 · intitulé", default: "Format" },
        { key: "traiteur_evenementiel_hl1_value", type: "text", label: "Point 1 · valeur", default: "Anniversaires, mariages, repas privés" },
        { key: "traiteur_evenementiel_hl2_label", type: "text", label: "Point 2 · intitulé", default: "Cuisine" },
        { key: "traiteur_evenementiel_hl2_value", type: "text", label: "Point 2 · valeur", default: "Indienne authentique, recettes familiales" },
        { key: "traiteur_evenementiel_hl3_label", type: "text", label: "Point 3 · intitulé", default: "Service" },
        { key: "traiteur_evenementiel_hl3_value", type: "text", label: "Point 3 · valeur", default: "Devis sur mesure, dressage et présentation" },
        { key: "traiteur_evenementiel_hl4_label", type: "text", label: "Point 4 · intitulé", default: "Zone" },
        { key: "traiteur_evenementiel_hl4_value", type: "text", label: "Point 4 · valeur", default: "Rennes et alentours" },
      ],
    },
    {
      id: "devis",
      title: "Bloc demande de devis",
      fields: [
        { key: "traiteur_evenementiel_devis_title", type: "text", label: "Titre", default: "Demande de devis" },
        {
          key: "traiteur_evenementiel_devis_intro",
          type: "textarea",
          label: "Texte d'introduction",
          default:
            "Décrivez votre projet (date, nombre de personnes, lieu, préférences) et je reviens vers vous sous 48h.",
        },
      ],
    },
    {
      id: "visuel",
      title: "Photo",
      fields: [
        {
          key: "traiteur_evenementiel_image",
          type: "image",
          label: "Photo (colonne de gauche)",
          help: "Format portrait recommandé (4:5).",
          default:
            "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=900&h=1100&fit=crop",
        },
      ],
    },
  ],
};
