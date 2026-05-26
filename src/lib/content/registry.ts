/**
 * REGISTRE DE CONTENU — source unique de vérité.
 *
 * Chaque page/section du site déclare ici ses champs éditables + leur valeur
 * réelle actuelle (`default`). Ce registre pilote :
 *   1. Le rendu des pages publiques (via `getContent()` dans lib/content.ts) —
 *      la page lit la base, et retombe sur `default` si rien n'est enregistré.
 *   2. La page d'administration « Contenu » — qui construit son éditeur à partir
 *      de cette structure (libellés, types, regroupements) et pré-remplit chaque
 *      champ avec sa valeur (base sinon `default`), donc jamais vide.
 *
 * Conséquence : admin ↔ pages ↔ valeurs par défaut ne peuvent plus diverger.
 * Pour exposer un nouveau texte/image : on l'ajoute ici et on lit la clé dans la page.
 */

export type ContentType = "text" | "textarea" | "html" | "image" | "url";

export interface ContentField {
  key: string;
  type: ContentType;
  label: string;
  help?: string;
  /** Valeur réelle affichée aujourd'hui (fallback de rendu + pré-remplissage admin). */
  default: string;
}

export interface ContentSection {
  id: string;
  title: string;
  fields: ContentField[];
}

export type ContentCategory = "page" | "component" | "legal";

export interface ContentPageDef {
  id: string;
  name: string;
  /** Route publique (ou libellé). Affiché dans l'admin. */
  route: string;
  /** Nom d'icône lucide-react (mappé côté admin). */
  icon: string;
  category: ContentCategory;
  description: string;
  sections: ContentSection[];
}

import { homePage } from "./pages/home";
import { footerComponent } from "./pages/global";
import { blogPage } from "./pages/blog";

/** Toutes les pages éditables, dans l'ordre d'affichage de l'admin. */
export const CONTENT_PAGES: ContentPageDef[] = [
  homePage,
  blogPage,
  footerComponent,
];

/** Map plate clé → métadonnées, dérivée du registre (pour rendu + admin). */
export const CONTENT_DEFAULTS: Record<
  string,
  { type: ContentType; label: string; default: string }
> = {};

for (const page of CONTENT_PAGES) {
  for (const section of page.sections) {
    for (const field of section.fields) {
      CONTENT_DEFAULTS[field.key] = {
        type: field.type,
        label: field.label,
        default: field.default,
      };
    }
  }
}

/** Liste de toutes les clés connues. */
export const ALL_CONTENT_KEYS = Object.keys(CONTENT_DEFAULTS);
