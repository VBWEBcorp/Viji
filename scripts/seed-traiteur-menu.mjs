// Remplace la carte traiteur en DB par la carte officielle de Viji
// (issue de la photo "ENTRE MAMAN ET MOI"). Sections : Entrée, Plats,
// Accompagnement, Condiment, Dessert, Boissons.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const Category = mongoose.connection.db.collection("categories");
const Product = mongoose.connection.db.collection("products");

const cat = await Category.findOne({ slug: "traiteur" });
if (!cat) {
  console.error("Catégorie 'traiteur' introuvable.");
  process.exit(1);
}

// La carte officielle. Le prix est en CENTIMES. L'image est piochée dans
// les visuels déjà uploadés sur ibb (à remplacer plus tard par les vrais
// shots des plats si Viji les fournit).
const MENU = [
  // ── Entrées ──
  {
    slug: "tr-badjis-oignons",
    name: "Badjis oignons",
    shortDescription: "4 pièces avec un chutney à la menthe",
    description: "<p>Beignets croustillants à l'oignon, parfumés aux épices indiennes. Servis avec leur chutney maison à la menthe.</p>",
    price: 500,
    image: "https://i.ibb.co/RTtVzWbJ/Chutney.jpg",
    section: "Entrée",
    sectionOrder: 0,
  },
  {
    slug: "tr-samoussas",
    name: "Samoussas",
    shortDescription: "4 pièces aux pommes de terre à l'indienne avec chutney à la tomate",
    description: "<p>Samoussas dorés et croustillants, garnis de pommes de terre épicées à l'indienne. Accompagnés d'un chutney maison à la tomate.</p>",
    price: 500,
    image: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg",
    section: "Entrée",
    sectionOrder: 1,
  },

  // ── Plats ──
  {
    slug: "tr-beef-lemon-rice",
    name: "Beef Lemon Rice",
    shortDescription: "Bœuf tendre avec pommes de terre et riz au jus de citron (halal)",
    description: "<p>Bœuf mijoté avec ses pommes de terre, servi avec un riz parfumé au jus de citron. Viande halal.</p>",
    price: 1600,
    image: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg",
    section: "Plats",
    sectionOrder: 0,
  },
  {
    slug: "tr-prawn-curry",
    name: "Prawn Curry",
    shortDescription: "Sauce coco, tomates aux crevettes, riz Basmati",
    description: "<p>Crevettes en sauce coco-tomate parfumée aux épices indiennes, accompagnées d'un riz Basmati.</p>",
    price: 1500,
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    section: "Plats",
    sectionOrder: 1,
  },
  {
    slug: "tr-padpadcurry",
    name: "Padpadcurry (végétarien)",
    shortDescription: "Curry indien parfumé, riz papadum intégré à la sauce",
    description: "<p>Curry végétarien parfumé, servi avec un riz et un papadum croustillant intégré à la sauce. 100 % végétarien.</p>",
    price: 1200,
    image: "https://i.ibb.co/mCVfbfqp/Aloo.jpg",
    section: "Plats",
    sectionOrder: 2,
  },

  // ── Accompagnement ──
  {
    slug: "tr-raita-oignon",
    name: "Raïta Oignon",
    shortDescription: "Yaourt crémeux aux oignons doux",
    description: "<p>Sauce traditionnelle au yaourt crémeux, oignons doux et épices, pour rafraîchir et accompagner les plats.</p>",
    price: 300,
    image: "https://i.ibb.co/KcVCgbMz/Raita-oignon.jpg",
    section: "Accompagnement",
    sectionOrder: 0,
  },

  // ── Condiment ──
  {
    slug: "tr-citron-confit",
    name: "Citron confit",
    shortDescription: "Condiment maison à base de citron confit aux épices",
    description: "<p>Citron confit indien parfumé aux épices, pour relever un plat ou un riz.</p>",
    price: 150,
    image: "https://i.ibb.co/F4318X0S/Ourka-citron.jpg",
    section: "Condiment",
    sectionOrder: 0,
  },

  // ── Dessert ──
  {
    slug: "tr-halwa",
    name: "Halwa",
    shortDescription: "Dessert traditionnel de semoule, à la cardamome",
    description: "<p>Dessert indien traditionnel à base de semoule, parfumé à la cardamome et au ghee.</p>",
    price: 120,
    image: "https://i.ibb.co/Kx5rKtGN/Halwa.jpg",
    section: "Dessert",
    sectionOrder: 0,
  },

  // ── Boissons ──
  {
    slug: "tr-lassi-sucre",
    name: "Lassi sucré",
    shortDescription: "Yaourt onctueux, sucré",
    description: "<p>Boisson indienne traditionnelle à base de yaourt fouetté, sucrée et parfumée.</p>",
    price: 350,
    image: "https://i.ibb.co/HfXy27N9/Lassi-sucr.jpg",
    section: "Boissons",
    sectionOrder: 0,
  },
  {
    slug: "tr-nimbu-pani",
    name: "Nimbu Pani",
    shortDescription: "Citronnade indienne",
    description: "<p>Boisson rafraîchissante au citron, sucre et eau, agrémentée d'une touche d'épices.</p>",
    price: 300,
    image: "https://i.ibb.co/tTqdZjjS/Citronade-indienne.jpg",
    section: "Boissons",
    sectionOrder: 1,
  },
];

// On supprime d'abord tous les anciens produits de la catégorie traiteur
// (les exemples du seed initial), puis on insère la vraie carte.
const removed = await Product.deleteMany({ category: cat._id });
console.log(`↻ Supprimé ${removed.deletedCount} anciens produits traiteur.`);

const now = new Date();
const docs = MENU.map((m) => ({
  name: m.name,
  slug: m.slug,
  description: m.description,
  shortDescription: m.shortDescription,
  price: m.price,
  category: cat._id,
  images: [{ url: m.image, alt: m.name, order: 0 }],
  variants: [],
  stock: 100,
  fulfillmentType: "self",
  tags: [],
  isActive: true,
  isFeatured: false,
  section: m.section,
  sectionOrder: m.sectionOrder,
  seo: { metaTitle: m.name, metaDescription: m.shortDescription },
  createdAt: now,
  updatedAt: now,
}));

const result = await Product.insertMany(docs);
console.log(`+ Inséré ${result.insertedCount} plats dans la carte traiteur.`);

await mongoose.disconnect();
