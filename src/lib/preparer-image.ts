// Prépare une photo dans le navigateur avant de l'envoyer à /api/upload.
//
// Netlify refuse toute requête vers une fonction au-delà d'environ 4,5 Mo
// (réponse 413, sans corps) : une photo d'appareil ou de téléphone (5 à 20 Mo)
// n'atteint jamais le serveur, et l'admin affichait « Erreur lors de l'upload ».
// On réduit donc l'image ici (2000 px sur le plus grand côté, comme le serveur),
// puis le serveur la recompresse en WebP comme avant.

const MAX_DIMENSION = 2000;
const SEUIL = 2 * 1024 * 1024; // en dessous, envoyée telle quelle
const PLAFOND = 4 * 1024 * 1024; // au-dessus, Netlify refuserait la requête

const EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Type réel d'une image, même quand le navigateur n'en donne pas (ou « image/jpg »). */
export function typeImage(nom: string, type: string): string {
  const t = (type || "").toLowerCase();
  if (t === "image/jpg" || t === "image/pjpeg") return "image/jpeg";
  if (t && t !== "application/octet-stream") return t;
  const ext = nom.split(".").pop()?.toLowerCase() || "";
  return EXTENSIONS[ext] || t;
}

async function decoder(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // repli sur <img> ci-dessous
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function versBlob(canvas: HTMLCanvasElement, type: string, qualite: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, qualite));
}

export async function preparerImage(file: File): Promise<File> {
  const type = typeImage(file.name, file.type);
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return file;
  if (file.size <= SEUIL) {
    return type === file.type ? file : new File([file], file.name, { type });
  }

  try {
    const source = await decoder(file);
    const largeur = "naturalWidth" in source ? source.naturalWidth : source.width;
    const hauteur = "naturalHeight" in source ? source.naturalHeight : source.height;
    let echelle = Math.min(1, MAX_DIMENSION / Math.max(largeur, hauteur));

    // JPEG pour les photos ; WebP pour PNG/WebP afin de garder la transparence.
    const sortie = type === "image/jpeg" ? "image/jpeg" : "image/webp";
    for (const qualite of [0.88, 0.8, 0.7, 0.6]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(largeur * echelle));
      canvas.height = Math.max(1, Math.round(hauteur * echelle));
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await versBlob(canvas, sortie, qualite);
      if (blob && blob.size <= PLAFOND) {
        const ext = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1] || "jpg";
        const nom = (file.name.replace(/\.[^.]+$/, "") || "image") + "." + ext;
        if ("close" in source) source.close();
        return new File([blob], nom, { type: blob.type || sortie });
      }
      echelle *= 0.85;
    }
    if ("close" in source) source.close();
  } catch {
    // Image illisible par le navigateur : le serveur tranchera.
  }
  return file;
}
