import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";

import { connectDB } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { isAllowedSiteFile, normalizeSiteFilePath, writeSiteFile } from "@/lib/site-files";

// Webhook PHARE (outil SEO de l'agence) : dépôt et retrait d'articles du blog.
// Sécurisé par secret partagé (en-tête x-phare-secret vs PHARE_WEBHOOK_SECRET).
//
// Les visuels sont hébergés par PHARE : les adresses présentes dans `html`,
// `markdown` et `coverImageUrl` sont absolues et définitives. On les stocke et
// on les affiche telles quelles — aucune copie locale, aucun stockage d'images.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004").replace(/\/$/, "");
const BLOG_BASE = "/blog";

interface PharePayload {
  action?: string;
  title?: string;
  slug?: string;
  html?: string;
  markdown?: string;
  metaTitle?: string;
  metaDescription?: string;
  keyword?: string;
  jsonLd?: string | Record<string, unknown>;
  coverImageUrl?: string;
  coverImageAlt?: string;
  url?: string;
  // Action `file` : dépôt d'un fichier de la racine du site (llms.txt).
  path?: string;
  content?: string;
  contentType?: string;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// Slugs à tenter pour un retrait : celui envoyé par PHARE tel quel, sa forme
// normalisée, et celui déduit de l'URL publique si PHARE n'envoie que ça.
function deleteCandidates(body: PharePayload): string[] {
  const raw = body.slug?.trim();
  const fromUrl = body.url?.trim().split("?")[0].split("#")[0].replace(/\/+$/, "").split("/").pop();
  const candidates = [raw, raw && slugify(raw), fromUrl, fromUrl && slugify(fromUrl)];
  return Array.from(new Set(candidates.filter((s): s is string => Boolean(s))));
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Premier visuel du contenu, utilisé comme couverture si PHARE n'envoie pas de
// coverImageUrl. L'adresse est celle de PHARE, on la reprend sans la toucher.
function firstImageInHtml(html: string): string {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

// Le gabarit injecte le JSON-LD tel quel dans <script type="application/ld+json">.
function jsonLdToString(value: PharePayload["jsonLd"]): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  return JSON.stringify(value);
}

// Conversion markdown minimale, utilisée seulement si PHARE n'envoie pas de
// champ html. Le contrat garantit `html` : c'est un filet pour ne jamais
// publier un article vide.
function markdownToHtml(md: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    escape(s)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  return md
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      const heading = b.match(/^(#{1,6})\s+([\s\S]*)$/);
      if (heading) {
        // h1 réservé au titre de la page -> on commence à h2.
        const level = Math.min(heading[1].length + 1, 6);
        return `<h${level}>${inline(heading[2].trim())}</h${level}>`;
      }
      if (/^\s*[-*+]\s+/m.test(b)) {
        const items = b
          .split("\n")
          .filter((l) => /^\s*[-*+]\s+/.test(l))
          .map((l) => `<li>${inline(l.replace(/^\s*[-*+]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(b).replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

// Les pages blog sont déjà en rendu dynamique ; on rafraîchit quand même le
// sitemap et la liste, qui peuvent être servis depuis le cache.
/*
 * Vider le cache de Netlify, celui qui est DEVANT Next.
 *
 * `revalidatePath` ne vide que le cache de Next. Netlify garde sa propre copie de la page
 * (« Durable Cache ») et la sert PERIMEE pendant qu'il revalide en arriere-plan. Mesure faite
 * sur un article reel : deux minutes apres une publication, le CDN repondait encore
 * `Cache-Status: "Netlify Durable"; fwd=stale; ttl=-8447` — une copie vieille de 2 h 20.
 * L'article etait a jour en base, a jour dans Next, et personne ne le voyait : celui qui
 * corrigeait une coquille rechargeait la page et n'y trouvait rien change.
 *
 * Le jeton et l'identifiant du site sont injectes dans les fonctions a l'execution : hors
 * Netlify ils sont absents et il n'y a rien a purger. Une purge ratee ne fait jamais echouer
 * une publication reussie.
 */
async function purgerCacheNetlify(): Promise<void> {
  const token = process.env.NETLIFY_PURGE_API_TOKEN;
  const siteId = process.env.SITE_ID ?? process.env.NETLIFY_SITE_ID;
  if (!token || !siteId) {
    console.log('[phare] purge Netlify ignoree (hors Netlify ou jeton absent)');
    return;
  }
  try {
    const r = await fetch('https://api.netlify.com/api/v1/purge', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ site_id: siteId }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log(`[phare] purge Netlify : ${r.status}`);
  } catch (e) {
    console.warn('[phare] purge Netlify impossible :', e);
  }
}


async function refresh(slugs: string[]): Promise<void> {
  revalidatePath(BLOG_BASE);
  for (const slug of slugs) revalidatePath(`${BLOG_BASE}/${slug}`);
  revalidatePath("/sitemap.xml");
  await purgerCacheNetlify();
}

export async function POST(req: Request) {
  // 1. Secret partagé
  const secret = process.env.PHARE_WEBHOOK_SECRET;
  const provided = req.headers.get("x-phare-secret");
  if (!secret || !provided || !safeEqual(provided, secret)) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  // 2. Ping de connexion : on ne touche à rien
  if (req.headers.get("x-phare-test") === "1") {
    return NextResponse.json({ ok: true });
  }

  // 3. Lecture du corps (un retrait peut arriver avec un corps vide)
  let body: PharePayload = {};
  try {
    body = ((await req.json()) ?? {}) as PharePayload;
  } catch {
    if (req.headers.get("x-phare-action") !== "delete") {
      return NextResponse.json({ message: "Corps JSON invalide" }, { status: 400 });
    }
  }

  try {
    await connectDB();

    // 4. Dépôt d'un fichier de la racine (llms.txt) : PHARE le régénère depuis la
    // fiche client, le site se contente de le servir. Réponse `{ written: true }`,
    // c'est ce que PHARE attend pour considérer le dépôt réussi.
    if (req.headers.get("x-phare-action") === "file" || body.action === "file") {
      const path = body.path?.trim();
      if (!path || typeof body.content !== "string" || !body.content.trim()) {
        return NextResponse.json(
          { message: "Dépôt impossible : `path` et `content` sont requis" },
          { status: 400 }
        );
      }
      if (!isAllowedSiteFile(path)) {
        return NextResponse.json(
          { message: `Fichier non autorisé : ${path}. Seul llms.txt est accepté.` },
          { status: 400 }
        );
      }

      const relatif = normalizeSiteFilePath(path);
      await writeSiteFile({ path: relatif, content: body.content, contentType: body.contentType });
      revalidatePath(`/${relatif}`);

      return NextResponse.json({ written: true, url: `${SITE_URL}/${relatif}` });
    }

    // 5. Retrait : l'article disparaît de la liste et du sitemap, et son
    // adresse répond 404. Volontairement aucune redirection.
    if (req.headers.get("x-phare-action") === "delete" || body.action === "delete") {
      const slugs = deleteCandidates(body);
      if (slugs.length === 0) {
        return NextResponse.json(
          { message: "Retrait impossible : ni `slug` ni `url` fournis" },
          { status: 400 }
        );
      }

      await BlogPost.deleteMany({ slug: { $in: slugs } });
      await refresh(slugs);

      // Idempotent : si l'article n'existait pas (ou plus), le but est atteint.
      return NextResponse.json({ deleted: true });
    }

    // 6. Publication
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ message: "Champ `title` manquant" }, { status: 400 });
    }

    const slug = slugify(body.slug || title);
    if (!slug) {
      return NextResponse.json({ message: "Slug invalide" }, { status: 400 });
    }

    const markdown = body.markdown?.trim() ?? "";
    const content = body.html?.trim() || markdownToHtml(markdown);
    if (!content) {
      return NextResponse.json(
        { message: "Article vide : ni `html` ni `markdown` fournis" },
        { status: 400 }
      );
    }

    const existing = await BlogPost.findOne({ slug }).lean<{ coverImage?: string } | null>();

    const plainText = stripHtml(content);
    const metaDescription = body.metaDescription?.trim() ?? "";

    // Visuel : celui de PHARE > première image de l'article > visuel déjà en
    // place. Toutes ces adresses sont distantes, rien n'est recopié.
    const coverImage =
      body.coverImageUrl?.trim() || firstImageInHtml(content) || existing?.coverImage || "";

    const jsonLd = jsonLdToString(body.jsonLd);
    const now = new Date();

    // 7. UPSERT par slug — jamais de doublon si PHARE renvoie le même article
    const res = await BlogPost.updateOne(
      { slug },
      {
        $set: {
          title,
          content,
          markdown,
          // `excerpt` est plafonné à 500 caractères par le schéma.
          excerpt: (metaDescription || plainText).slice(0, 500),
          coverImage,
          coverImageAlt: body.coverImageAlt?.trim() || title,
          // Stockés ici, rendus par le gabarit (<title>, meta description,
          // <script type="application/ld+json">).
          seo: { metaTitle: body.metaTitle?.trim() || title, metaDescription },
          ...(jsonLd ? { jsonLd } : {}),
          ...(body.keyword ? { tags: [body.keyword.trim()] } : {}),
          source: "phare",
          // Déposé EN LIGNE : il sort dans /blog et à son adresse.
          isPublished: true,
        },
        $setOnInsert: { publishedAt: now, category: "Actualités" },
      },
      { upsert: true }
    );

    await refresh([slug]);

    return NextResponse.json(
      { url: `${SITE_URL}${BLOG_BASE}/${slug}` },
      { status: res.upsertedCount > 0 ? 201 : 200 }
    );
  } catch (e) {
    console.error("[phare/publish]", e);
    const message = e instanceof Error ? e.message : "Erreur interne lors de la publication";
    return NextResponse.json({ message }, { status: 500 });
  }
}
