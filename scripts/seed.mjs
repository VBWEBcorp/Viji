import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vbweb:mwLtZRnKL40UGo6q@vbweb.mdm1f65.mongodb.net/template-ecommerce";

// Schemas inline (pas de TS, juste pour le seed)
const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  image: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  filters: [{
    name: String,
    type: { type: String, enum: ["select", "multiselect", "range", "color"] },
    options: [String],
    unit: String,
  }],
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  shortDescription: String,
  price: Number,
  compareAtPrice: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  images: [{ url: String, alt: String, order: Number }],
  variants: [{
    name: String,
    options: [{ value: String, priceModifier: Number, stock: Number, sku: String }],
  }],
  stock: { type: Number, default: 0 },
  sku: String,
  weight: Number,
  tags: [String],
  fulfillmentType: { type: String, default: "self" },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function seed() {
  console.log("Connexion a MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connecte.");

  // Clean
  await Category.deleteMany({});
  await Product.deleteMany({});
  console.log("Collections nettoyees.");

  // Categories
  const catHauts = await Category.create({
    name: "Hauts", slug: "hauts",
    description: "T-shirts, chemises, pulls et sweats",
    isActive: true, order: 1,
    filters: [
      { name: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { name: "Couleur", type: "color", options: ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert"] },
      { name: "Matiere", type: "select", options: ["Coton", "Lin", "Polyester", "Laine"] },
    ],
  });

  const catBas = await Category.create({
    name: "Bas", slug: "bas",
    description: "Pantalons, jeans, shorts",
    isActive: true, order: 2,
    filters: [
      { name: "Taille", type: "select", options: ["36", "38", "40", "42", "44", "46"] },
      { name: "Couleur", type: "color", options: ["Noir", "Bleu", "Beige", "Gris"] },
      { name: "Coupe", type: "select", options: ["Slim", "Regular", "Wide", "Straight"] },
    ],
  });

  const catVestes = await Category.create({
    name: "Vestes & Manteaux", slug: "vestes-manteaux",
    description: "Blousons, vestes, manteaux et doudounes",
    isActive: true, order: 3,
    filters: [
      { name: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL"] },
      { name: "Style", type: "select", options: ["Casual", "Formel", "Sportswear"] },
    ],
  });

  const catAccessoires = await Category.create({
    name: "Accessoires", slug: "accessoires",
    description: "Sacs, ceintures, bonnets, echarpes",
    isActive: true, order: 4,
    filters: [
      { name: "Type", type: "select", options: ["Sac", "Ceinture", "Bonnet", "Echarpe", "Lunettes"] },
      { name: "Couleur", type: "color", options: ["Noir", "Marron", "Beige"] },
    ],
  });

  const catChaussures = await Category.create({
    name: "Chaussures", slug: "chaussures",
    description: "Sneakers, boots, sandales",
    isActive: true, order: 5,
    filters: [
      { name: "Pointure", type: "select", options: ["38", "39", "40", "41", "42", "43", "44", "45"] },
      { name: "Style", type: "select", options: ["Sneakers", "Boots", "Sandales", "Classiques"] },
    ],
  });

  console.log("5 categories creees.");

  // Products
  const products = [
    {
      name: "T-shirt Essential Coton Bio",
      slug: "t-shirt-essential-coton-bio",
      description: "<p>Le basique parfait. Coupe droite en coton biologique certifie GOTS. Doux au toucher, respirant et durable. Fabrique au Portugal.</p><h3>Caracteristiques</h3><ul><li>100% coton biologique GOTS</li><li>Grammage 180g/m2</li><li>Coupe droite</li><li>Lavable a 30°</li></ul>",
      shortDescription: "T-shirt en coton bio, coupe droite, le basique indispensable.",
      price: 3500, compareAtPrice: 4500, category: catHauts._id,
      images: [
        { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop", alt: "T-shirt blanc coton bio", order: 0 },
        { url: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&h=1000&fit=crop", alt: "T-shirt blanc porte", order: 1 },
      ],
      variants: [{ name: "Taille", options: [
        { value: "S", priceModifier: 0, stock: 15, sku: "TSH-S" },
        { value: "M", priceModifier: 0, stock: 25, sku: "TSH-M" },
        { value: "L", priceModifier: 0, stock: 20, sku: "TSH-L" },
        { value: "XL", priceModifier: 0, stock: 10, sku: "TSH-XL" },
      ]}],
      stock: 70, sku: "TSH-ESS", weight: 180, tags: ["coton-bio", "basique", "bestseller"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "T-shirt Coton Bio Homme | Basique Premium", metaDescription: "T-shirt essentiel en coton biologique GOTS. Coupe droite, fabrication portugaise. Livraison 24-48h. Retours gratuits." },
    },
    {
      name: "Chemise Oxford Slim Bleu Ciel",
      slug: "chemise-oxford-slim",
      description: "<p>Chemise Oxford en coton brosse. Coupe slim moderne, col boutonne. Parfaite du bureau au weekend.</p><h3>Details</h3><ul><li>100% coton Oxford brosse</li><li>Col boutonne</li><li>Poignet ajustable</li></ul>",
      shortDescription: "Chemise Oxford coupe slim, coton brosse premium.",
      price: 6900, category: catHauts._id,
      images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop", alt: "Chemise Oxford bleu ciel", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "S", priceModifier: 0, stock: 8, sku: "CHM-S" },
        { value: "M", priceModifier: 0, stock: 12, sku: "CHM-M" },
        { value: "L", priceModifier: 0, stock: 10, sku: "CHM-L" },
      ]}],
      stock: 30, sku: "CHM-OXF", weight: 250, tags: ["chemise", "oxford", "slim"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Chemise Oxford Slim Homme | Coton Brosse", metaDescription: "Chemise Oxford slim en coton brosse premium. Col boutonne, coupe ajustee. Du bureau au weekend." },
    },
    {
      name: "Sweat a Capuche Oversize Anthracite",
      slug: "sweat-capuche-oversize",
      description: "<p>Sweat a capuche oversize en molleton gratte 400g. Coupe ample et confortable. Poche kangourou.</p><h3>Composition</h3><ul><li>80% coton / 20% polyester</li><li>Molleton gratte interieur</li><li>400g/m2</li></ul>",
      shortDescription: "Sweat oversize en molleton epais, ultra confortable.",
      price: 7900, category: catHauts._id,
      images: [
        { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop", alt: "Sweat a capuche anthracite", order: 0 },
        { url: "https://images.unsplash.com/photo-1578768079470-0a4536543789?w=800&h=1000&fit=crop", alt: "Sweat detail dos", order: 1 },
      ],
      variants: [{ name: "Taille", options: [
        { value: "M", priceModifier: 0, stock: 18, sku: "SWT-M" },
        { value: "L", priceModifier: 0, stock: 15, sku: "SWT-L" },
        { value: "XL", priceModifier: 0, stock: 12, sku: "SWT-XL" },
      ]}],
      stock: 45, sku: "SWT-OVR", weight: 500, tags: ["sweat", "oversize", "confort"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Sweat Capuche Oversize | Molleton Epais 400g", metaDescription: "Sweat a capuche oversize en molleton gratte 400g. Coupe ample, poche kangourou. Le confort ultime." },
    },
    {
      name: "Pull Col Roule Laine Merinos Noir",
      slug: "pull-col-roule-merinos",
      description: "<p>Pull col roule en laine merinos extra-fine. Doux, leger et chaud. Jauge fine pour un tomber elegant.</p><h3>Entretien</h3><ul><li>100% laine merinos extra-fine</li><li>Lavage a la main recommande</li><li>Sechage a plat</li></ul>",
      shortDescription: "Pull col roule en laine merinos extra-fine.",
      price: 9900, compareAtPrice: 12900, category: catHauts._id,
      images: [{ url: "https://images.unsplash.com/photo-1638718984352-3060f6e8f6ac?w=800&h=1000&fit=crop", alt: "Pull col roule noir merinos", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "S", priceModifier: 0, stock: 8, sku: "PUL-S" },
        { value: "M", priceModifier: 0, stock: 12, sku: "PUL-M" },
        { value: "L", priceModifier: 0, stock: 10, sku: "PUL-L" },
      ]}],
      stock: 30, sku: "PUL-MER", weight: 300, tags: ["pull", "merinos", "col-roule", "bestseller"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Pull Col Roule Merinos | Laine Extra-Fine", metaDescription: "Pull col roule en laine merinos extra-fine. Doux, leger et elegant. -23% de reduction." },
    },
    {
      name: "Jean Slim Stretch Indigo",
      slug: "jean-slim-stretch-indigo",
      description: "<p>Jean slim en denim stretch japonais. Coupe ajustee sans comprimer. Teinture indigo authentique qui se patine avec le temps.</p><h3>Composition</h3><ul><li>98% coton / 2% elasthanne</li><li>Denim japonais 12oz</li><li>Teinture rope dye</li></ul>",
      shortDescription: "Jean slim en denim stretch japonais, teinture indigo.",
      price: 8900, category: catBas._id,
      images: [{ url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop", alt: "Jean slim indigo", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "38", priceModifier: 0, stock: 10, sku: "JNS-38" },
        { value: "40", priceModifier: 0, stock: 15, sku: "JNS-40" },
        { value: "42", priceModifier: 0, stock: 12, sku: "JNS-42" },
        { value: "44", priceModifier: 0, stock: 8, sku: "JNS-44" },
      ]}],
      stock: 45, sku: "JNS-SLM", weight: 600, tags: ["jean", "slim", "denim", "japonais"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Jean Slim Stretch Indigo | Denim Japonais", metaDescription: "Jean slim en denim stretch japonais 12oz. Teinture indigo rope dye. Coupe ajustee confortable." },
    },
    {
      name: "Pantalon Chino Regular Beige",
      slug: "pantalon-chino-regular",
      description: "<p>Chino en twill de coton avec un soupcon d'elasthanne. Coupe regular confortable.</p>",
      shortDescription: "Chino coton twill, coupe regular polyvalente.",
      price: 5900, category: catBas._id,
      images: [{ url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop", alt: "Chino beige regular", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "40", priceModifier: 0, stock: 14, sku: "CHN-40" },
        { value: "42", priceModifier: 0, stock: 16, sku: "CHN-42" },
        { value: "44", priceModifier: 0, stock: 10, sku: "CHN-44" },
      ]}],
      stock: 40, sku: "CHN-REG", weight: 450, tags: ["chino", "coton", "classique"],
      isActive: true, isFeatured: false,
      seo: { metaTitle: "Chino Regular Homme | Coton Twill Beige", metaDescription: "Pantalon chino regular en twill de coton. Polyvalent du bureau au weekend." },
    },
    {
      name: "Veste Workwear Coton Canvas Kaki",
      slug: "veste-workwear-coton-canvas",
      description: "<p>Veste d'inspiration workwear en coton canvas lourd. Poches plaquees, boutons pression.</p>",
      shortDescription: "Veste workwear en coton canvas, poches plaquees.",
      price: 12900, category: catVestes._id,
      images: [{ url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop", alt: "Veste workwear kaki", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "M", priceModifier: 0, stock: 8, sku: "VWK-M" },
        { value: "L", priceModifier: 0, stock: 10, sku: "VWK-L" },
        { value: "XL", priceModifier: 0, stock: 6, sku: "VWK-XL" },
      ]}],
      stock: 24, sku: "VWK-CNV", weight: 800, tags: ["veste", "workwear", "canvas"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Veste Workwear Canvas | Coton Epais Kaki", metaDescription: "Veste workwear en coton canvas lourd. Poches plaquees, boutons pression. Un classique indemodable." },
    },
    {
      name: "Doudoune Legere Compressible Noire",
      slug: "doudoune-legere-compressible",
      description: "<p>Doudoune ultra legere garnie de duvet recycle. Se compresse dans sa poche.</p>",
      shortDescription: "Doudoune legere, duvet recycle, compressible.",
      price: 14900, compareAtPrice: 18900, category: catVestes._id,
      images: [{ url: "https://images.unsplash.com/photo-1544923246-77307dd270cb?w=800&h=1000&fit=crop", alt: "Doudoune noire legere", order: 0 }],
      variants: [{ name: "Taille", options: [
        { value: "S", priceModifier: 0, stock: 6, sku: "DDN-S" },
        { value: "M", priceModifier: 0, stock: 10, sku: "DDN-M" },
        { value: "L", priceModifier: 0, stock: 8, sku: "DDN-L" },
      ]}],
      stock: 24, sku: "DDN-LGR", weight: 350, tags: ["doudoune", "legere", "recycle"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Doudoune Legere Compressible | Duvet Recycle", metaDescription: "Doudoune ultra legere en duvet recycle. Se compresse dans sa poche. -21% de reduction." },
    },
    {
      name: "Sac Tote Bag Toile & Cuir",
      slug: "sac-tote-bag-toile",
      description: "<p>Tote bag en toile de coton epais avec anses en cuir vegetal. Grand format.</p>",
      shortDescription: "Tote bag en toile epaisse, anses cuir vegetal.",
      price: 4500, category: catAccessoires._id,
      images: [{ url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=1000&fit=crop", alt: "Tote bag toile et cuir", order: 0 }],
      stock: 30, sku: "BAG-TOT", weight: 300, tags: ["sac", "tote", "coton"],
      isActive: true, isFeatured: false,
      seo: { metaTitle: "Tote Bag Toile & Cuir | Grand Format", metaDescription: "Tote bag en toile epaisse avec anses en cuir vegetal. Grand format, poche interieure." },
    },
    {
      name: "Bonnet Cote Laine Merinos Gris",
      slug: "bonnet-merinos-cote",
      description: "<p>Bonnet en laine merinos cotelee. Doux, chaud, anti-grattement. Taille unique.</p>",
      shortDescription: "Bonnet en laine merinos, doux et chaud.",
      price: 2900, category: catAccessoires._id,
      images: [{ url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&h=1000&fit=crop", alt: "Bonnet gris merinos", order: 0 }],
      stock: 50, sku: "BNT-MER", weight: 80, tags: ["bonnet", "merinos", "hiver"],
      isActive: true, isFeatured: false,
      seo: { metaTitle: "Bonnet Merinos Cote | Laine Douce", metaDescription: "Bonnet en laine merinos cotelee. Doux et chaud, anti-grattement. Taille unique." },
    },
    {
      name: "Sneakers Minimalistes Cuir Blanc",
      slug: "sneakers-minimalistes-cuir",
      description: "<p>Sneakers en cuir pleine fleur, design epure. Semelle en caoutchouc naturel.</p>",
      shortDescription: "Sneakers cuir pleine fleur, design minimaliste.",
      price: 13900, category: catChaussures._id,
      images: [
        { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop", alt: "Sneakers blanches cuir", order: 0 },
        { url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop", alt: "Sneakers profil", order: 1 },
      ],
      variants: [{ name: "Pointure", options: [
        { value: "40", priceModifier: 0, stock: 6, sku: "SNK-40" },
        { value: "41", priceModifier: 0, stock: 8, sku: "SNK-41" },
        { value: "42", priceModifier: 0, stock: 10, sku: "SNK-42" },
        { value: "43", priceModifier: 0, stock: 8, sku: "SNK-43" },
        { value: "44", priceModifier: 0, stock: 5, sku: "SNK-44" },
      ]}],
      stock: 37, sku: "SNK-MIN", weight: 700, tags: ["sneakers", "cuir", "minimaliste"],
      isActive: true, isFeatured: true,
      seo: { metaTitle: "Sneakers Cuir Blanc Minimalistes | Homme", metaDescription: "Sneakers minimalistes en cuir pleine fleur. Design epure, semelle caoutchouc naturel." },
    },
    {
      name: "Chelsea Boots Daim Marron",
      slug: "chelsea-boots-daim",
      description: "<p>Chelsea boots en daim souple. Semelle crantee, elastiques lateraux.</p>",
      shortDescription: "Chelsea boots en daim, semelle crantee.",
      price: 15900, category: catChaussures._id,
      images: [{ url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&h=1000&fit=crop", alt: "Chelsea boots daim marron", order: 0 }],
      variants: [{ name: "Pointure", options: [
        { value: "41", priceModifier: 0, stock: 5, sku: "CHE-41" },
        { value: "42", priceModifier: 0, stock: 7, sku: "CHE-42" },
        { value: "43", priceModifier: 0, stock: 6, sku: "CHE-43" },
      ]}],
      stock: 18, sku: "CHE-DAI", weight: 900, tags: ["boots", "chelsea", "daim"],
      isActive: true, isFeatured: false,
      seo: { metaTitle: "Chelsea Boots Daim Homme | Semelle Crantee", metaDescription: "Chelsea boots en daim souple. Semelle crantee, elastiques lateraux. Elegantes et polyvalentes." },
    },
  ];

  await Product.insertMany(products);
  console.log(`${products.length} produits crees.`);

  console.log("\nSeed termine !");
  console.log(`Categories: 5`);
  console.log(`Produits: ${products.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erreur seed:", err);
  process.exit(1);
});
