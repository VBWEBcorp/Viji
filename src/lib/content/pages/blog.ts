import type { ContentPageDef } from "../registry";

/** Blog — en-tête de la liste d'articles (`src/app/(shop)/blog/page.tsx`). */
export const blogPage: ContentPageDef = {
  id: "blog",
  name: "Blog",
  route: "/blog",
  icon: "Newspaper",
  category: "page",
  description: "En-tête de la liste des articles",
  sections: [
    {
      id: "hero",
      title: "En-tête",
      fields: [
        { key: "blog_eyebrow", type: "text", label: "Surtitre", default: "Le carnet" },
        { key: "blog_title", type: "text", label: "Titre", default: "Recettes &" },
        { key: "blog_title_accent", type: "text", label: "Titre (mot doré)", default: "conseils" },
        { key: "blog_subtitle", type: "textarea", label: "Sous-titre", default: "Recettes traditionnelles, guides d'épices et conseils pour faire entrer l'Inde dans votre cuisine." },
        { key: "blog_empty", type: "text", label: "Message si aucun article", default: "Aucun article pour le moment." },
      ],
    },
  ],
};
