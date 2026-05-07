"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  FileText,
  Layout,
  Save,
  Check,
  ImageIcon,
  Type,
  Search,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  LogIn,
  UserPlus,
  User,
  PackageSearch,
  Newspaper,
  Mail,
  AlertTriangle,
  Scale,
  RotateCcw,
  Lock,
  PanelTop,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

interface ContentRecord {
  key: string;
  type: "text" | "html" | "image" | "banner";
  title: string;
  value: string;
}

type BlockType = "text" | "html" | "image";

interface Block {
  key: string;
  title: string;
  type: BlockType;
  description: string;
  placeholder: string;
  rows?: number;
}

type Category = "page" | "component" | "legal";

interface PageDef {
  id: string;
  name: string;
  route: string;
  icon: React.ElementType;
  description: string;
  category: Category;
  blocks: Block[];
}

const PAGES: PageDef[] = [
  // ==================== PAGES ====================
  {
    id: "homepage",
    name: "Accueil",
    route: "/",
    icon: Home,
    category: "page",
    description: "Page d'accueil · hero, sections, newsletter",
    blocks: [
      { key: "homepage_hero_badge", title: "Badge au-dessus du titre", type: "text", description: "Petit texte dans une pastille noire", placeholder: "Nouvelle collection disponible" },
      { key: "homepage_hero_title_1", title: "Titre · ligne 1", type: "text", description: "Premiere ligne du gros titre", placeholder: "Des produits" },
      { key: "homepage_hero_title_2", title: "Titre · ligne 2 (en degrade)", type: "text", description: "Deuxieme ligne du titre, affichee en gradient", placeholder: "d'exception" },
      { key: "homepage_hero_subtitle", title: "Sous-titre", type: "text", description: "Texte sous le titre principal", placeholder: "Qualite premium, livraison express, retours gratuits.", rows: 2 },
      { key: "homepage_hero_cta_primary", title: "Bouton principal · texte", type: "text", description: "Texte du bouton sombre", placeholder: "Voir le catalogue" },
      { key: "homepage_hero_cta_secondary", title: "Bouton secondaire · texte", type: "text", description: "Texte du lien a droite (vers blog par defaut)", placeholder: "Lire le blog" },
      { key: "homepage_hero_rating", title: "Note (ex: 4.9/5)", type: "text", description: "Note affichee a cote des etoiles", placeholder: "4.9/5" },
      { key: "homepage_hero_clients", title: "Mention clients", type: "text", description: "Ex: +2 000 clients", placeholder: "+2 000 clients" },
      { key: "homepage_hero_shipping", title: "Mention livraison", type: "text", description: "Ex: Livraison gratuite des 50€", placeholder: "Livraison gratuite des 50€" },

      { key: "homepage_featured_eyebrow", title: "Section Selection · surtitre", type: "text", description: "Texte au-dessus du titre de section", placeholder: "Selection" },
      { key: "homepage_featured_title", title: "Section Selection · titre", type: "text", description: "Titre de la section produits en avant", placeholder: "Nos coups de coeur" },

      { key: "homepage_latest_eyebrow", title: "Section Nouveautes · surtitre", type: "text", description: "Texte au-dessus du titre de section", placeholder: "Fraichement ajoutes" },
      { key: "homepage_latest_title", title: "Section Nouveautes · titre", type: "text", description: "Titre de la section nouveautes", placeholder: "Nouveautes" },

      { key: "homepage_trust_eyebrow", title: "Section Trust · surtitre", type: "text", description: "Texte au-dessus du bento", placeholder: "Pourquoi nous ?" },
      { key: "homepage_trust_title", title: "Section Trust · titre", type: "text", description: "Titre du bloc des avantages", placeholder: "L'experience qui fait la difference" },
      { key: "homepage_trust_1_title", title: "Avantage 1 · titre", type: "text", description: "Premier avantage", placeholder: "Expedition express" },
      { key: "homepage_trust_1_desc", title: "Avantage 1 · description", type: "text", description: "", placeholder: "Commandez avant 14h, livraison sous 24-48h." },
      { key: "homepage_trust_2_title", title: "Avantage 2 · titre", type: "text", description: "", placeholder: "Paiement securise" },
      { key: "homepage_trust_2_desc", title: "Avantage 2 · description", type: "text", description: "", placeholder: "Stripe, PayPal, CB. Donnees chiffrees." },
      { key: "homepage_trust_3_title", title: "Avantage 3 · titre", type: "text", description: "", placeholder: "Retours gratuits" },
      { key: "homepage_trust_3_desc", title: "Avantage 3 · description", type: "text", description: "", placeholder: "14 jours pour changer d'avis. Sans condition." },
      { key: "homepage_trust_4_title", title: "Avantage 4 · titre", type: "text", description: "", placeholder: "Qualite premium" },
      { key: "homepage_trust_4_desc", title: "Avantage 4 · description", type: "text", description: "", placeholder: "Chaque produit est selectionne et teste." },

      { key: "homepage_marquee_text", title: "Marquee · items separes par |", type: "text", description: "Liste des items du bandeau defilant, separes par |", placeholder: "Livraison express|Paiement securise|Retours gratuits|Support 7j/7|Qualite premium" },
    ],
  },
  {
    id: "catalogue",
    name: "Catalogue",
    route: "/products",
    icon: ShoppingBag,
    category: "page",
    description: "Liste des produits · titre et intro",
    blocks: [
      { key: "products_title", title: "Titre de la page", type: "text", description: "", placeholder: "Catalogue" },
      { key: "products_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Decouvrez tous nos produits", rows: 2 },
      { key: "products_empty", title: "Message si aucun produit", type: "text", description: "", placeholder: "Aucun produit ne correspond a votre recherche." },
    ],
  },
  {
    id: "blog",
    name: "Blog",
    route: "/blog",
    icon: Newspaper,
    category: "page",
    description: "Liste des articles · titre et intro",
    blocks: [
      { key: "blog_title", title: "Titre de la page", type: "text", description: "", placeholder: "Blog" },
      { key: "blog_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Conseils, actualites et inspirations.", rows: 2 },
      { key: "blog_empty", title: "Message si aucun article", type: "text", description: "", placeholder: "Aucun article publie pour le moment." },
    ],
  },
  {
    id: "cart",
    name: "Panier",
    route: "/cart",
    icon: ShoppingCart,
    category: "page",
    description: "Page panier · etat vide",
    blocks: [
      { key: "cart_title", title: "Titre de la page", type: "text", description: "", placeholder: "Mon panier" },
      { key: "cart_empty_title", title: "Panier vide · titre", type: "text", description: "", placeholder: "Votre panier est vide" },
      { key: "cart_empty_subtitle", title: "Panier vide · texte", type: "text", description: "", placeholder: "Decouvrez nos produits et trouvez votre coup de coeur.", rows: 2 },
      { key: "cart_empty_cta", title: "Panier vide · texte du bouton", type: "text", description: "", placeholder: "Voir le catalogue" },
    ],
  },
  {
    id: "checkout",
    name: "Commande (Checkout)",
    route: "/checkout",
    icon: CreditCard,
    category: "page",
    description: "Page de paiement · titres et messages",
    blocks: [
      { key: "checkout_title", title: "Titre de la page", type: "text", description: "", placeholder: "Passer commande" },
      { key: "checkout_confirmation_title", title: "Confirmation · titre", type: "text", description: "Titre apres paiement reussi", placeholder: "Commande confirmee !" },
      { key: "checkout_confirmation_text", title: "Confirmation · texte", type: "text", description: "Message de confirmation", placeholder: "Vous recevrez un email de confirmation avec les details de votre commande.", rows: 2 },
    ],
  },
  {
    id: "track",
    name: "Suivi de commande",
    route: "/track",
    icon: PackageSearch,
    category: "page",
    description: "Page de suivi · titre, intro",
    blocks: [
      { key: "track_title", title: "Titre", type: "text", description: "", placeholder: "Suivre ma commande" },
      { key: "track_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Entrez votre numero de commande pour suivre son etat.", rows: 2 },
      { key: "track_cta", title: "Texte du bouton", type: "text", description: "", placeholder: "Suivre" },
    ],
  },
  {
    id: "login",
    name: "Connexion",
    route: "/login",
    icon: LogIn,
    category: "page",
    description: "Page de connexion",
    blocks: [
      { key: "login_title", title: "Titre", type: "text", description: "", placeholder: "Se connecter" },
      { key: "login_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Heureux de vous revoir.", rows: 2 },
      { key: "login_cta", title: "Texte du bouton", type: "text", description: "", placeholder: "Se connecter" },
      { key: "login_register_text", title: "Lien vers inscription", type: "text", description: "", placeholder: "Pas encore de compte ? Inscrivez-vous" },
    ],
  },
  {
    id: "register",
    name: "Inscription",
    route: "/register",
    icon: UserPlus,
    category: "page",
    description: "Page d'inscription",
    blocks: [
      { key: "register_title", title: "Titre", type: "text", description: "", placeholder: "Creer un compte" },
      { key: "register_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Rejoignez notre boutique en quelques secondes.", rows: 2 },
      { key: "register_cta", title: "Texte du bouton", type: "text", description: "", placeholder: "Creer mon compte" },
      { key: "register_login_text", title: "Lien vers connexion", type: "text", description: "", placeholder: "Deja inscrit ? Se connecter" },
    ],
  },
  {
    id: "account",
    name: "Mon compte",
    route: "/account",
    icon: User,
    category: "page",
    description: "Tableau de bord client",
    blocks: [
      { key: "account_title", title: "Titre", type: "text", description: "", placeholder: "Mon compte" },
      { key: "account_welcome", title: "Message d'accueil", type: "text", description: "", placeholder: "Bienvenue dans votre espace personnel." },
    ],
  },
  {
    id: "about",
    name: "A propos",
    route: "/pages/a-propos",
    icon: Info,
    category: "page",
    description: "Page de presentation",
    blocks: [
      { key: "page_about_title", title: "Titre de la page", type: "text", description: "", placeholder: "Notre histoire" },
      { key: "page_about_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Decouvrez qui nous sommes." },
      { key: "page_about", title: "Contenu", type: "html", description: "Texte complet (HTML accepte)", placeholder: "Racontez l'histoire de votre boutique...", rows: 12 },
      { key: "page_about_image", title: "Photo principale", type: "image", description: "Photo de l'equipe ou de la boutique", placeholder: "" },
    ],
  },
  {
    id: "contact",
    name: "Contact",
    route: "/pages/contact",
    icon: Mail,
    category: "page",
    description: "Page de contact",
    blocks: [
      { key: "page_contact_title", title: "Titre", type: "text", description: "", placeholder: "Nous contacter" },
      { key: "page_contact_subtitle", title: "Sous-titre", type: "text", description: "", placeholder: "Une question ? Notre equipe vous repond sous 24h.", rows: 2 },
      { key: "page_contact_email", title: "Email", type: "text", description: "", placeholder: "contact@maboutique.fr" },
      { key: "page_contact_phone", title: "Telephone", type: "text", description: "", placeholder: "01 23 45 67 89" },
      { key: "page_contact_address", title: "Adresse", type: "text", description: "", placeholder: "10 rue de Paris, 75001 Paris", rows: 2 },
      { key: "page_contact_hours", title: "Horaires", type: "text", description: "", placeholder: "Lundi-Vendredi : 9h-18h", rows: 2 },
    ],
  },
  {
    id: "404",
    name: "Page 404",
    route: "/404",
    icon: AlertTriangle,
    category: "page",
    description: "Page introuvable",
    blocks: [
      { key: "page_404_title", title: "Titre", type: "text", description: "", placeholder: "Page introuvable" },
      { key: "page_404_subtitle", title: "Texte", type: "text", description: "", placeholder: "La page que vous cherchez n'existe pas ou a ete deplacee.", rows: 2 },
      { key: "page_404_cta", title: "Texte du bouton", type: "text", description: "", placeholder: "Retour a l'accueil" },
    ],
  },

  // ==================== COMPONENTS ====================
  {
    id: "header",
    name: "En-tete",
    route: "Composant global",
    icon: PanelTop,
    category: "component",
    description: "Bandeau du haut, navigation",
    blocks: [
      { key: "header_announcement", title: "Bandeau d'annonce", type: "text", description: "Bandeau noir tout en haut (laissez vide pour masquer)", placeholder: "Livraison gratuite des 50€ d'achat" },
      { key: "header_search_placeholder", title: "Placeholder de recherche", type: "text", description: "Texte dans le champ de recherche", placeholder: "Rechercher un produit..." },
    ],
  },
  {
    id: "footer",
    name: "Pied de page",
    route: "Composant global",
    icon: Layout,
    category: "component",
    description: "Footer · texte, contact, liens",
    blocks: [
      { key: "footer_about", title: "Texte de description", type: "text", description: "Court texte sous le logo dans le footer", placeholder: "Votre boutique en ligne de confiance.", rows: 3 },
      { key: "footer_contact_email", title: "Email de contact", type: "text", description: "Email affiche dans le footer", placeholder: "contact@maboutique.fr" },
      { key: "footer_contact_phone", title: "Telephone", type: "text", description: "Numero affiche dans le footer", placeholder: "01 23 45 67 89" },
      { key: "footer_contact_address", title: "Adresse", type: "text", description: "Adresse affichee dans le footer", placeholder: "10 rue de Paris, 75001 Paris" },
      { key: "footer_copyright", title: "Mention copyright", type: "text", description: "Texte tout en bas du footer", placeholder: "© 2026 Ma Boutique. Tous droits reserves." },
    ],
  },

  // ==================== LEGAL ====================
  {
    id: "cgv",
    name: "CGV",
    route: "/pages/cgv",
    icon: Scale,
    category: "legal",
    description: "Conditions generales de vente",
    blocks: [
      { key: "page_cgv", title: "Conditions Generales de Vente", type: "html", description: "Contenu complet des CGV", placeholder: "Redigez vos CGV ici...", rows: 20 },
    ],
  },
  {
    id: "mentions",
    name: "Mentions legales",
    route: "/pages/mentions-legales",
    icon: FileText,
    category: "legal",
    description: "Informations legales obligatoires",
    blocks: [
      { key: "page_mentions_legales", title: "Mentions legales", type: "html", description: "", placeholder: "Redigez vos mentions legales ici...", rows: 20 },
    ],
  },
  {
    id: "retour",
    name: "Politique de retour",
    route: "/pages/politique-retour",
    icon: RotateCcw,
    category: "legal",
    description: "Conditions de retour et remboursement",
    blocks: [
      { key: "page_politique_retour", title: "Politique de retour", type: "html", description: "", placeholder: "Redigez votre politique de retour ici...", rows: 15 },
    ],
  },
  {
    id: "confidentialite",
    name: "Confidentialite",
    route: "/pages/politique-confidentialite",
    icon: Lock,
    category: "legal",
    description: "RGPD et gestion des donnees",
    blocks: [
      { key: "page_politique_confidentialite", title: "Politique de confidentialite", type: "html", description: "", placeholder: "Redigez votre politique de confidentialite ici...", rows: 15 },
    ],
  },
];

const FILTERS: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "page", label: "Pages" },
  { id: "component", label: "Composants" },
  { id: "legal", label: "Legal" },
];

export default function AdminContentPage() {
  const [contents, setContents] = useState<Record<string, string>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [selectedId, setSelectedId] = useState<string>("homepage");

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data: ContentRecord[]) => {
        const map: Record<string, string> = {};
        if (Array.isArray(data)) data.forEach((c) => (map[c.key] = c.value));
        setContents(map);
        setLoading(false);
      });
  }, []);

  const filteredPages = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PAGES.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [search, filter]);

  const selected = PAGES.find((p) => p.id === selectedId) || PAGES[0];
  const selectedModifiedCount = selected.blocks.filter((b) => modified[b.key]).length;

  function updateContent(key: string, value: string) {
    setContents((prev) => ({ ...prev, [key]: value }));
    setModified((prev) => ({ ...prev, [key]: true }));
  }

  async function saveBlock(block: Block) {
    setSaving((prev) => ({ ...prev, [block.key]: true }));
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: block.key,
        type: block.type === "image" ? "image" : block.type === "html" ? "html" : "text",
        title: block.title,
        value: contents[block.key] || "",
      }),
    });
    if (res.ok) {
      toast.success("Sauvegarde");
      setModified((prev) => ({ ...prev, [block.key]: false }));
    } else {
      toast.error("Erreur de sauvegarde");
    }
    setSaving((prev) => ({ ...prev, [block.key]: false }));
  }

  async function saveAllInPage(page: PageDef) {
    setSavingAll(true);
    for (const block of page.blocks) {
      if (modified[block.key]) {
        // eslint-disable-next-line no-await-in-loop
        await saveBlock(block);
      }
    }
    setSavingAll(false);
  }

  async function handleImageUpload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        updateContent(key, data.url);
        toast.success("Image uploadee");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur upload");
      }
    } catch {
      toast.error("Erreur upload");
    }
    setUploading(null);
    e.target.value = "";
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Contenu du site</h1>
        <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Contenu du site</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Modifiez les textes et images de toutes les pages de votre boutique
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
        {/* ============== SIDEBAR ============== */}
        <aside className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une page..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-1 min-w-fit px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
                  filter === f.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Pages list */}
          <div className="bg-white border border-gray-100 rounded-2xl p-2 space-y-0.5 max-h-72 lg:max-h-[70vh] overflow-y-auto">
            {filteredPages.length === 0 && (
              <p className="text-[12px] text-gray-400 text-center py-6">Aucune page trouvee</p>
            )}
            {filteredPages.map((page) => {
              const isSelected = page.id === selectedId;
              const pageModified = page.blocks.some((b) => modified[b.key]);
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedId(page.id);
                    // On mobile, scroll editor into view
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      requestAnimationFrame(() => {
                        document
                          .getElementById("admin-content-editor")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      });
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-white/10" : "bg-gray-100"
                    }`}
                  >
                    <page.icon size={14} className={isSelected ? "text-white" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium truncate">{page.name}</p>
                      {pageModified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className={`text-[11px] truncate ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                      {page.route}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ============== EDITOR ============== */}
        <main id="admin-content-editor">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <selected.icon size={18} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-gray-900 truncate">{selected.name}</h2>
                  <p className="text-[12px] text-gray-400 truncate">{selected.description}</p>
                </div>
              </div>
              {selectedModifiedCount > 0 && (
                <button
                  onClick={() => saveAllInPage(selected)}
                  disabled={savingAll}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white text-[12px] px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Save size={12} />
                  <span className="hidden sm:inline">{savingAll ? "Sauvegarde..." : `Sauvegarder (${selectedModifiedCount})`}</span>
                  <span className="sm:hidden">{savingAll ? "..." : `(${selectedModifiedCount})`}</span>
                </button>
              )}
            </div>

            {/* Blocks */}
            <div className="px-4 sm:px-6 py-5 space-y-6">
              {selected.blocks.map((block) => (
                <div key={block.key}>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="min-w-0">
                      <label className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700">
                        {block.type === "image" ? (
                          <ImageIcon size={13} className="text-gray-400" />
                        ) : (
                          <Type size={13} className="text-gray-400" />
                        )}
                        {block.title}
                      </label>
                      {block.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{block.description}</p>
                      )}
                    </div>
                    {modified[block.key] && (
                      <button
                        onClick={() => saveBlock(block)}
                        disabled={saving[block.key]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {saving[block.key] ? (
                          <>
                            <Check size={12} /> Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save size={12} /> Sauvegarder
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {block.type === "image" ? (
                    <div className="mt-2">
                      {contents[block.key] && (
                        <div className="mb-3 relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contents[block.key]}
                            alt={block.title}
                            className="max-h-40 rounded-xl border border-gray-100 object-cover"
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition">
                        <div className="text-center">
                          {uploading === block.key ? (
                            <p className="text-[12px] text-gray-400">Upload...</p>
                          ) : (
                            <>
                              <ImageIcon size={20} className="mx-auto text-gray-300 mb-1" />
                              <p className="text-[12px] text-gray-400">Cliquer pour choisir une image</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(block.key, e)}
                          disabled={uploading === block.key}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : block.type === "html" ? (
                    <textarea
                      value={contents[block.key] || ""}
                      onChange={(e) => updateContent(block.key, e.target.value)}
                      rows={block.rows || 6}
                      placeholder={block.placeholder}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-mono"
                    />
                  ) : (
                    <input
                      type="text"
                      value={contents[block.key] || ""}
                      onChange={(e) => updateContent(block.key, e.target.value)}
                      placeholder={block.placeholder}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
