import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/r2";

// sharp nécessite le runtime Node (pas Edge).
export const runtime = "nodejs";

/** Vecteur / animation : conservés tels quels (pas de recompression). */
const PASS_THROUGH = ["image/svg+xml", "image/gif"];
/** Formats matriciels recompressés automatiquement. */
const RASTER = ["image/jpeg", "image/png", "image/webp"];

const MAX_INPUT = 25 * 1024 * 1024; // 25 Mo en entrée (avant compression)
const MAX_DIMENSION = 2000; // px sur le plus grand côté
const WEBP_QUALITY = 82;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
    }

    if (![...PASS_THROUGH, ...RASTER].includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé (JPG, PNG, WebP, GIF, SVG)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_INPUT) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 25 Mo)" },
        { status: 400 }
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // SVG / GIF : upload direct, sans toucher au contenu.
    if (PASS_THROUGH.includes(file.type)) {
      const url = await uploadFile(input, cleanName, file.type);
      return NextResponse.json({ url, compressed: false });
    }

    // Compression auto : orientation EXIF appliquée, redimensionné, converti en WebP.
    const baseName = cleanName.replace(/\.[^.]+$/, "") || "image";
    try {
      const output = await sharp(input)
        .rotate() // respecte l'orientation EXIF (photos de téléphone)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const url = await uploadFile(output, `${baseName}.webp`, "image/webp");
      return NextResponse.json({
        url,
        compressed: true,
        originalSize: input.length,
        size: output.length,
      });
    } catch (err) {
      // Si sharp échoue (fichier corrompu, format exotique…), on garde l'original.
      console.error("Compression error, fallback to original:", err);
      const url = await uploadFile(input, cleanName, file.type);
      return NextResponse.json({ url, compressed: false });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
