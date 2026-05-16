// Met à jour la photo du produit "Atelier Cuisine Indienne" en base de
// données pour qu'elle pointe sur la vraie photo de Viji.
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

const NEW_IMAGE = "https://i.ibb.co/qLvzCsJS/Viji.jpg";

await mongoose.connect(process.env.MONGODB_URI);
const Product = mongoose.connection.db.collection("products");

const result = await Product.updateOne(
  { slug: "atelier-cuisine-indienne" },
  {
    $set: {
      "images.0.url": NEW_IMAGE,
      "images.0.alt": "Viji Tinot · Atelier Cuisine Indienne",
      updatedAt: new Date(),
    },
  }
);

console.log(`↻ Match: ${result.matchedCount}, Modifié: ${result.modifiedCount}`);
await mongoose.disconnect();
