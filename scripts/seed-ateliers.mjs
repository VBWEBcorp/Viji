// Force-seed AtelierSession en DB depuis le fichier lib/ateliers-collectifs.
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

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI manquant.");
  process.exit(1);
}

await mongoose.connect(uri);
const col = mongoose.connection.db.collection("ateliersessions");

const SESSIONS = [
  {
    slug: "atelier-samoussa",
    shortTitle: "Atelier samoussa",
    title: "Atelier samoussa · pliage, garniture & cuisson",
    image: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg",
    occurrences: [
      { date: "Samedi 13 juin 2026", dateISO: "2026-06-13", schedule: "10h – 12h30", location: "Association Rennes" },
      { date: "Samedi 27 juin 2026", dateISO: "2026-06-27", schedule: "10h – 12h30", location: "Association Triangle" },
    ],
    price: 6000,
    intro:
      "Apprenez à plier, garnir et cuire les samoussas comme à la maison. Tout est fourni : pâte, garnitures, épices, matériel et tablier. Vous repartez avec vos samoussas et la technique pour les refaire chez vous.",
    menu: "Samoussas garnis (légumes et viande), chutney maison, accompagnement et boisson lassi.",
    program: [
      { title: "Au programme", body: "Préparation de la garniture épicée, technique de pliage des samoussas, cuisson maîtrisée et astuces pour reproduire à la maison." },
      { title: "Moment convivial", body: "Dégustation sur place, partage et échange avec les autres participants dans une ambiance chaleureuse." },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Vous repartez avec vos samoussas si vous ne finissez pas tout sur place." },
      { title: "Adaptations alimentaires", body: "Allergies et restrictions à préciser à la réservation." },
    ],
    isActive: true,
    order: 0,
  },
  {
    slug: "poulet-pommes-de-terre-riz-citron",
    shortTitle: "Poulet & riz au citron",
    title: "Poulet aux pommes de terre & riz au citron",
    image: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg",
    occurrences: [
      { date: "Samedi 6 juin 2026", dateISO: "2026-06-06", schedule: "10h – 12h30", location: "Association Rennes" },
    ],
    price: 6000,
    intro:
      "Une expérience conviviale et entièrement guidée. Tout est fourni : ingrédients, épices, matériel et tablier. Sous ma guidance, vous découvrez les secrets de la cuisine indienne, les techniques fondamentales et l'équilibre des saveurs.",
    menu: "Poulet aux pommes de terre avec son riz au citron, accompagné d'un raïta oignon et d'un lassi salé.",
    program: [
      { title: "Au programme", body: "Apprentissage des épices essentielles (curcuma, cumin, etc.), préparation des bases classiques, cuisson lente et astuces pour reproduire les plats chez vous." },
      { title: "Moment convivial", body: "Dégustation du repas sur place, partage et échange avec les autres participants dans une ambiance chaleureuse." },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Si vous ne pouvez pas finir le repas sur place, vous pouvez emporter vos plats dans vos propres contenants." },
      { title: "Adaptations alimentaires", body: "Gestion des allergies courantes (à préciser à la réservation)." },
    ],
    isActive: true,
    order: 1,
  },
  {
    slug: "poulet-tikka-masala",
    shortTitle: "Poulet tikka masala",
    title: "Poulet tikka masala & raïta",
    image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg",
    occurrences: [
      { date: "Samedi 20 juin 2026", dateISO: "2026-06-20", schedule: "10h – 12h30", location: "Association Triangle" },
    ],
    price: 6000,
    intro:
      "Un grand classique de la cuisine indienne : poulet mariné aux épices, mijoté dans une sauce tomate-crème parfumée. Tout est fourni, vous repartez avec les gestes, l'équilibre des épices et la recette.",
    menu: "Poulet tikka masala, riz basmati parfumé, raïta concombre, accompagné d'un lassi à la mangue.",
    program: [
      { title: "Au programme", body: "Préparation de la marinade tandoori, équilibre tomate-crème-épices, cuisson maîtrisée du poulet et techniques pour reproduire à la maison." },
      { title: "Moment convivial", body: "Dégustation sur place autour d'une grande tablée, échange avec les autres participants." },
    ],
    notes: [
      { title: "Participation des enfants", body: "Gratuite pour les enfants de 6 ans et moins." },
      { title: "Option emporter", body: "Vous pouvez repartir avec vos plats dans vos propres contenants si vous ne finissez pas sur place." },
      { title: "Adaptations alimentaires", body: "Allergies et restrictions à préciser à la réservation." },
    ],
    isActive: true,
    order: 2,
  },
];

const now = new Date();
let inserted = 0;
let updated = 0;

for (const s of SESSIONS) {
  const existing = await col.findOne({ slug: s.slug });
  if (existing) {
    await col.updateOne(
      { slug: s.slug },
      { $set: { ...s, updatedAt: now }, $setOnInsert: { createdAt: now } }
    );
    updated++;
    console.log(`↻ Mis à jour : ${s.slug}`);
  } else {
    await col.insertOne({ ...s, createdAt: now, updatedAt: now });
    inserted++;
    console.log(`+ Inséré : ${s.slug}`);
  }
}

console.log(`\nRésumé : ${inserted} inséré(s), ${updated} mis à jour.`);
await mongoose.disconnect();
