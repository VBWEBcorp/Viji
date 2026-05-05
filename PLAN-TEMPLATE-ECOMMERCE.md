# PLAN — Template E-Commerce Premium (Next.js)
## Analyse comparative Shopify/WooCommerce 2025-2026 vs Projet actuel

---

## ETAT ACTUEL DU PROJET

### Ce qui existe et fonctionne
- **Stack** : Next.js 16 + MongoDB (Mongoose) + Tailwind CSS 4 + TypeScript
- **Auth** : NextAuth v5 (credentials, JWT, roles admin/customer)
- **Paiement** : Stripe + PayPal (cles configurables depuis admin)
- **Livraison** : SendCloud (tarifs temps reel, creation colis, tracking)
- **Emails** : Resend (confirmation commande, notification expedition)
- **Upload** : Cloudflare R2 (images produits)
- **Admin** : Dashboard, Produits CRUD, Commandes, Clients, Codes promo, Contenu CMS, Parametres
- **Shop** : Home, Catalogue avec filtres/tri/pagination, Fiche produit avec variantes, Panier, Checkout multi-etapes, Compte client, Auth (login/register)
- **Models** : Product, Category, Order, User, Cart, PromoCode, Content, SiteSettings
- **SEO** : robots.ts, sitemap.ts, meta title/description par produit
- **Design** : UI admin soignee (rounded-2xl, gray-50 inputs, badges status, sidebar sombre)

---

## FONCTIONNALITES MANQUANTES — Par priorite

---

### PRIORITE 1 — CRITIQUE (Tout e-commerce serieux doit avoir ca)

#### 1.1 Panier Drawer (slide-out)
**Shopify/Woo** : Le panier s'ouvre en slide-out depuis la droite, sans quitter la page.
**Actuellement** : Page /cart separee uniquement.
**A faire** :
- Composant `CartDrawer.tsx` (slide-out panel)
- Icone panier dans le Header avec compteur d'articles (badge)
- Ouverture au clic + auto-ouverture apres ajout au panier
- Modifier/supprimer quantites directement dans le drawer
- Bouton "Voir le panier" + "Commander"
- Context React global pour le state du panier (CartProvider)

#### 1.2 Wishlist / Liste de souhaits
**Shopify/Woo** : Fonctionnalite standard via apps (YITH, etc.)
**Actuellement** : Inexistant.
**A faire** :
- Model `Wishlist.ts` (user + products)
- API `/api/wishlist` (GET, POST, DELETE)
- Bouton coeur sur chaque ProductCard et fiche produit
- Page `/account/wishlist` dans le compte client
- Persistence pour users connectes (DB) + localStorage pour guests

#### 1.3 Avis / Reviews produits
**Shopify/Woo** : Fonctionnalite native. Etoiles, texte, badge "Achat verifie".
**Actuellement** : Inexistant.
**A faire** :
- Model `Review.ts` (user, product, rating 1-5, title, comment, isVerified, isApproved, photos[])
- API `/api/reviews` (GET par produit, POST, moderation admin)
- Composant etoiles + formulaire sur la fiche produit
- Note moyenne + nb avis affiches sur ProductCard
- Page admin `/admin/reviews` pour moderer (approuver/rejeter)
- Email automatique post-achat demandant un avis (J+7)
- Schema.org AggregateRating dans le JSON-LD

#### 1.4 Abandon de panier (Abandoned Cart Recovery)
**Shopify** : Email automatique aux clients qui ont abandonne le checkout.
**Actuellement** : Inexistant.
**A faire** :
- Champ `email` sur le Cart (capture en debut de checkout)
- Flag `abandonedEmailSent` sur le Cart
- CRON/API qui detecte les paniers abandonnes (>1h sans conversion)
- Email automatique avec rappel des articles + lien retour
- Dashboard admin : nombre de paniers abandonnes, taux de recovery

#### 1.5 JSON-LD / Structured Data (SEO)
**Shopify/Woo** : Product, BreadcrumbList, Organization, WebSite, AggregateRating — automatique.
**Actuellement** : Inexistant (seulement meta title/description).
**A faire** :
- Composant `JsonLd.tsx` reutilisable
- Product schema sur chaque fiche produit (name, image, price, availability, sku, review)
- BreadcrumbList sur toutes les pages
- Organization sur la homepage
- WebSite avec SearchAction
- AggregateRating quand les reviews seront implementees

#### 1.6 Recherche amelioree (Autocomplete + Filtres avances)
**Shopify/Woo** : Recherche predictive avec thumbnails, filtres par prix/couleur/taille.
**Actuellement** : Recherche basique par texte, filtre par categorie seulement.
**A faire** :
- Recherche autocomplete dans le Header (debounced, affiche resultats avec images)
- Filtres avances dans le catalogue : slider prix (min/max), par stock (en stock uniquement), par tag
- Tri ameliore : "Meilleures ventes" (necesssite tracking des ventes par produit)
- Affichage du nombre de resultats par filtre
- Sauvegarde des filtres dans l'URL (deja partiellement fait)

#### 1.7 Emails transactionnels manquants
**Shopify** : 15+ templates d'emails. **Woo** : 11 types.
**Actuellement** : Seulement OrderConfirmation et ShippingNotification.
**A faire** :
- Email de bienvenue (apres inscription)
- Email de reinitialisation de mot de passe
- Email de commande annulee
- Email de remboursement
- Email de demande d'avis (J+7 apres livraison)
- Email de panier abandonne
- Templates HTML editables dans l'admin (ou au moins customisables)

#### 1.8 Dashboard Analytics avance
**Shopify** : Graphiques CA, conversion, comparaison periodes, top produits, sources trafic.
**Actuellement** : 4 chiffres + liste commandes recentes. Tres basique.
**A faire** :
- Graphique CA sur 30 jours (Recharts — deja installe)
- Graphique commandes sur 30 jours
- Selecteur de periode (7j, 30j, 90j, 12 mois, custom)
- Comparaison avec periode precedente
- Panier moyen (AOV)
- Taux de conversion (si tracking sessions)
- Top 5 produits vendus
- Top 5 categories
- Clients nouveaux vs recurrents
- Export CSV des donnees

---

### PRIORITE 2 — IMPORTANT (Avantage competitif clair)

#### 2.1 Tags produits + Multi-categories (Collections)
**Shopify** : Un produit peut etre dans plusieurs collections. Tags illimites.
**Actuellement** : Une seule categorie par produit, pas de tags.
**A faire** :
- Champ `tags: string[]` sur le model Product
- Champ `categories: ObjectId[]` (array au lieu d'un seul)
- Collections automatiques (basees sur des regles : tag, prix, etc.)
- Filtre par tag dans le catalogue
- Gestion des tags dans le formulaire produit admin

#### 2.2 Cartes cadeaux (Gift Cards)
**Shopify** : Natif. Vente, emission admin, suivi du solde.
**Actuellement** : Inexistant.
**A faire** :
- Model `GiftCard.ts` (code unique, montant initial, solde restant, emetteur, destinataire, expiration)
- Type de produit "gift_card" dans Product
- API `/api/giftcards` (creation, validation, debit)
- Application au checkout (comme un code promo mais debite le solde)
- Email au destinataire avec le code
- Page admin gestion des cartes cadeaux

#### 2.3 Retours et remboursements
**Shopify** : Workflow complet de retour integre.
**Actuellement** : Seulement un statut "returned" sur la commande, pas de workflow.
**A faire** :
- Model `Return.ts` (order, items, reason, status: requested/approved/received/refunded, tracking)
- API `/api/returns`
- Formulaire client "Demander un retour" depuis la page commande
- Workflow admin : approuver/refuser, marquer recu, rembourser
- Remboursement partiel (par article)
- Integration Stripe refund API
- Email notification a chaque etape

#### 2.4 Commandes brouillon (Draft Orders)
**Shopify** : L'admin peut creer des commandes manuellement (tel, email, wholesale).
**Actuellement** : Inexistant.
**A faire** :
- Page admin `/admin/orders/new`
- Recherche client + ajout produits + prix custom
- Envoi facture par email au client
- Conversion draft -> commande payee
- Utile pour commandes tel, wholesale, cas speciaux

#### 2.5 Promotions avancees
**Shopify/Woo** : BOGO, livraison gratuite, remises auto, stacking.
**Actuellement** : Seulement pourcentage et montant fixe.
**A faire** :
- Type "free_shipping" dans PromoCode
- Type "buy_x_get_y" (Buy X Get Y)
- Remises automatiques (sans code, appliquees si conditions remplies)
- Flag `autoApply: boolean` sur PromoCode
- Limite par client (`perCustomerLimit`)
- Combinabilite (peut-on cumuler avec d'autres promos ?)
- Affichage banniere promo active sur le site

#### 2.6 Blog / Content Marketing
**Shopify/Woo** : Blog integre pour le SEO.
**Actuellement** : Inexistant (le CMS gere seulement des blocs de contenu statique).
**A faire** :
- Model `BlogPost.ts` (title, slug, content, excerpt, coverImage, author, category, tags, seo, isPublished, publishedAt)
- API `/api/blog`
- Pages `/blog` et `/blog/[slug]`
- Page admin `/admin/blog` (CRUD articles)
- Categories et tags de blog
- JSON-LD Article
- Sitemap inclusion des articles
- Liens "produits lies" dans les articles

#### 2.7 Produits recemment vus
**Shopify/Woo** : Widget/section standard.
**Actuellement** : Inexistant.
**A faire** :
- Hook `useRecentlyViewed` (localStorage, max 12 produits)
- Section sur la fiche produit et la homepage
- Persistence cross-sessions

#### 2.8 Cookie Consent / RGPD
**Obligatoire en Europe (EAA juin 2025).**
**Actuellement** : Inexistant.
**A faire** :
- Composant `CookieConsent.tsx` (banniere avec choix : necessaires, analytics, marketing)
- Sauvegarde du consentement en cookie
- Chargement conditionnel des scripts tiers (analytics, pixels)
- Page politique de cookies

#### 2.9 Quick View (Vue rapide)
**Standard dans les themes Shopify/Woo premium.**
**Actuellement** : Inexistant.
**A faire** :
- Modal/Dialog sur le ProductCard (bouton "Apercu rapide")
- Affiche : image, nom, prix, variantes, bouton ajouter au panier
- Sans quitter la page catalogue
- Mobile : bottom sheet

---

### PRIORITE 3 — FONCTIONNALITES AVANCEES (Niveau premium)

#### 3.1 Multi-devise (Multi-currency)
**Shopify Markets** : Detection geo, conversion automatique.
**A faire** :
- Champ `currency` configurable dans SiteSettings
- Detection pays via geolocalisation
- Convertisseur de devises (taux stockes en DB ou API)
- Affichage prix dans la devise du visiteur
- Selecteur de devise dans le Header

#### 3.2 Notifications push / Alertes stock
**Shopify/Woo** : Alertes admin stock bas, notifications back-in-stock client.
**A faire** :
- Alerte admin dans le dashboard quand stock < seuil
- Formulaire "Prevenir quand disponible" sur produit en rupture
- Model `StockAlert.ts` (email, product)
- Email automatique quand le produit revient en stock

#### 3.3 Timeline/Activite sur les commandes
**Shopify** : Historique complet des evenements sur chaque commande.
**A faire** :
- Champ `timeline: [{action, user, date, details}]` sur Order
- Enregistrer chaque changement de statut, note, remboursement
- Affichage timeline visuelle dans la page detail commande admin

#### 3.4 Import/Export CSV
**Shopify/Woo** : Import/export de produits, clients, commandes en CSV.
**A faire** :
- Export CSV produits depuis admin
- Import CSV produits (avec mapping colonnes)
- Export CSV commandes
- Export CSV clients
- Boutons dans chaque page admin concernee

#### 3.5 Redirections 301
**Shopify** : Gestion des redirections URL pour le SEO.
**A faire** :
- Model `Redirect.ts` (fromPath, toPath, type: 301/302)
- API `/api/redirects`
- Middleware Next.js pour intercepter et rediriger
- Page admin `/admin/redirects`
- Import CSV de redirections

#### 3.6 Factures PDF
**WooCommerce** : Plugin "PDF Invoices & Packing Slips" ultra populaire.
**A faire** :
- Generation PDF cote serveur (avec @react-pdf/renderer ou jsPDF)
- Facture conforme (n° facture, date, TVA, adresses, articles, totaux)
- Bon de livraison (packing slip)
- Telechargeable depuis admin (page commande) et depuis le compte client
- Envoi en piece jointe de l'email de confirmation

#### 3.7 Programme de fidelite (points)
**Shopify/Woo** : Via apps (Smile.io, Points & Rewards).
**A faire** :
- Model `LoyaltyPoints.ts` (user, points, transactions[])
- Gagner des points a chaque achat (configurable : X points par euro)
- Echanger des points contre des reductions
- Affichage des points dans le compte client
- Configuration dans les parametres admin

#### 3.8 Produits digitaux / Telechargements
**Shopify/Woo** : Natif. Fichier delivre apres achat.
**A faire** :
- Champ `isDigital: boolean` et `files: [{name, url, maxDownloads}]` sur Product
- Pas d'expedition pour les produits digitaux
- Page `/account/downloads` avec liens de telechargement
- Liens temporaires securises (signed URLs R2)
- Limite de telechargements configurable

#### 3.9 Comparaison de produits
**WooCommerce** : Plugin YITH Compare standard.
**A faire** :
- Bouton "Comparer" sur ProductCard
- Page `/compare` avec tableau comparatif (specs, prix, images)
- Max 4 produits
- Persistence localStorage

#### 3.10 Page de suivi commande publique
**Shopify** : Page de tracking accessible sans compte.
**A faire** :
- Page `/track` avec champ numero de commande + email
- Affiche le statut, le tracking, les articles
- Accessible depuis l'email de confirmation

---

### PRIORITE 4 — POLISH & UX (Differenciation template premium)

#### 4.1 Ameliorations UI/UX shop
- **Sticky "Ajouter au panier"** : barre fixe quand le bouton principal scroll hors de vue
- **Zoom image produit** : hover-zoom desktop, pinch-zoom mobile
- **Galerie swipeable** sur mobile (touch gestures)
- **Breadcrumbs** sur toutes les pages (Home > Catalogue > Categorie > Produit)
- **Skeleton loading** ameliore (deja partiel, a generaliser)
- **Animations de transition** (page transitions, micro-interactions)
- **Progress bar livraison gratuite** dans le panier ("Plus que X€ pour la livraison gratuite !")
- **Badge stock faible** sur ProductCard ("Plus que 3 en stock")
- **Indicateur "Nouveau"** sur les produits recents (<7 jours)

#### 4.2 Ameliorations Admin
- **Duplication de produit** (bouton "Dupliquer" dans la liste)
- **Bulk actions** sur les produits (activer/desactiver, supprimer en masse)
- **Recherche globale admin** (commandes, produits, clients dans une seule barre)
- **Statistiques sur la fiche client** (total depense, nb commandes, panier moyen)
- **Notes internes sur les clients**
- **Filtre commandes** par statut, date, montant
- **Notifications admin** (nouvelle commande, stock bas — via toast ou badge dans sidebar)

#### 4.3 Performance & Technique
- **next.config.js** : Configuration images (domains autorises pour Image next), headers securite
- **Image optimization** : Utiliser le composant Image de Next.js partout (deja fait en grande partie)
- **Lazy loading** des sections below-the-fold
- **Service Worker** pour le cache offline (PWA)
- **Rate limiting** sur les API sensibles (login, register, checkout)
- **Validation Zod** sur toutes les API routes (zod est deja installe mais pas utilise)
- **Error boundaries** React pour eviter les crashes complets
- **Tests** : Au minimum des tests API (optionnel pour un template)

#### 4.4 Integrations tierces (structure preparee)
- **Google Analytics 4** : Composant avec events e-commerce (view_item, add_to_cart, purchase)
- **Facebook Pixel / Meta CAPI** : Events de conversion
- **Google Merchant Center** : Feed XML produits pour Google Shopping
- **Sitemap dynamique** ameliore (inclure blog, categories, collections)
- **Open Graph** : Images et metadata pour le partage social
- **Slots/hooks pour extensions** : Architecture plugin-ready (event emitter, middleware hooks)

---

## ORDRE D'IMPLEMENTATION RECOMMANDE

### Phase 1 — Fondations (impact maximum, pre-requis pour le reste)
1. CartDrawer + CartProvider (context global panier)
2. JSON-LD structured data
3. Cookie Consent RGPD
4. Emails transactionnels manquants
5. Dashboard Analytics (graphiques + periodes)

### Phase 2 — Fonctionnalites commerce essentielles
6. Reviews/Avis produits (model + API + UI + admin)
7. Wishlist
8. Recherche autocomplete + filtres avances
9. Tags produits + multi-categories
10. Promotions avancees (BOGO, auto-apply, free shipping)

### Phase 3 — Gestion avancee
11. Retours et remboursements (workflow complet)
12. Abandoned cart recovery
13. Blog
14. Commandes brouillon (draft orders)
15. Timeline commandes

### Phase 4 — Features premium
16. Cartes cadeaux
17. Import/Export CSV
18. Factures PDF
19. Alertes stock / Back-in-stock
20. Produits recemment vus + Quick View

### Phase 5 — Polish & extras
21. Ameliorations UI/UX (sticky cart, zoom, breadcrumbs, progress bar)
22. Ameliorations admin (bulk actions, stats client, recherche globale)
23. Page tracking publique
24. Redirections 301
25. Comparaison produits
26. Programme fidelite
27. Produits digitaux
28. Multi-devise (preparation)
29. Google Analytics 4 + Meta Pixel (structure)
30. Performance (rate limiting, Zod validation, error boundaries)

---

## RESUME CHIFFRE

| Categorie | Existant | A ajouter | Total |
|-----------|----------|-----------|-------|
| Models Mongoose | 8 | ~8 (Review, Wishlist, GiftCard, Return, BlogPost, StockAlert, Redirect, LoyaltyPoints) | ~16 |
| API Routes | 15 | ~15 | ~30 |
| Pages Shop | 8 | ~6 (wishlist, blog, blog/[slug], compare, track, downloads) | ~14 |
| Pages Admin | 8 | ~6 (reviews, blog, redirects, giftcards, returns, orders/new) | ~14 |
| Composants | 7 | ~12 (CartDrawer, CartProvider, JsonLd, CookieConsent, ReviewStars, ReviewForm, QuickView, Breadcrumbs, SearchAutocomplete, StockBadge, ProgressBar, RecentlyViewed) | ~19 |
| Emails | 2 | 5+ | 7+ |

---

## NOTES IMPORTANTES

1. **Ce template est un starter reutilisable** — chaque fonctionnalite doit etre propre, decouplable et configurable depuis l'admin quand c'est possible.

2. **Le design system du settings page est le standard** — tous les nouveaux composants admin doivent suivre : `bg-white rounded-2xl border border-gray-100 p-6`, inputs `bg-gray-50 border-gray-200 rounded-xl`, boutons `bg-gray-900 text-white rounded-xl`, badges status avec couleurs semantiques.

3. **Les cles API depuis l'admin (pas les .env)** — le pattern apikeys.ts avec cache + fallback .env est excellent, a maintenir pour toute nouvelle integration.

4. **Tout en francais par defaut** — l'interface est en francais, les textes sont configurables depuis le CMS/admin.

5. **Pas de sur-engineering** — on n'implemente pas un app store ou un visual editor. On fait un template solide avec les fonctionnalites qui comptent vraiment.
