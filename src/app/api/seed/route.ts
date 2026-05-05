import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Category from "@/models/Category";
import Product from "@/models/Product";

// POST /api/seed — Seed demo data (admin only)
export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();

    // Check if already seeded
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      return NextResponse.json({ error: "Des produits existent deja. Supprimez-les d'abord." }, { status: 400 });
    }

    // ═══════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════
    const catHauts = await Category.create({
      name: "Hauts",
      slug: "hauts",
      description: "T-shirts, chemises, pulls et sweats",
      isActive: true,
      order: 1,
      filters: [
        { name: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
        { name: "Couleur", type: "color", options: ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Vert"] },
        { name: "Matiere", type: "select", options: ["Coton", "Lin", "Polyester", "Laine"] },
      ],
    });

    const catBas = await Category.create({
      name: "Bas",
      slug: "bas",
      description: "Pantalons, jeans, shorts",
      isActive: true,
      order: 2,
      filters: [
        { name: "Taille", type: "select", options: ["36", "38", "40", "42", "44", "46"] },
        { name: "Couleur", type: "color", options: ["Noir", "Bleu", "Beige", "Gris"] },
        { name: "Coupe", type: "select", options: ["Slim", "Regular", "Wide", "Straight"] },
      ],
    });

    const catVestes = await Category.create({
      name: "Vestes & Manteaux",
      slug: "vestes-manteaux",
      description: "Blousons, vestes, manteaux et doudounes",
      isActive: true,
      order: 3,
      filters: [
        { name: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL"] },
        { name: "Style", type: "select", options: ["Casual", "Formel", "Sportswear"] },
      ],
    });

    const catAccessoires = await Category.create({
      name: "Accessoires",
      slug: "accessoires",
      description: "Sacs, ceintures, bonnets, echarpes",
      isActive: true,
      order: 4,
      filters: [
        { name: "Type", type: "select", options: ["Sac", "Ceinture", "Bonnet", "Echarpe", "Lunettes"] },
        { name: "Couleur", type: "color", options: ["Noir", "Marron", "Beige"] },
      ],
    });

    const catChaussures = await Category.create({
      name: "Chaussures",
      slug: "chaussures",
      description: "Sneakers, boots, sandales",
      isActive: true,
      order: 5,
      filters: [
        { name: "Pointure", type: "select", options: ["38", "39", "40", "41", "42", "43", "44", "45"] },
        { name: "Style", type: "select", options: ["Sneakers", "Boots", "Sandales", "Classiques"] },
      ],
    });

    // ═══════════════════════════════════════
    // PRODUCTS — Images Unsplash (libres)
    // ═══════════════════════════════════════
    const products = [
      // HAUTS
      {
        name: "T-shirt Essential Coton Bio",
        slug: "t-shirt-essential-coton-bio",
        description: "<p>Le basique parfait. Coupe droite en coton biologique certifie GOTS. Doux au toucher, respirant et durable.</p><p>Fabrique au Portugal dans un atelier certifie. Lavable en machine a 30°.</p>",
        shortDescription: "T-shirt en coton bio, coupe droite, le basique indispensable.",
        price: 3500,
        compareAtPrice: 4500,
        category: catHauts._id,
        images: [
          { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop", alt: "T-shirt blanc", order: 0 },
          { url: "https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&h=1000&fit=crop", alt: "T-shirt porte", order: 1 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "S", priceModifier: 0, stock: 15, sku: "TSH-S" },
            { value: "M", priceModifier: 0, stock: 25, sku: "TSH-M" },
            { value: "L", priceModifier: 0, stock: 20, sku: "TSH-L" },
            { value: "XL", priceModifier: 0, stock: 10, sku: "TSH-XL" },
          ]},
        ],
        stock: 70,
        sku: "TSH-ESS",
        weight: 180,
        tags: ["coton-bio", "basique", "bestseller"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Chemise Oxford Slim",
        slug: "chemise-oxford-slim",
        description: "<p>Chemise Oxford en coton brosse. Coupe slim moderne, col boutonne. Parfaite du bureau au weekend.</p>",
        shortDescription: "Chemise Oxford coupe slim, coton brosse premium.",
        price: 6900,
        category: catHauts._id,
        images: [
          { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=1000&fit=crop", alt: "Chemise Oxford", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "S", priceModifier: 0, stock: 8, sku: "CHM-S" },
            { value: "M", priceModifier: 0, stock: 12, sku: "CHM-M" },
            { value: "L", priceModifier: 0, stock: 10, sku: "CHM-L" },
          ]},
        ],
        stock: 30,
        sku: "CHM-OXF",
        weight: 250,
        tags: ["chemise", "oxford", "slim"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Sweat a Capuche Oversize",
        slug: "sweat-capuche-oversize",
        description: "<p>Sweat a capuche oversize en molleton gratté 400g. Coupe ample et confortable. Poche kangourou. Le compagnon ideal des journees fraiches.</p>",
        shortDescription: "Sweat oversize en molleton epais, ultra confortable.",
        price: 7900,
        category: catHauts._id,
        images: [
          { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop", alt: "Sweat capuche", order: 0 },
          { url: "https://images.unsplash.com/photo-1578768079470-0a4536543789?w=800&h=1000&fit=crop", alt: "Sweat detail", order: 1 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "M", priceModifier: 0, stock: 18, sku: "SWT-M" },
            { value: "L", priceModifier: 0, stock: 15, sku: "SWT-L" },
            { value: "XL", priceModifier: 0, stock: 12, sku: "SWT-XL" },
          ]},
        ],
        stock: 45,
        sku: "SWT-OVR",
        weight: 500,
        tags: ["sweat", "oversize", "confort"],
        isActive: true,
        isFeatured: true,
      },
      // BAS
      {
        name: "Jean Slim Stretch Indigo",
        slug: "jean-slim-stretch-indigo",
        description: "<p>Jean slim en denim stretch japonais. Coupe ajustee sans comprimer. Teinture indigo authentique qui se patine avec le temps.</p>",
        shortDescription: "Jean slim en denim stretch japonais, teinture indigo.",
        price: 8900,
        category: catBas._id,
        images: [
          { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop", alt: "Jean slim", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "38", priceModifier: 0, stock: 10, sku: "JNS-38" },
            { value: "40", priceModifier: 0, stock: 15, sku: "JNS-40" },
            { value: "42", priceModifier: 0, stock: 12, sku: "JNS-42" },
            { value: "44", priceModifier: 0, stock: 8, sku: "JNS-44" },
          ]},
        ],
        stock: 45,
        sku: "JNS-SLM",
        weight: 600,
        tags: ["jean", "slim", "denim"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Pantalon Chino Regular",
        slug: "pantalon-chino-regular",
        description: "<p>Chino en twill de coton avec un soupcon d'elasthanne. Coupe regular confortable. Polyvalent : bureau, weekend, soiree.</p>",
        shortDescription: "Chino coton twill, coupe regular polyvalente.",
        price: 5900,
        category: catBas._id,
        images: [
          { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop", alt: "Chino beige", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "40", priceModifier: 0, stock: 14, sku: "CHN-40" },
            { value: "42", priceModifier: 0, stock: 16, sku: "CHN-42" },
            { value: "44", priceModifier: 0, stock: 10, sku: "CHN-44" },
          ]},
        ],
        stock: 40,
        sku: "CHN-REG",
        weight: 450,
        tags: ["chino", "coton", "classique"],
        isActive: true,
        isFeatured: false,
      },
      // VESTES
      {
        name: "Veste Workwear Coton Canvas",
        slug: "veste-workwear-coton-canvas",
        description: "<p>Veste d'inspiration workwear en coton canvas lourd. Poches plaquees, boutons pression. Un classique indemodable.</p>",
        shortDescription: "Veste workwear en coton canvas, poches plaquees.",
        price: 12900,
        category: catVestes._id,
        images: [
          { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop", alt: "Veste workwear", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "M", priceModifier: 0, stock: 8, sku: "VWK-M" },
            { value: "L", priceModifier: 0, stock: 10, sku: "VWK-L" },
            { value: "XL", priceModifier: 0, stock: 6, sku: "VWK-XL" },
          ]},
        ],
        stock: 24,
        sku: "VWK-CNV",
        weight: 800,
        tags: ["veste", "workwear", "canvas"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Doudoune Legere Compressible",
        slug: "doudoune-legere-compressible",
        description: "<p>Doudoune ultra legere garnie de duvet recycle. Se compresse dans sa poche. Parfaite en mi-saison ou en couche intermediaire.</p>",
        shortDescription: "Doudoune legere, duvet recycle, compressible.",
        price: 14900,
        compareAtPrice: 18900,
        category: catVestes._id,
        images: [
          { url: "https://images.unsplash.com/photo-1544923246-77307dd270cb?w=800&h=1000&fit=crop", alt: "Doudoune", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "S", priceModifier: 0, stock: 6, sku: "DDN-S" },
            { value: "M", priceModifier: 0, stock: 10, sku: "DDN-M" },
            { value: "L", priceModifier: 0, stock: 8, sku: "DDN-L" },
          ]},
        ],
        stock: 24,
        sku: "DDN-LGR",
        weight: 350,
        tags: ["doudoune", "legere", "recycle"],
        isActive: true,
        isFeatured: true,
      },
      // ACCESSOIRES
      {
        name: "Sac Tote Bag en Toile",
        slug: "sac-tote-bag-toile",
        description: "<p>Tote bag en toile de coton epais avec anses en cuir vegetal. Grand format, poche interieure zippee. Pour le quotidien.</p>",
        shortDescription: "Tote bag en toile epaisse, anses cuir vegetal.",
        price: 4500,
        category: catAccessoires._id,
        images: [
          { url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=1000&fit=crop", alt: "Tote bag", order: 0 },
        ],
        stock: 30,
        sku: "BAG-TOT",
        weight: 300,
        tags: ["sac", "tote", "coton"],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Bonnet Merinos Cote",
        slug: "bonnet-merinos-cote",
        description: "<p>Bonnet en laine merinos cotelee. Doux, chaud, anti-grattement. Taille unique elastique.</p>",
        shortDescription: "Bonnet en laine merinos, doux et chaud.",
        price: 2900,
        category: catAccessoires._id,
        images: [
          { url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&h=1000&fit=crop", alt: "Bonnet merinos", order: 0 },
        ],
        stock: 50,
        sku: "BNT-MER",
        weight: 80,
        tags: ["bonnet", "merinos", "hiver"],
        isActive: true,
        isFeatured: false,
      },
      // CHAUSSURES
      {
        name: "Sneakers Minimalistes Cuir",
        slug: "sneakers-minimalistes-cuir",
        description: "<p>Sneakers en cuir pleine fleur, design epure. Semelle en caoutchouc naturel. Le minimalisme a son meilleur.</p>",
        shortDescription: "Sneakers cuir pleine fleur, design minimaliste.",
        price: 13900,
        category: catChaussures._id,
        images: [
          { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop", alt: "Sneakers blanches", order: 0 },
          { url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1000&fit=crop", alt: "Sneakers profil", order: 1 },
        ],
        variants: [
          { name: "Pointure", options: [
            { value: "40", priceModifier: 0, stock: 6, sku: "SNK-40" },
            { value: "41", priceModifier: 0, stock: 8, sku: "SNK-41" },
            { value: "42", priceModifier: 0, stock: 10, sku: "SNK-42" },
            { value: "43", priceModifier: 0, stock: 8, sku: "SNK-43" },
            { value: "44", priceModifier: 0, stock: 5, sku: "SNK-44" },
          ]},
        ],
        stock: 37,
        sku: "SNK-MIN",
        weight: 700,
        tags: ["sneakers", "cuir", "minimaliste"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Chelsea Boots Daim",
        slug: "chelsea-boots-daim",
        description: "<p>Chelsea boots en daim souple. Semelle crantee, elastiques lateraux. Elegantes et polyvalentes.</p>",
        shortDescription: "Chelsea boots en daim, semelle crantee.",
        price: 15900,
        category: catChaussures._id,
        images: [
          { url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&h=1000&fit=crop", alt: "Chelsea boots", order: 0 },
        ],
        variants: [
          { name: "Pointure", options: [
            { value: "41", priceModifier: 0, stock: 5, sku: "CHE-41" },
            { value: "42", priceModifier: 0, stock: 7, sku: "CHE-42" },
            { value: "43", priceModifier: 0, stock: 6, sku: "CHE-43" },
          ]},
        ],
        stock: 18,
        sku: "CHE-DAI",
        weight: 900,
        tags: ["boots", "chelsea", "daim"],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Pull Col Roule Laine Merinos",
        slug: "pull-col-roule-merinos",
        description: "<p>Pull col roule en laine merinos extra-fine. Doux, leger et chaud. Jauge fine pour un tomber elegant. Un incontournable de l'hiver.</p>",
        shortDescription: "Pull col roule en laine merinos extra-fine.",
        price: 9900,
        compareAtPrice: 12900,
        category: catHauts._id,
        images: [
          { url: "https://images.unsplash.com/photo-1638718984352-3060f6e8f6ac?w=800&h=1000&fit=crop", alt: "Pull col roule", order: 0 },
        ],
        variants: [
          { name: "Taille", options: [
            { value: "S", priceModifier: 0, stock: 8, sku: "PUL-S" },
            { value: "M", priceModifier: 0, stock: 12, sku: "PUL-M" },
            { value: "L", priceModifier: 0, stock: 10, sku: "PUL-L" },
          ]},
        ],
        stock: 30,
        sku: "PUL-MER",
        weight: 300,
        tags: ["pull", "merinos", "col-roule", "bestseller"],
        isActive: true,
        isFeatured: true,
      },
    ];

    await Product.insertMany(products);

    return NextResponse.json({
      message: "Donnees demo créées avec succes",
      categories: 5,
      products: products.length,
    });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
