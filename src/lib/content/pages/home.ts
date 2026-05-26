import type { ContentPageDef } from "../registry";

/**
 * Accueil — `src/app/(shop)/page.tsx` + `components/shop/HeroSection.tsx`.
 * Les `default` reprennent à l'identique le texte/les images affichés aujourd'hui.
 * Note : les 3 cartes « kits » (image + nom + tagline) restent gérées dans
 * Produits › Catégories ; on n'expose ici que le surtitre/titre de la section.
 */
export const homePage: ContentPageDef = {
  id: "home",
  name: "Accueil",
  route: "/",
  icon: "Home",
  category: "page",
  description: "Hero, sections, images et appels à l'action de la page d'accueil",
  sections: [
    {
      id: "hero",
      title: "Hero (haut de page)",
      fields: [
        { key: "home_hero_eyebrow", type: "text", label: "Surtitre", default: "Cuisine indienne · Rennes" },
        { key: "home_hero_title", type: "text", label: "Titre · ligne 1", default: "Voyagez au" },
        { key: "home_hero_title_accent", type: "text", label: "Titre · ligne 2 (doré)", default: "cœur de l'Inde" },
        { key: "home_hero_cta_primary", type: "text", label: "Bouton principal", default: "Découvrir les kits" },
        { key: "home_hero_cta_secondary", type: "text", label: "Lien secondaire", default: "Voir les ateliers" },
      ],
    },
    {
      id: "gallery",
      title: "Galerie d'images (hero + mosaïque)",
      fields: [
        { key: "home_img_1", type: "image", label: "Image 1 (grande, gauche)", default: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg" },
        { key: "home_img_2", type: "image", label: "Image 2", default: "https://i.ibb.co/Kx5rKtGN/Halwa.jpg" },
        { key: "home_img_3", type: "image", label: "Image 3", default: "https://i.ibb.co/KcVCgbMz/Raita-oignon.jpg" },
        { key: "home_img_4", type: "image", label: "Image 4 (grande, droite)", default: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg" },
        { key: "home_img_5", type: "image", label: "Image 5", default: "https://i.ibb.co/HfXy27N9/Lassi-sucr.jpg" },
        { key: "home_img_6", type: "image", label: "Image 6", default: "https://i.ibb.co/F4318X0S/Ourka-citron.jpg" },
      ],
    },
    {
      id: "kits",
      title: "Section « Trois formules »",
      fields: [
        { key: "home_kits_eyebrow", type: "text", label: "Surtitre", default: "Kits à faire soi-même" },
        { key: "home_kits_title", type: "text", label: "Titre", default: "Trois" },
        { key: "home_kits_title_accent", type: "text", label: "Titre (mot doré)", default: "formules" },
      ],
    },
    {
      id: "atmosphere",
      title: "Section « Atmosphère »",
      fields: [
        { key: "home_atmo_eyebrow", type: "text", label: "Surtitre", default: "Atmosphère" },
        { key: "home_atmo_title_accent", type: "text", label: "Titre (mot doré)", default: "L'Inde" },
        { key: "home_atmo_title_suffix", type: "text", label: "Titre (suite)", default: "dans l'assiette" },
        { key: "home_atmo_subtitle", type: "text", label: "Sous-titre", default: "Couleurs, parfums, gestes : un voyage sensoriel." },
      ],
    },
    {
      id: "quote",
      title: "Citation",
      fields: [
        { key: "home_quote", type: "textarea", label: "Citation (retours à la ligne respectés)", default: "« L'Inde se cuisine\navec les mains, les sens\net le cœur. »" },
        { key: "home_quote_author", type: "text", label: "Signature", default: "Viji" },
        { key: "home_quote_cta", type: "text", label: "Lien", default: "Découvrir plus" },
      ],
    },
    {
      id: "ateliers",
      title: "Section « Ateliers »",
      fields: [
        { key: "home_ateliers_eyebrow", type: "text", label: "Surtitre", default: "Ateliers" },
        { key: "home_ateliers_title", type: "text", label: "Titre · ligne 1", default: "Apprendre" },
        { key: "home_ateliers_title_accent", type: "text", label: "Titre · ligne 2 (doré)", default: "ensemble" },
        { key: "home_ateliers_text", type: "textarea", label: "Texte", default: "À domicile, en collectif ou avec une cheffe privée. Trois formules, un même esprit : la transmission." },
        { key: "home_ateliers_cta", type: "text", label: "Lien", default: "Voir les ateliers" },
        { key: "home_ateliers_caption", type: "text", label: "Légende vidéo", default: "Un atelier · une transmission" },
        { key: "home_ateliers_video", type: "url", label: "ID vidéo YouTube", help: "Uniquement l'identifiant (ex : mBXvjsEqAZw)", default: "mBXvjsEqAZw" },
      ],
    },
    {
      id: "traiteur",
      title: "Section « Traiteur »",
      fields: [
        { key: "home_traiteur_eyebrow", type: "text", label: "Surtitre", default: "Traiteur" },
        { key: "home_traiteur_title", type: "text", label: "Titre · ligne 1", default: "À emporter" },
        { key: "home_traiteur_title_accent", type: "text", label: "Titre · ligne 2 (doré)", default: "& sur mesure" },
        { key: "home_traiteur_text", type: "textarea", label: "Texte", default: "Click & Collect à Vern-sur-Seiche pour vos plats du moment. Devis sur mesure pour vos événements." },
        { key: "home_traiteur_image", type: "image", label: "Image", default: "https://i.ibb.co/tTqdZjjS/Citronade-indienne.jpg" },
        { key: "home_traiteur_cta1", type: "text", label: "Lien 1", default: "À emporter" },
        { key: "home_traiteur_cta2", type: "text", label: "Lien 2", default: "Événementiel" },
      ],
    },
    {
      id: "histoire",
      title: "Section « L'histoire »",
      fields: [
        { key: "home_histoire_eyebrow", type: "text", label: "Surtitre", default: "L'histoire" },
        { key: "home_histoire_title", type: "text", label: "Titre · ligne 1", default: "Née dans la cuisine" },
        { key: "home_histoire_title_accent", type: "text", label: "Titre · ligne 2 (doré)", default: "de ma mère" },
        { key: "home_histoire_para1", type: "textarea", label: "Paragraphe 1 (en avant)", default: "Une cuisine remplie de parfums, de gestes précis et de silences chargés d'amour. Chaque mélange d'épices y racontait une histoire." },
        { key: "home_histoire_para2", type: "textarea", label: "Paragraphe 2", default: "Entre Maman et Moi, c'est cette transmission : kits, ateliers, traiteur. Un voyage sensoriel à partager." },
        { key: "home_histoire_author", type: "text", label: "Signature", default: "Viji" },
        { key: "home_histoire_cta", type: "text", label: "Lien", default: "Lire toute l'histoire" },
        { key: "home_histoire_img_1", type: "image", label: "Photo 1 (gauche)", default: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg" },
        { key: "home_histoire_img_2", type: "image", label: "Photo 2 (centre)", default: "https://i.ibb.co/Kx5rKtGN/Halwa.jpg" },
        { key: "home_histoire_img_3", type: "image", label: "Photo 3 (droite)", default: "https://i.ibb.co/HfXy27N9/Lassi-sucr.jpg" },
      ],
    },
    {
      id: "avis",
      title: "Section « Avis Google »",
      fields: [
        { key: "home_avis_eyebrow", type: "text", label: "Surtitre", default: "Ils en parlent" },
        { key: "home_avis_rating", type: "text", label: "Note affichée", default: "5,0" },
        { key: "home_avis_count", type: "text", label: "Nombre d'avis", default: "19 avis" },
      ],
    },
    {
      id: "reseaux",
      title: "Section « Réseaux sociaux »",
      fields: [
        { key: "home_reseaux_eyebrow", type: "text", label: "Surtitre", default: "Sur les réseaux" },
        { key: "home_reseaux_title", type: "text", label: "Titre", default: "Suivez-nous au" },
        { key: "home_reseaux_title_accent", type: "text", label: "Titre (mot doré)", default: "quotidien" },
        { key: "home_reseaux_text", type: "textarea", label: "Texte", default: "Coulisses des ateliers, recettes en pas à pas et inspirations indiennes. Partageons l'aventure ensemble." },
        { key: "home_social_instagram", type: "url", label: "Lien Instagram", default: "https://instagram.com/" },
        { key: "home_social_tiktok", type: "url", label: "Lien TikTok", default: "https://tiktok.com/" },
        { key: "home_social_facebook", type: "url", label: "Lien Facebook", default: "https://facebook.com/" },
        { key: "home_social_youtube", type: "url", label: "Lien YouTube", default: "https://www.youtube.com/@EntreMamanetMoi" },
        { key: "home_reseaux_video_1", type: "url", label: "ID vidéo YouTube 1", default: "mBXvjsEqAZw" },
        { key: "home_reseaux_video_2", type: "url", label: "ID vidéo YouTube 2", default: "tTjZz_wRNLg" },
      ],
    },
    {
      id: "newsletter",
      title: "Bandeau newsletter (bas de page)",
      fields: [
        { key: "home_news_eyebrow", type: "text", label: "Surtitre", default: "Restons en cuisine" },
        { key: "home_news_title", type: "text", label: "Titre", default: "Une recette par mois," },
        { key: "home_news_subtitle", type: "text", label: "Sous-titre", default: "directement chez vous." },
        { key: "home_news_cta", type: "text", label: "Bouton", default: "S'inscrire" },
      ],
    },
  ],
};
