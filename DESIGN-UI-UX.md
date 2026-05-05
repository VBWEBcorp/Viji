# Design UI/UX — Template E-commerce

Objectif : rendu **SaaS premium** (references : Linear, Vercel, Stripe, Framer, Raycast).
Interdit : rendu cheap, template Bootstrap, UI "admin panel 2015".

---

## 1. Principes fondamentaux

- **Clarte > design** — Chaque ecran compris en 3 secondes. Hierarchie visuelle evidente. CTA visibles sans effort.
- **Moins mais mieux** — Peu d'elements, parfaitement executes. Pas de surcharge visuelle.
- **Coherence totale** — Radius, spacing, couleurs constants partout. Pas d'impro freestyle ecran par ecran.

## 2. Espacement (ultra important)

C'est CE qui fait le cote premium :
- Sections aerees (gros padding)
- Grilles respirantes
- Marges genereuses entre blocs
- Trop serre = cheap / Trop dense = dashboard uniquement

## 3. Typographie

- **Font principale** : Inter (Geist Sans)
- **Titres** : Plus Jakarta Sans / Geist Sans bold
- 1 seul H1 par page, H2 = sections, H3 = sous-sections
- Titres courts, texte lisible, interlignage confortable

## 4. Cartes & surfaces

- Coins arrondis doux : `rounded-xl` / `rounded-2xl`
- Ombres tres subtiles : `shadow-sm` ou aucune
- Bordures fines : `border border-gray-100`
- A eviter : ombres lourdes, bordures epaisses, effets glass mal maitrises

## 5. Couleurs

- **Primaire** : gray-900 (noir profond) pour CTA et accents
- **Fond** : white / gray-50 (neutres froids)
- **Texte secondaire** : gray-400 / gray-500
- **Accents** : emerald (succes), amber (warning), red (erreur), blue (info)
- 1 couleur dominante, accents avec parcimonie

## 6. Boutons & interactions

- CTA principal : `bg-gray-900 text-white rounded-xl hover:bg-gray-800`
- Secondaire : `border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50`
- Ghost : `text-gray-500 hover:text-gray-700`
- Etats hover/active/focus toujours presents
- Pas d'effet gadget, pas d'animations lentes

## 7. Navigation

- Navbar sticky + blur arriere-plan
- Simple, lisible, peu de liens
- Mobile : menu fluide, pas de hamburger complexe

## 8. Micro-interactions

- Animations courtes, fluides, naturelles
- Autorise : fade, slide leger, apparition scroll, transition-colors
- Interdit : animations longues, effets "wow" inutiles, distractions

## 9. Mode sombre

- A prevoir (dark mode ready)
- Contrastes propres, lisibilite parfaite
- Gros differenciateur qualite

## 10. Composants standards

| Composant | Style |
|-----------|-------|
| Input | `bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white` |
| Card | `bg-white rounded-2xl border border-gray-100 p-6` |
| Badge status | `text-[11px] font-medium rounded-full border px-2 py-0.5` |
| Table header | `text-[11px] font-semibold text-gray-400 uppercase tracking-wider` |
| Table row | `hover:bg-gray-50/50 transition-colors` |
| Section title | `text-[15px] font-semibold text-gray-900` |
| Subtitle | `text-sm text-gray-400 mt-0.5` |
| Page title | `text-xl font-semibold text-gray-900` (admin) / `text-2xl font-bold` (shop) |
| CTA button | `bg-gray-900 text-white text-[13px] px-5 py-2.5 rounded-xl font-medium` |
| Link subtle | `text-[13px] text-gray-400 hover:text-gray-600 transition` |
| Empty state | Icone grise + texte + CTA centre |
| Loading | `animate-pulse` skeleton, jamais de spinner |

## 11. Checklist avant validation

- [ ] Mobile OK
- [ ] Desktop OK
- [ ] CTA visibles
- [ ] Texte lisible (clair + sombre)
- [ ] Hover / focus OK
- [ ] Aucun element "cheap"
- [ ] Espacement genereux
- [ ] Coherence avec le reste du site

## 12. Philosophie

> "C'est simple, propre, rapide... et ca respire la qualite"
>
> Pas : "C'est style mais je comprends rien"
