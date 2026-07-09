import type { ContentPageDef } from "../registry";

/**
 * Page « Atelier à domicile » — `src/app/(shop)/ateliers/[type]/page.tsx` (type
 * `a-domicile`). Surtitre, titre, intro, média, programme (6 étapes) et infos
 * pratiques (3) éditables depuis l'admin.
 *
 * ⚠️ Les clés program/pratique sont numérotées et lues par la page selon un
 * compteur fixe (6 étapes, 3 infos) : garder ces nombres synchronisés avec
 * `EDITABLE["a-domicile"]` dans la page.
 *
 * Le PRIX de l'atelier n'est pas ici : il se règle dans Produits (produit
 * « atelier-cuisine-indienne »).
 */
export const atelierADomicilePage: ContentPageDef = {
  id: "atelier-a-domicile",
  name: "Atelier à domicile",
  route: "/ateliers/a-domicile",
  icon: "PanelTop",
  category: "page",
  description: "Textes, média, programme et infos pratiques de l'atelier à domicile",
  sections: [
    {
      id: "entete",
      title: "En-tête",
      fields: [
        { key: "atelier_adomicile_eyebrow", type: "text", label: "Surtitre", default: "Atelier" },
        { key: "atelier_adomicile_title", type: "text", label: "Titre", default: "Atelier à domicile" },
        {
          key: "atelier_adomicile_intro",
          type: "textarea",
          label: "Texte d'introduction",
          default:
            "Je viens chez vous avec ingrédients, épices, matériel et tablier. Tout est prêt, vous n'avez qu'à profiter.",
        },
      ],
    },
    {
      id: "media",
      title: "Média (vidéo ou photo)",
      fields: [
        {
          key: "atelier_adomicile_video",
          type: "url",
          label: "ID vidéo YouTube",
          help: "Uniquement l'identifiant (ex : mBXvjsEqAZw). Laisser vide pour afficher la photo à la place.",
          default: "mBXvjsEqAZw",
        },
        {
          key: "atelier_adomicile_image",
          type: "image",
          label: "Photo (affichée si aucune vidéo)",
          help: "Format portrait recommandé (4:5).",
          default: "https://i.ibb.co/qLvzCsJS/Viji.jpg",
        },
      ],
    },
    {
      id: "programme",
      title: "Programme (6 étapes)",
      fields: [
        { key: "atelier_adomicile_prog1_title", type: "text", label: "Étape 1 · titre", default: "Une expérience conviviale chez vous" },
        { key: "atelier_adomicile_prog1_body", type: "textarea", label: "Étape 1 · texte", default: "Je me déplace avec ingrédients, épices, matériel et tablier. Vous n'avez à rien prévoir." },
        { key: "atelier_adomicile_prog2_title", type: "text", label: "Étape 2 · titre", default: "Menu" },
        { key: "atelier_adomicile_prog2_body", type: "textarea", label: "Étape 2 · texte", default: "Poulet aux pommes de terre, riz au citron, raita oignon, lassi salé. Adapté à votre groupe." },
        { key: "atelier_adomicile_prog3_title", type: "text", label: "Étape 3 · titre", default: "Au programme" },
        { key: "atelier_adomicile_prog3_body", type: "textarea", label: "Étape 3 · texte", default: "Apprentissage des épices essentielles, préparation pas à pas, cuisson lente et astuces pour reproduire." },
        { key: "atelier_adomicile_prog4_title", type: "text", label: "Étape 4 · titre", default: "Convivialité" },
        { key: "atelier_adomicile_prog4_body", type: "textarea", label: "Étape 4 · texte", default: "Dégustation du repas ensemble dans votre cuisine. Échange et transmission." },
        { key: "atelier_adomicile_prog5_title", type: "text", label: "Étape 5 · titre", default: "Enfants" },
        { key: "atelier_adomicile_prog5_body", type: "textarea", label: "Étape 5 · texte", default: "Participation gratuite jusqu'à 6 ans." },
        { key: "atelier_adomicile_prog6_title", type: "text", label: "Étape 6 · titre", default: "Adaptations" },
        { key: "atelier_adomicile_prog6_body", type: "textarea", label: "Étape 6 · texte", default: "Allergies et restrictions à préciser à la réservation." },
      ],
    },
    {
      id: "pratique",
      title: "Infos pratiques (3)",
      fields: [
        { key: "atelier_adomicile_prac1_label", type: "text", label: "Info 1 · intitulé", default: "Format" },
        { key: "atelier_adomicile_prac1_value", type: "text", label: "Info 1 · valeur", default: "Petit groupe (jusqu'à 6 personnes)" },
        { key: "atelier_adomicile_prac2_label", type: "text", label: "Info 2 · intitulé", default: "Durée" },
        { key: "atelier_adomicile_prac2_value", type: "text", label: "Info 2 · valeur", default: "Environ 2h30" },
        { key: "atelier_adomicile_prac3_label", type: "text", label: "Info 3 · intitulé", default: "Lieu" },
        { key: "atelier_adomicile_prac3_value", type: "text", label: "Info 3 · valeur", default: "Chez vous (Rennes et alentours)" },
      ],
    },
  ],
};
