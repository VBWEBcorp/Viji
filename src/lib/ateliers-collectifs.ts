/**
 * Sessions d'ateliers collectifs.
 *
 * Pour ajouter une nouvelle session : pousser un nouvel objet dans le tableau
 * en suivant le même schéma. Les images sont des URLs externes (ibb.co,
 * unsplash, etc.). Le slug devient l'URL `/ateliers/collectif/<slug>`.
 *
 * Tant qu'on n'a pas d'admin dédié, on édite ce fichier à la main.
 */

export type AtelierOccurrence = {
  /** Libellé affiché : « Samedi 14 juin 2026 ». */
  date: string;
  /** ISO YYYY-MM-DD pour tri. */
  dateISO?: string;
  /** Horaire : « 10h – 12h30 ». */
  schedule: string;
  /** Lieu : « Association Rennes » / « Association Triangle ». */
  location: string;
};

export type AtelierSession = {
  slug: string;
  /** Titre court affiché sur la carte de la grille. */
  shortTitle: string;
  /** Titre complet affiché sur la page détail. */
  title: string;
  /** Photo illustrant le plat / la session. */
  image: string;
  /**
   * Liste des créneaux (date + lieu) auxquels cet atelier est proposé.
   * Le client choisira dans un dropdown sur la page détail.
   */
  occurrences: AtelierOccurrence[];
  /** Prix en centimes. */
  price: number;
  /** Phrase d'intro courte (sous le titre de la page détail). */
  intro: string;
  /** Menu de la session (le plat préparé). */
  menu: string;
  /** Blocs de programme affichés sur la page détail. */
  program: { title: string; body: string }[];
  /** Notes additionnelles (enfants, allergies, emporter…). */
  notes?: { title: string; body: string }[];
};

/**
 * Retourne la liste des occurrences. Gère le fallback pour les anciens
 * documents qui ont les champs legacy `date`/`schedule`/`location` à la racine.
 */
export function getOccurrences(s: {
  occurrences?: AtelierOccurrence[];
  date?: string;
  dateISO?: string;
  schedule?: string;
  location?: string;
}): AtelierOccurrence[] {
  if (s.occurrences && s.occurrences.length > 0) return s.occurrences;
  if (s.date && s.schedule && s.location) {
    return [
      {
        date: s.date,
        dateISO: s.dateISO,
        schedule: s.schedule,
        location: s.location,
      },
    ];
  }
  return [];
}

export const SESSIONS: AtelierSession[] = [
  {
    slug: "atelier-samoussa",
    shortTitle: "Atelier samoussa",
    title: "Atelier samoussa indien",
    image: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg",
    occurrences: [
      {
        date: "Samedi 13 juin 2026",
        dateISO: "2026-06-13",
        schedule: "10h – 12h30",
        location: "Association Rennes",
      },
      {
        date: "Samedi 27 juin 2026",
        dateISO: "2026-06-27",
        schedule: "10h – 12h30",
        location: "Association Triangle",
      },
    ],
    price: 6000,
    intro:
      "Une expérience conviviale et entièrement guidée autour du samoussa indien. Tout est fourni : ingrédients, épices, matériel et tablier. Vous apprenez le pliage, la garniture, la cuisson et repartez avec la recette.",
    menu:
      "Samoussas indiens à la viande ou aux légumes, chutney mangue, raïta et lassi.",
    program: [
      {
        title: "Au programme",
        body: "Préparation de la pâte, équilibre des épices pour la garniture, technique de pliage, cuisson et accompagnements.",
      },
      {
        title: "Moment convivial",
        body: "Dégustation sur place et partage avec les autres participants.",
      },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Si vous ne pouvez pas finir sur place, vous emportez vos samoussas dans vos contenants." },
      { title: "Adaptations alimentaires", body: "Version végétarienne possible. Allergies à préciser à la réservation." },
    ],
  },
  // ⚠️ Sessions ci-dessous = exemples pour montrer la grille avec plusieurs
  // cartes. À éditer/supprimer quand Viji communiquera ses vraies prochaines
  // sessions (dates, lieux, menus).
  {
    slug: "poulet-pommes-de-terre-riz-citron",
    shortTitle: "Poulet & riz au citron",
    title: "Poulet aux pommes de terre & riz au citron",
    image: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg",
    occurrences: [
      {
        date: "Samedi 6 juin 2026",
        dateISO: "2026-06-06",
        schedule: "10h – 12h30",
        location: "Association Rennes",
      },
    ],
    price: 6000,
    intro:
      "Une expérience conviviale et entièrement guidée. Tout est fourni : ingrédients, épices, matériel et tablier. Sous ma guidance, vous découvrez les secrets de la cuisine indienne, les techniques fondamentales et l'équilibre des saveurs.",
    menu:
      "Poulet aux pommes de terre avec son riz au citron, accompagné d'un raïta oignon et d'un lassi salé.",
    program: [
      {
        title: "Au programme",
        body: "Apprentissage des épices essentielles (curcuma, cumin, etc.), préparation des bases classiques, cuisson lente et astuces pour reproduire les plats chez vous.",
      },
      {
        title: "Moment convivial",
        body: "Dégustation du repas sur place, partage et échange avec les autres participants dans une ambiance chaleureuse.",
      },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Si vous ne pouvez pas finir le repas sur place, vous pouvez emporter vos plats dans vos propres contenants." },
      { title: "Adaptations alimentaires", body: "Gestion des allergies courantes (à préciser à la réservation)." },
    ],
  },
  {
    slug: "poulet-tikka-masala",
    shortTitle: "Poulet tikka masala",
    title: "Poulet tikka masala & raïta",
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    occurrences: [
      {
        date: "Samedi 20 juin 2026",
        dateISO: "2026-06-20",
        schedule: "10h – 12h30",
        location: "Association Triangle",
      },
    ],
    price: 6000,
    intro:
      "Un grand classique de la cuisine indienne : poulet mariné aux épices, mijoté dans une sauce tomate-crème parfumée. Tout est fourni, vous repartez avec les gestes, l'équilibre des épices et la recette.",
    menu:
      "Poulet tikka masala, riz basmati parfumé, raïta concombre, accompagné d'un lassi à la mangue.",
    program: [
      {
        title: "Au programme",
        body: "Préparation de la marinade tandoori, équilibre tomate-crème-épices, cuisson maîtrisée du poulet et techniques pour reproduire à la maison.",
      },
      {
        title: "Moment convivial",
        body: "Dégustation sur place autour d'une grande tablée, échange avec les autres participants.",
      },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Vous pouvez repartir avec vos plats dans vos propres contenants si vous ne finissez pas sur place." },
      { title: "Adaptations alimentaires", body: "Allergies et restrictions à préciser à la réservation." },
    ],
  },
];

export function getSessionBySlug(slug: string): AtelierSession | undefined {
  return SESSIONS.find((s) => s.slug === slug);
}
