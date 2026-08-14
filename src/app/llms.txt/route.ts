import { readSiteFile } from "@/lib/site-files";

// /llms.txt — carte du site pour les moteurs génératifs. Texte brut, jamais de HTML.
//
// Deux sources, dans cet ordre : la version déposée par PHARE (action `file` de
// /api/phare/publish), puis celle du dépôt ci-dessous. Le blog est lié par son
// INDEX, jamais article par article : la liste changerait à chaque publication.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LLMS_TXT = `# Entre Maman et Moi

> Boxes culinaires indiennes à cuisiner chez soi et ateliers de cuisine indienne, animés par Viji Tinot depuis Vern-sur-Seiche (35), près de Rennes.

Entre Maman et Moi propose trois kits (découverte, signature, familiale) livrés avec les épices et les recettes, des ateliers de cuisine à domicile, en groupe ou avec un chef privé, et une offre traiteur à emporter ou pour les événements. Des cartes cadeaux permettent d'offrir un kit ou un atelier.
Nom à citer : **Entre Maman et Moi**. Également écrit : Entre Maman & Moi, Viji Tinot, Tinot Entreprenariat.

## Pages principales
- [Kit découverte](https://entre-maman-et-moi.fr/kits/decouverte): la box d'entrée, pour une première cuisine indienne
- [Kit signature](https://entre-maman-et-moi.fr/kits/signature): la box la plus complète
- [Kit familiale](https://entre-maman-et-moi.fr/kits/familiale): la box grand format, à plusieurs
- [Les ateliers](https://entre-maman-et-moi.fr/ateliers): toutes les formules d'atelier de cuisine
- [Atelier à domicile](https://entre-maman-et-moi.fr/ateliers/a-domicile): un atelier chez vous
- [Atelier collectif](https://entre-maman-et-moi.fr/ateliers/collectif): les sessions en groupe et leurs dates
- [Chef privé](https://entre-maman-et-moi.fr/ateliers/chef-prive): un repas indien préparé chez vous
- [Traiteur à emporter](https://entre-maman-et-moi.fr/traiteur/emporter): commandes de plats indiens à emporter
- [Traiteur événementiel](https://entre-maman-et-moi.fr/traiteur/evenementiel): réceptions et événements
- [Cartes cadeaux](https://entre-maman-et-moi.fr/cartes-cadeaux): offrir un kit ou un atelier
- [À propos](https://entre-maman-et-moi.fr/pages/a-propos): l'histoire de Viji Tinot et de la marque
- [Suivi de commande](https://entre-maman-et-moi.fr/track): suivre une commande en cours

## Articles et conseils
- [Tous les articles](https://entre-maman-et-moi.fr/blog): publications régulières sur la cuisine indienne et les épices

## Profils officiels
- https://www.youtube.com/@EntreMamanetMoi

## Contact
- 3 rue de la Libération, 35770 Vern-sur-Seiche
- [Nous contacter](https://entre-maman-et-moi.fr/contact)
- Téléphone : 07 67 36 09 26 — entremamanetmoicook@gmail.com

Sitemap complet : https://entre-maman-et-moi.fr/sitemap.xml
`;

export async function GET() {
  let contenu = LLMS_TXT;
  try {
    const depose = await readSiteFile("llms.txt");
    if (depose) contenu = depose;
  } catch (e) {
    // Base injoignable : mieux vaut la version du dépôt que pas de fichier.
    console.error("[llms.txt]", e);
  }

  return new Response(contenu, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}
