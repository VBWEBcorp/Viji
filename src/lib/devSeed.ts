import mongoose from "mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import SiteSettings from "@/models/SiteSettings";
import User from "@/models/User";
import BlogPost from "@/models/BlogPost";
import AtelierSession from "@/models/AtelierSession";
import { SESSIONS as ATELIER_SESSIONS } from "./ateliers-collectifs";

const BLOG_POSTS = [
  {
    title: "Les 7 épices indiennes essentielles pour débuter en cuisine",
    slug: "epices-indiennes-essentielles-debuter",
    excerpt:
      "Curcuma, cumin, garam masala… Notre guide pratique des épices indispensables pour cuisiner indien à la maison sans se ruiner ni se perdre dans le rayon épices.",
    coverImage: "https://i.ibb.co/RTtVzWbJ/Chutney.jpg",
    category: "Guide",
    tags: ["épices indiennes", "cuisine indienne maison", "curcuma", "cumin", "garam masala", "débutant"],
    seo: {
      metaTitle: "Épices indiennes essentielles : le guide pour débuter | Entre Maman et Moi",
      metaDescription:
        "Découvrez les 7 épices indiennes incontournables pour cuisiner indien chez vous : curcuma, cumin, coriandre, garam masala, cardamome, cannelle, moutarde noire.",
    },
    content: `<p>Quand on découvre la cuisine indienne, le rayon épices peut faire peur. Trop de noms, trop de couleurs, trop de promesses. La vérité&nbsp;? Avec <strong>seulement 7 épices bien choisies</strong>, vous pouvez déjà cuisiner 80&nbsp;% des plats indiens du quotidien. Voici notre sélection essentielle, transmise de mère en fille.</p>

<h2>1. Le curcuma (haldi) — l'âme dorée</h2>
<p>Le curcuma colore, parfume et soigne. C'est l'épice la plus utilisée en Inde&nbsp;: une demi-cuillère à café suffit pour donner ce jaune profond aux currys, riz et chutneys. Bonus santé&nbsp;: ses vertus anti-inflammatoires sont reconnues par la médecine ayurvédique depuis des millénaires.</p>
<p><em>À utiliser pour&nbsp;:</em> riz au citron, dahl, chutneys, marinades.</p>

<h2>2. Le cumin (jeera) — la base aromatique</h2>
<p>Si vous ne devez en acheter qu'une, prenez celle-là. Le cumin se torréfie à sec, se moud, se laisse tomber dans l'huile chaude. Son parfum chaleureux et terreux est le point de départ de presque tous les plats du Nord et du Sud de l'Inde.</p>
<p><em>Astuce&nbsp;:</em> achetez-le en graines plutôt qu'en poudre, il garde son arôme bien plus longtemps.</p>

<h2>3. La coriandre (dhaniya) — la fraîcheur</h2>
<p>La coriandre en graines apporte une note citronnée et légèrement sucrée. Elle équilibre le piquant et adoucit les sauces. C'est une des composantes principales du <em>garam masala</em>.</p>

<h2>4. Le garam masala — le mélange roi</h2>
<p>Pas vraiment une épice mais un <strong>mélange traditionnel</strong> qui change d'une famille à l'autre. La base&nbsp;: cardamome, cannelle, clou de girofle, poivre noir, cumin, coriandre. À ajouter en fin de cuisson pour préserver ses arômes volatils.</p>

<h2>5. La cardamome verte (elaichi) — la délicate</h2>
<p>Reine des desserts indiens (kheer, halwa, lassi sucré), elle parfume aussi le thé chai et certains currys royaux comme le <a href="/products/poulet-korma">poulet korma</a>. Trois ou quatre gousses suffisent.</p>

<h2>6. La cannelle (dalchini) — le confort</h2>
<p>Différente de notre cannelle européenne, plus douce, plus boisée. Indispensable dans les biryanis et certains chutneys.</p>

<h2>7. Les graines de moutarde noire (rai) — le sud de l'Inde</h2>
<p>Trop souvent oubliée en Occident, c'est pourtant l'épice signature de la cuisine du Sud de l'Inde. Elle pétille à la cuisson et donne du caractère aux dahl, sambars et raïtas.</p>

<h2>Comment les conserver&nbsp;?</h2>
<ul>
<li>Bocaux en verre opaques, à l'abri de la lumière</li>
<li>Loin des sources de chaleur (pas au-dessus du four&nbsp;!)</li>
<li>Les graines entières se gardent 1 an, les poudres 6 mois maximum</li>
</ul>

<h2>Et après&nbsp;?</h2>
<p>Avec ces 7 épices, vous pouvez déjà cuisiner un dahl, un riz parfumé, un chutney maison ou un poulet aux épices. Si vous voulez aller plus loin sans investir des centaines d'euros, jetez un œil à nos <a href="/kits/decouverte">kits Découverte</a>&nbsp;: tout est dosé, prêt à cuisiner, avec la fiche recette pas à pas.</p>

<p><em>Et n'oubliez jamais le secret de ma maman&nbsp;:</em> <strong>une bonne cuisine indienne, ce n'est pas une question de quantité d'épices, mais de patience.</strong></p>`,
  },
  {
    title: "Recette du riz au citron indien (Nimbu Chawal) façon traditionnelle",
    slug: "recette-riz-au-citron-nimbu-chawal",
    excerpt:
      "Le nimbu chawal, ce riz parfumé au citron, à la moutarde noire et au curcuma, est un classique du Sud de l'Inde. Voici la recette transmise de génération en génération.",
    coverImage: "https://i.ibb.co/20jSHkwJ/Riz-au-citron.jpg",
    category: "Recettes",
    tags: ["riz au citron", "nimbu chawal", "recette indienne", "cuisine du sud", "végétarien"],
    seo: {
      metaTitle: "Recette du riz au citron indien (Nimbu Chawal) | Entre Maman et Moi",
      metaDescription:
        "Apprenez à cuisiner le nimbu chawal, un riz au citron indien traditionnel : ingrédients, étapes pas à pas, astuces de famille pour un parfum incomparable.",
    },
    content: `<p>Si vous demandez à n'importe quelle famille du Tamil Nadu ou du Karnataka quel est leur plat de tous les jours, beaucoup vous répondront&nbsp;: <strong>le nimbu chawal</strong>. Un riz tout simple, parfumé au citron, à la moutarde noire et au curcuma. Frais, léger, prêt en 20&nbsp;minutes, il accompagne aussi bien un curry de légumes qu'un poulet rôti.</p>

<p>C'est aussi le plat dont je me souviens le plus de mon enfance&nbsp;: ma maman le préparait quand on rentrait fatigués de l'école, et il sentait bon dès qu'on poussait la porte.</p>

<h2>Les ingrédients (pour 4 personnes)</h2>
<ul>
<li>300&nbsp;g de riz basmati</li>
<li>2 citrons jaunes (jus uniquement)</li>
<li>1 cuillère à café de graines de moutarde noire</li>
<li>1/2 cuillère à café de curcuma en poudre</li>
<li>1 cuillère à café de graines de cumin</li>
<li>1 piment vert frais (optionnel, à doser selon vos goûts)</li>
<li>1 poignée de cacahuètes non salées</li>
<li>10 feuilles de curry frais (à défaut, en sec)</li>
<li>2 cuillères à soupe d'huile neutre</li>
<li>Sel</li>
</ul>

<h2>Étape 1 — Cuire le riz</h2>
<p>Rincez le riz basmati à l'eau froide jusqu'à ce qu'elle soit claire. Cuisez-le à la <strong>méthode pilaf</strong>&nbsp;: 1 volume de riz pour 1,5&nbsp;volume d'eau, sel, couvert, à feu doux pendant 12&nbsp;minutes. Laissez reposer 5&nbsp;minutes hors du feu, puis aérez à la fourchette.</p>

<h2>Étape 2 — Le tempérage des épices (tadka)</h2>
<p>C'est <em>l'étape clé</em>. Faites chauffer l'huile dans une grande poêle. Quand elle est bien chaude, ajoutez les graines de moutarde&nbsp;: elles doivent <strong>pétiller et sauter</strong> en quelques secondes (couvrez si besoin&nbsp;!). Ajoutez immédiatement le cumin, les feuilles de curry, le piment émincé et les cacahuètes. Laissez 30&nbsp;secondes.</p>

<h2>Étape 3 — Le mariage</h2>
<p>Hors du feu, ajoutez le curcuma puis versez le jus des 2 citrons. Mélangez. Ajoutez le riz cuit et mélangez délicatement pour ne pas le casser. Goûtez, rectifiez en sel et en citron.</p>

<h2>Servir</h2>
<p>Le nimbu chawal se déguste tiède ou froid. Il accompagne magnifiquement un dahl, un raïta, un poulet tandoori ou même tout seul, en lunch box. Pour un repas complet&nbsp;: <a href="/kits/familiale">le kit Festin du Maharaja</a> contient sa recette accompagnée d'un beef lemon rice et d'un raïta oignon.</p>

<h2>Les astuces de ma maman</h2>
<ul>
<li><strong>Toujours hors du feu pour le citron&nbsp;:</strong> sinon, ça devient amer.</li>
<li><strong>Laissez reposer 10 minutes</strong> avant de servir, le parfum se diffuse.</li>
<li>Le lendemain, c'est encore meilleur. Réchauffez à la poêle avec un peu d'eau.</li>
</ul>

<p><em>Et le plus important&nbsp;: cuisinez-le pour quelqu'un que vous aimez. C'est ça, la cuisine indienne.</em></p>`,
  },
  {
    title: "Comment composer un repas indien équilibré à la maison ?",
    slug: "composer-repas-indien-equilibre-maison",
    excerpt:
      "Plat principal, riz, raïta, chutney : la cuisine indienne suit une logique d'équilibre simple. On vous explique comment construire un menu indien complet sans complication.",
    coverImage: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg",
    category: "Conseils",
    tags: ["repas indien", "menu indien", "équilibre alimentaire", "cuisine maison", "traditions"],
    seo: {
      metaTitle: "Composer un repas indien équilibré à la maison : le guide pratique",
      metaDescription:
        "Apprenez la logique du repas indien traditionnel : protéines, féculents, légumes, condiments, hydratation. Notre méthode pour construire un menu complet en 30 minutes.",
    },
    content: `<p>Quand on pense cuisine indienne, on imagine souvent un curry compliqué, riche, qui prend des heures à mijoter. La réalité du quotidien des familles indiennes est pourtant à l'opposé&nbsp;: <strong>des repas équilibrés, simples, construits autour d'une logique précise</strong> — la même que tient ma maman depuis 30 ans.</p>

<p>Voici comment composer un vrai menu indien à la maison, étape par étape.</p>

<h2>La règle des 4 éléments</h2>
<p>Tout repas indien traditionnel articule <strong>4 piliers</strong>&nbsp;:</p>

<h3>1. Un féculent — le socle</h3>
<p>Riz basmati, naan, chapati, poori, pulao… le féculent représente environ <strong>40 %</strong> de l'assiette. Il absorbe les sauces, calme le piquant, rassasie.</p>

<h3>2. Un plat protéiné — le cœur</h3>
<p>Curry de viande, lentilles (dahl), poisson au lait de coco, paneer (fromage indien), légumes secs… c'est le plat principal, généralement en sauce, autour duquel tout s'organise.</p>

<h3>3. Un légume sec ou vert — la fraîcheur</h3>
<p>Aloo sabzi (pommes de terre épicées), épinards, chou-fleur masala, courgette… souvent un seul légume mais bien cuisiné. Pour un repas plus complet, on en sert deux.</p>

<h3>4. Les condiments — l'équilibre</h3>
<p>C'est là que la magie opère. <strong>Raïta</strong> (yaourt frais aux épices) pour adoucir, <strong>chutney</strong> pour relever, <strong>pickles</strong> pour piquer. Les condiments ne sont pas optionnels — ils sont le garant de l'équilibre du repas.</p>

<h2>Pourquoi cette logique fonctionne</h2>
<p>Cette construction respecte un principe ayurvédique millénaire&nbsp;: chaque repas doit contenir <strong>les six saveurs</strong> — sucré, salé, acide, amer, piquant, astringent. C'est pour ça qu'un repas indien laisse rarement sur sa faim ou avec un goût qui domine&nbsp;: tout est pensé pour s'équilibrer.</p>

<h2>Un menu type pour 4 personnes (30 minutes)</h2>
<ul>
<li><strong>Riz au citron</strong> (féculent + acidité)</li>
<li><strong>Poulet korma</strong> ou <a href="/products/prawn-curry">prawn curry</a> (protéine + onctueux)</li>
<li><strong>Aloo sabzi</strong> (légume + épices terreuses)</li>
<li><strong>Raïta concombre-menthe</strong> (fraîcheur + acidité)</li>
<li><strong>Lassi sucré</strong> en boisson (douceur)</li>
</ul>

<p>Vous avez là un repas <strong>complet, varié et équilibré</strong> en moins de 30 minutes si vous avez les épices déjà prêtes.</p>

<h2>Et si on n'a pas tout ça en stock&nbsp;?</h2>
<p>C'est exactement pour cette raison que j'ai créé <em>Entre Maman et Moi</em>. Nos <a href="/kits/familiale">kits familiaux</a> proposent un menu complet (3&nbsp;recettes complémentaires + tous les sachets d'épices dosés) pour ne plus avoir à se demander&nbsp;: «&nbsp;qu'est-ce que je mets avec quoi&nbsp;?&nbsp;»</p>

<h2>Les erreurs à éviter</h2>
<ul>
<li><strong>Trop de plats principaux</strong>&nbsp;: un seul curry suffit, le reste accompagne.</li>
<li><strong>Pas de raïta</strong>&nbsp;: c'est l'élément qui adoucit le piquant et permet de finir l'assiette confortablement.</li>
<li><strong>Manger sans pain</strong>&nbsp;: en Inde, on saucie&nbsp;! Naan, poori ou chapati, l'un des trois suffit.</li>
</ul>

<p><em>Le plus important&nbsp;: prenez votre temps. La cuisine indienne, c'est avant tout un moment de partage, jamais une course contre la montre.</em></p>`,
  },
];

// NB : le compte admin est désormais géré par src/lib/ensureAdmin.ts (appelé
// depuis connectDB, en dev ET en prod) à partir des variables d'environnement.

async function ensureBlogPosts() {
  const adminUser = await User.findOne({ email: "admin@demo.com" });
  if (!adminUser) return;

  for (const post of BLOG_POSTS) {
    const existing = await BlogPost.findOne({ slug: post.slug });
    if (existing) {
      // Sync content/seo so updates apply without recreating
      await BlogPost.updateOne(
        { slug: post.slug },
        {
          $set: {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            category: post.category,
            tags: post.tags,
            seo: post.seo,
            isPublished: true,
          },
        }
      );
      continue;
    }
    await BlogPost.create({
      ...post,
      author: adminUser._id,
      isPublished: true,
      publishedAt: new Date(),
    });
  }
}

// Les comptes démo ont été remplacés par le vrai compte admin de Viji
// (créé via scripts/setup-admin.mjs). Pour recréer un admin, utiliser ce script.

type ProductSeed = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  categorySlug: string;
  image: string;
  servings: string;
  contents: string;
  isFeatured?: boolean;
};

const CATEGORIES = [
  {
    name: "Kit Découverte",
    slug: "decouverte",
    description: "Kit à faire soi-même avec épices et recette emblématique pour une initiation toute en douceur.",
    image: "https://i.ibb.co/RT04pLXX/Samoussa.jpg",
    order: 1,
  },
  {
    name: "Kit Signature",
    slug: "signature",
    description: "Kit à faire soi-même, un plat indien complet, ingrédients dosés et pas à pas illustré.",
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    order: 2,
  },
  {
    name: "Kit Familiale",
    slug: "familiale",
    description: "Kit à faire soi-même, un repas généreux pour cuisiner et partager en famille.",
    image: "https://i.ibb.co/gLLnvsYg/Beef-Rice-Lemon.jpg",
    order: 3,
  },
  {
    name: "Ateliers Cuisine",
    slug: "ateliers",
    description: "Atelier convivial et entièrement guidé pour apprendre les bases de la cuisine indienne.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=800&fit=crop",
    order: 4,
  },
  {
    name: "Traiteur",
    slug: "traiteur",
    description: "Plats à emporter et traiteur événementiel, cuisine indienne authentique pour vos occasions.",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=1200&h=800&fit=crop",
    order: 5,
  },
];

const PRODUCTS: ProductSeed[] = [
  // ── Box Découverte ────────────────────────────────────────────────
  {
    name: "Chutney Tomate authentique",
    slug: "chutney-tomate",
    shortDescription: "Un chutney riche en goût, recette traditionnelle du Sud de l'Inde. Idéal pour accompagner plats, snacks et apéritifs.",
    description: "<p>Un chutney savoureux préparé selon une recette familiale du Sud de l'Inde. Parfait pour accompagner vos plats, snacks ou en apéritif, il offre une saveur intense et parfumée qui fait voyager les papilles.</p><h3>Contenu de la box</h3><ul><li>4 sachets d'épices soigneusement dosés</li><li>1 fiche recette détaillée pas à pas</li><li>Instructions de conservation</li></ul><h3>Pour qui ?</h3><p>Cette box est idéale pour 2 personnes, parfaite pour une initiation aux chutneys indiens.</p>",
    price: 1300,
    categorySlug: "decouverte",
    image: "https://i.ibb.co/vCvRn5N0/Chutney-Tomate.jpg",
    servings: "2 personnes",
    contents: "4 sachets d'épices + 1 recette",
    isFeatured: true,
  },
  {
    name: "Chutney de mangue",
    slug: "chutney-mangue",
    shortDescription: "Un équilibre parfait entre acidité, douceur et épices. Idéal pour tremper, napper ou partager à l'apéritif.",
    description: "<p>Un chutney à la mangue qui marie douceur et intensité. Parfait pour tremper des naans, napper des viandes blanches ou simplement partager à l'apéritif. Chaque cuillère apporte chaleur et profondeur.</p><h3>Contenu de la box</h3><ul><li>5 sachets d'épices</li><li>1 fiche recette pas à pas</li></ul>",
    price: 1300,
    categorySlug: "decouverte",
    image: "https://i.ibb.co/RTtVzWbJ/Chutney.jpg",
    servings: "2 personnes",
    contents: "5 sachets d'épices + 1 recette",
    isFeatured: true,
  },
  {
    name: "Samoussa traditionnel",
    slug: "samoussa",
    shortDescription: "Le feuilleté triangulaire emblématique, à base de pommes de terre et d'oignons relevés d'épices savoureuses.",
    description: "<p>Le feuilleté triangulaire emblématique de la cuisine indienne, préparé selon une recette traditionnelle à base de pommes de terre et d'oignons relevés d'épices. Un snack irrésistible à déguster à l'apéritif ou comme encas gourmand.</p><h3>Contenu de la box</h3><ul><li>3 sachets d'épices</li><li>1 fiche recette détaillée</li></ul>",
    price: 1400,
    categorySlug: "decouverte",
    image: "https://i.ibb.co/RT04pLXX/Samoussa.jpg",
    servings: "2 personnes",
    contents: "3 sachets d'épices + 1 recette",
    isFeatured: true,
  },

  // ── Box Signature ─────────────────────────────────────────────────
  {
    name: "Prawn Curry des côtes",
    slug: "prawn-curry",
    shortDescription: "Un curry de crevettes inspiré des traditions côtières de l'Inde, généreux en épices et en saveurs.",
    description: "<p>Un curry parfumé inspiré des traditions côtières de l'Inde. Préparé avec des épices typiques, il offre une explosion de saveurs qui sublime vos plats et vos repas conviviaux.</p><h3>Contenu de la box</h3><ul><li>6 sachets d'épices</li><li>1 fiche recette pas à pas</li></ul>",
    price: 2000,
    categorySlug: "signature",
    image: "https://i.ibb.co/rRBb7kvC/Prawn-Curry.jpg",
    servings: "2 à 3 personnes",
    contents: "6 sachets d'épices + 1 recette",
    isFeatured: true,
  },
  {
    name: "Poulet Tandoori",
    slug: "poulet-tandoori",
    shortDescription: "Un classique du Pendjab, préparé selon une recette aux épices emblématiques du tandoor traditionnel.",
    description: "<p>Un classique du Pendjab, préparé avec les épices emblématiques du tandoor. Le poulet devient parfumé et intense, idéal pour un repas savoureux ou un encas gourmand qui transporte les sens en Inde.</p><h3>Contenu de la box</h3><ul><li>3 sachets d'épices</li><li>1 fiche recette</li></ul>",
    price: 1700,
    categorySlug: "signature",
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    servings: "2 à 3 personnes",
    contents: "3 sachets d'épices + 1 recette",
    isFeatured: true,
  },
  {
    name: "Poulet Korma",
    slug: "poulet-korma",
    shortDescription: "Un plat raffiné inspiré des palais moghols : poulet, épices douces et lait de coco.",
    description: "<p>Un plat raffiné inspiré des palais moghols, qui combine poulet, épices douces et lait de coco. À savourer avec du riz pour un moment gourmand à partager.</p><h3>Contenu de la box</h3><ul><li>8 sachets d'épices</li><li>1 fiche recette</li></ul>",
    price: 2500,
    categorySlug: "signature",
    image: "https://i.ibb.co/Ldqj1Qc8/Poulet-korma.jpg",
    servings: "2 à 3 personnes",
    contents: "8 sachets d'épices + 1 recette",
    isFeatured: true,
  },

  // ── Box Familiale ─────────────────────────────────────────────────
  {
    name: "Le Festin du Maharaja",
    slug: "festin-maharaja",
    shortDescription: "Riz au citron, Beef Lemon Rice et Raita oignon : un repas complet et harmonieux pour 4 à 6 personnes.",
    description: "<p>Partagez un repas gourmand et authentique. Trois recettes complémentaires pour un menu complet :</p><h3>Riz au citron, légèreté et fraîcheur</h3><p>Le nimbu chawal, riz parfumé au citron et aux épices, apporte une note légère et parfumée qui prépare le palais pour les saveurs plus riches du Beef Lemon Rice.</p><h3>Beef Lemon Rice, saveurs intenses</h3><p>Le bœuf cuisiné aux épices indiennes complète le riz citronné, ajoutant profondeur et caractère au repas tout en restant parfaitement équilibré.</p><h3>Raita oignon, douceur et équilibre</h3><p>Le yaourt aux oignons et aux épices apporte fraîcheur et douceur, harmonisant les saveurs du riz citronné et du Beef Lemon Rice pour un repas complet, équilibré et savoureux.</p>",
    price: 4300,
    categorySlug: "familiale",
    image: "https://i.ibb.co/gLLnvsYg/Beef-Rice-Lemon.jpg",
    servings: "4 à 6 personnes",
    contents: "13 sachets d'épices + 3 recettes",
  },
  {
    name: "Les Saveurs Festives",
    slug: "saveurs-festives",
    shortDescription: "Poori, Aloo Sabzi et Raïta : un festin convivial et authentique pour toute la famille.",
    description: "<p>Un festin convivial et authentique :</p><h3>Poori, le pain festif</h3><p>Pain frit gonflé et doré, symbole des repas traditionnels et des fêtes indiennes. Idéal pour accompagner les plats chauds et partager des moments conviviaux en famille.</p><h3>Aloo Sabzi, tradition et saveur</h3><p>Pommes de terre aux épices, préparées selon les traditions végétariennes indiennes. Sa chaleur et son parfum se marient parfaitement avec le poori, créant un duo réconfortant et savoureux.</p><h3>Raïta, fraîcheur et équilibre</h3><p>Yaourt au concombre et aux épices, rafraîchissant et léger. Il contrebalance les saveurs chaudes et épicées de l'aloo sabzi et complète le poori, offrant un repas harmonieux, équilibré et gourmand.</p>",
    price: 3300,
    categorySlug: "familiale",
    image: "https://i.ibb.co/V0zrhQHt/Poori.jpg",
    servings: "4 à 6 personnes",
    contents: "16 sachets d'épices + 3 recettes",
  },
  {
    name: "Le Banquet de Goa",
    slug: "banquet-goa",
    shortDescription: "Vindaye, Jeera Pulao et Classic Raïta : saveurs côtières indiennes pour un repas complet.",
    description: "<p>Inspiré des saveurs de Goa :</p><h3>Vindaye, saveurs indiennes</h3><p>Inspiré du célèbre vindaloo de Goa, ce plat met en valeur les épices et parfums indiens traditionnels. Riche et intense, il est le cœur savoureux de votre repas.</p><h3>Jeera Pulao, riz au cumin parfumé</h3><p>Riz léger et subtilement parfumé au cumin, parfait pour accompagner le vindaye. Sa douceur et son parfum délicat équilibrent les saveurs épicées du plat principal, créant un ensemble harmonieux et convivial.</p><h3>Classic Raïta, fraîcheur et équilibre</h3><p>Yaourt crémeux aux crudités et épices, il apporte fraîcheur et douceur, contrebalançant les épices du vindaye et complétant le riz. Un repas complet, authentique et parfaitement équilibré.</p>",
    price: 4100,
    categorySlug: "familiale",
    image: "https://i.ibb.co/Gv2r1Hk6/Vindaye.jpg",
    servings: "4 à 6 personnes",
    contents: "12 sachets d'épices + 3 recettes",
  },

  // ── Ateliers ─────────────────────────────────────────────────────
  // ── Traiteur à emporter ──────────────────────────────────────────
  {
    name: "Poulet Tikka Masala (part)",
    slug: "traiteur-tikka-masala",
    shortDescription: "Une part généreuse de poulet tikka masala, riche et parfumée. Servi avec son riz basmati.",
    description: "<p>Poulet mariné aux épices, mijoté dans une sauce tomate-crème parfumée. Servi en portion individuelle avec riz basmati.</p>",
    price: 1400,
    categorySlug: "traiteur",
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    servings: "1 part",
    contents: "Poulet tikka + riz basmati",
  },
  {
    name: "Curry de légumes (part)",
    slug: "traiteur-curry-legumes",
    shortDescription: "Curry végétarien de saison aux épices indiennes. Doux et réconfortant.",
    description: "<p>Mélange de légumes de saison cuisinés dans une sauce au lait de coco, gingembre et épices douces.</p>",
    price: 1100,
    categorySlug: "traiteur",
    image: "https://i.ibb.co/mCVfbfqp/Aloo.jpg",
    servings: "1 part",
    contents: "Curry végétarien + riz",
  },
  {
    name: "Plateau Découverte 4 plats",
    slug: "traiteur-plateau-4-plats",
    shortDescription: "Sélection de 4 spécialités indiennes : 1 viande, 1 légume, 1 riz, 1 raïta.",
    description: "<p>Un plateau gourmand à partager ou pour un repas complet, avec un assortiment équilibré de saveurs indiennes.</p>",
    price: 3200,
    categorySlug: "traiteur",
    image: "https://i.ibb.co/gLLnvsYg/Beef-Rice-Lemon.jpg",
    servings: "1 à 2 personnes",
    contents: "4 spécialités indiennes",
  },

  // ── Ateliers ─────────────────────────────────────────────────────
  {
    name: "Atelier Cuisine Indienne",
    slug: "atelier-cuisine-indienne",
    shortDescription: "Une expérience conviviale et entièrement guidée. Tout est fourni : ingrédients, épices, matériel et tablier.",
    description: "<p><strong>Une expérience conviviale et entièrement guidée !</strong></p><p>Participez à un atelier complet où tout est fourni : <strong>ingrédients, épices, matériel et tablier</strong>. Sous ma guidance, vous découvrirez les secrets de la cuisine indienne, les techniques fondamentales et l'équilibre des saveurs.</p><h3>Menu de la session</h3><p>Poulet aux pommes de terre avec son riz au citron accompagné d'un raita oignon et d'un lassi salé.</p><h3>Au programme</h3><p>Apprentissage des épices essentielles (curcuma, cumin etc.), préparation de bases classiques, cuisson lente et astuces pour reproduire les plats chez vous.</p><h3>Moment convivial</h3><p>Dégustation du repas sur place, partage et échange avec les autres participants dans une ambiance chaleureuse.</p><h3>Participation des enfants</h3><p>Gratuite pour les enfants de 6 ans et moins.</p><h3>Option emporter</h3><p>Si vous ne pouvez pas finir le repas sur place, vous pouvez emporter vos plats dans vos propres contenants.</p><h3>Adaptations alimentaires</h3><p>Gestion des allergies courantes (à préciser à la réservation).</p><h3>Date prochaine session</h3><p>DATE À VENIR</p><h3>Horaires</h3><p>10H – 12H30</p><h3>Lieu</h3><p>Adresse à venir (région rennaise)</p>",
    price: 6000,
    categorySlug: "ateliers",
    image: "https://i.ibb.co/qLvzCsJS/Viji.jpg",
    servings: "Sur place",
    contents: "Atelier 2h30, tout fourni",
  },
];

async function ensureAtelierSessions() {
  const count = await AtelierSession.countDocuments();
  if (count > 0) {
    // Reseed minimal : si une session du fichier n'est pas en base, on l'ajoute.
    for (let i = 0; i < ATELIER_SESSIONS.length; i++) {
      const s = ATELIER_SESSIONS[i];
      const exists = await AtelierSession.findOne({ slug: s.slug }).lean();
      if (!exists) {
        await AtelierSession.create({ ...s, order: i, isActive: true });
        console.log(`[db] Added missing atelier session: ${s.slug}`);
      }
    }

    // Migration des anciens documents : si occurrences est vide alors qu'on a
    // les champs legacy date/schedule/location au root, on les transforme en
    // une seule occurrence. Permet l'évolution multi-lieux sans wipe.
    const legacyDocs = await AtelierSession.find({
      $or: [{ occurrences: { $exists: false } }, { occurrences: { $size: 0 } }],
    }).lean();
    for (const doc of legacyDocs) {
      if (doc.date && doc.schedule && doc.location) {
        await AtelierSession.updateOne(
          { _id: doc._id },
          {
            $set: {
              occurrences: [
                {
                  date: doc.date,
                  dateISO: doc.dateISO,
                  schedule: doc.schedule,
                  location: doc.location,
                },
              ],
            },
          }
        );
        console.log(`[db] Migrated atelier session to occurrences: ${doc.slug}`);
      }
    }
    return;
  }

  await AtelierSession.insertMany(
    ATELIER_SESSIONS.map((s, i) => ({
      ...s,
      order: i,
      isActive: true,
    }))
  );
  console.log("[db] Seeded atelier sessions.");
}

export async function ensureDevSeed(_uri: string) {
  if (process.env.NODE_ENV === "production") return;

  await ensureBlogPosts();
  await ensureAtelierSessions();

  const existing = await Category.countDocuments();
  if (existing > 0) {
    // Sync category & product data from seed so updated names/photos/prices appear
    // without wiping the DB (orders, carts, users stay intact).
    for (const c of CATEGORIES) {
      await Category.updateOne({ slug: c.slug }, { $set: { image: c.image, description: c.description } });
    }
    for (const p of PRODUCTS) {
      await Product.updateOne(
        { slug: p.slug },
        {
          $set: {
            name: p.name,
            shortDescription: p.shortDescription,
            description: p.description,
            price: p.price,
            "images.0.url": p.image,
            "images.0.alt": p.name,
          },
        }
      );
    }
    // Propage les nouveaux champs social (ex. youtube) vers le document
    // SiteSettings déjà existant sans écraser les autres réglages.
    await SiteSettings.updateOne(
      {},
      {
        $set: {
          "social.youtube": "https://www.youtube.com/@EntreMamanetMoi",
          contactEmail: "entremamanetmoicook@gmail.com",
          address: "3 rue de la Libération, 35770 Vern-sur-Seiche, France",
        },
      },
      { upsert: false }
    );
    console.log("[db] Synced seed data on existing dev DB.");
    return;
  }

  console.log("[db] Seeding dev data for Entre Maman et Moi…");

  const catDocs = await Category.insertMany(
    CATEGORIES.map((c) => ({ ...c, isActive: true }))
  );
  const catBySlug: Record<string, mongoose.Types.ObjectId> = {};
  catDocs.forEach((d) => {
    catBySlug[d.slug] = d._id as mongoose.Types.ObjectId;
  });

  await Product.insertMany(
    PRODUCTS.map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      category: catBySlug[p.categorySlug],
      images: [{ url: p.image, alt: p.name, order: 0 }],
      stock: 100,
      isActive: true,
      isFeatured: !!p.isFeatured,
      tags: [p.servings, p.contents],
      seo: { metaTitle: p.name, metaDescription: p.shortDescription },
    }))
  );

  await SiteSettings.create({
    shopName: "Entre Maman et Moi",
    shopDescription:
      "Box culinaires indiennes et ateliers de cuisine. Voyagez au cœur de l'Inde depuis votre cuisine.",
    contactEmail: "entremamanetmoicook@gmail.com",
    contactPhone: "",
    address: "3 rue de la Libération, 35770 Vern-sur-Seiche, France",
    currency: "EUR",
    shipping: {
      mondialRelayEnabled: true,
      homeDeliveryEnabled: false,
      pickupRate: 590,
      pickupFreeThreshold: 8000,
    },
    // Entrepreneur individuel récemment créé : par défaut en franchise en base de TVA
    // (à confirmer avec Viji — si elle est assujettie, basculer rate sur 20).
    tax: { rate: 0, pricesIncludeTax: true, label: "TVA non applicable, art. 293 B du CGI" },
    // Cartes cadeaux activées par défaut en dev pour pouvoir tester la page
    // publique /cartes-cadeaux sans étape manuelle (le seed ne tourne qu'en dev).
    giftCards: {
      enabled: true,
      presets: [
        { amount: 2500, label: "Découverte" },
        { amount: 5000, label: "Plaisir" },
        { amount: 7500, label: "Gourmand" },
        { amount: 10000, label: "Prestige" },
      ],
      expiryMonths: 0,
    },
    invoice: { enabled: false, prefix: "FAC-", nextNumber: 1 },
    analytics: {},
    integrations: {},
    social: {
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      tiktok: "https://tiktok.com/",
      youtube: "https://www.youtube.com/@EntreMamanetMoi",
    },
    legal: {
      siret: "95325440600028",
      tva: "FR15953254406",
      legalForm: "Entrepreneur individuel",
    },
    apiKeys: {},
  });

  console.log(`[db] Seed done — ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`);
}
