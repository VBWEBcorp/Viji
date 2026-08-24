/** Passe chaque page du sitemap et teste chaque image telle que le navigateur
 *  la demande (/_next/image), pas seulement l URL du bucket : c est le seul
 *  controle qui attrape un domaine absent de next.config.
 *  Usage : node scripts/verifie-images-site.mjs <dossier-avec-pages.txt> */
import fs from "node:fs";
const SP = process.argv[2];
const pages = fs.readFileSync(`${SP}/pages.txt`,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
const ORIGIN = "https://entre-maman-et-moi.fr";

async function pool(items, n, fn){ const out=[]; let i=0;
  await Promise.all(Array.from({length:n},async()=>{ while(i<items.length){ const k=i++; out[k]=await fn(items[k]); }}));
  return out; }

const imgs = new Map();   // requete image -> pages qui l'utilisent
const pageStatus = [];

await pool(pages, 6, async (url) => {
  try {
    const r = await fetch(url, {redirect:"follow"});
    const html = r.ok ? await r.text() : "";
    const ibb = (html.match(/ibb\.co/g)||[]).length;
    const reqs = [...new Set((html.match(/\/_next\/image\?url=[^"\ ]+/g)||[]).map(s=>s.replace(/&amp;/g,"&")))];
    // <img src> direct, hors next/image
    const raw = [...new Set((html.match(/src="https?:\/\/[^"]+\.(?:jpe?g|png|webp|gif|avif|svg)[^"]*"/g)||[]).map(s=>s.slice(5,-1)))];
    for(const q of reqs){ if(!imgs.has(q)) imgs.set(q,[]); imgs.get(q).push(url); }
    for(const q of raw){ if(!imgs.has(q)) imgs.set(q,[]); imgs.get(q).push(url); }
    pageStatus.push({url, code:r.status, ibb, n:reqs.length+raw.length});
  } catch(e){ pageStatus.push({url, code:"ERR", ibb:0, n:0, err:e.message}); }
});

console.log("PAGES");
let bad=0, ibbTotal=0;
for(const p of pageStatus.sort((a,b)=>a.url.localeCompare(b.url))){
  if(p.code!==200) bad++;
  ibbTotal += p.ibb;
  const flag = p.code===200 && p.ibb===0 ? "  " : "!!";
  console.log(`${flag} ${String(p.code).padEnd(4)} ${String(p.n).padStart(3)} img  ${p.ibb?`ImgBB:${p.ibb}  `:""}${p.url.replace(ORIGIN,"")||"/"}`);
}
console.log(`\n${pageStatus.length} pages, ${bad} en erreur, ${ibbTotal} reference(s) ImgBB.\n`);

console.log(`IMAGES — ${imgs.size} requete(s) distincte(s)`);
const list=[...imgs.keys()];
const results = await pool(list, 8, async (q) => {
  const u = q.startsWith("http") ? q : ORIGIN+q;
  try { const r = await fetch(u); return {q, code:r.status, ct:r.headers.get("content-type")}; }
  catch(e){ return {q, code:"ERR", ct:e.message}; }
});
const ko = results.filter(r=>r.code!==200);
for(const r of ko) console.log(`   ECHEC ${r.code}  ${r.q.slice(0,110)}\n         utilisee sur : ${imgs.get(r.q).map(p=>p.replace(ORIGIN,"")).join(", ")}`);
console.log(`\n${results.length} images testees, ${ko.length} en echec.`);
