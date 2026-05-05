import { connectDB } from "@/lib/db";
import Content from "@/models/Content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const legalPages: Record<
  string,
  { title: string; contentKey: string; defaultContent: string }
> = {
  cgv: {
    title: "Conditions Générales de Vente",
    contentKey: "page_cgv",
    defaultContent: `
      <h2>Article 1 – Objet</h2>
      <p>Les présentes conditions générales de vente régissent les relations contractuelles entre la boutique et ses clients.</p>
      <h2>Article 2 – Prix</h2>
      <p>Les prix sont indiqués en euros TTC. La boutique se réserve le droit de modifier ses prix à tout moment.</p>
      <h2>Article 3 – Commandes</h2>
      <p>Toute commande implique l'acceptation des présentes conditions générales de vente.</p>
      <h2>Article 4 – Paiement</h2>
      <p>Le paiement est exigible immédiatement à la commande. Les paiements sont sécurisés par Stripe et PayPal.</p>
      <h2>Article 5 – Livraison</h2>
      <p>Les délais de livraison sont donnés à titre indicatif. La boutique ne pourra être tenue responsable des retards de livraison imputables au transporteur.</p>
      <h2>Article 6 – Droit de rétractation</h2>
      <p>Conformément à la législation en vigueur, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation.</p>
    `,
  },
  "mentions-legales": {
    title: "Mentions légales",
    contentKey: "page_mentions_legales",
    defaultContent: `
      <h2>Éditeur du site</h2>
      <p>Nom de l'entreprise : [À compléter]</p>
      <p>Adresse : [À compléter]</p>
      <p>SIRET : [À compléter]</p>
      <p>Email : contact@example.com</p>
      <h2>Hébergeur</h2>
      <p>Netlify, Inc. – 44 Montgomery Street, Suite 300 – San Francisco, CA 94104</p>
      <h2>Propriété intellectuelle</h2>
      <p>L'ensemble du contenu de ce site est protégé par les lois relatives à la propriété intellectuelle.</p>
    `,
  },
  "politique-retour": {
    title: "Politique de retour",
    contentKey: "page_politique_retour",
    defaultContent: `
      <h2>Droit de rétractation</h2>
      <p>Vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour retourner un article.</p>
      <h2>Conditions de retour</h2>
      <p>Les articles doivent être retournés dans leur emballage d'origine, non utilisés et en parfait état.</p>
      <h2>Procédure de retour</h2>
      <p>Contactez-nous par email pour obtenir un numéro de retour. Les frais de retour sont à la charge du client.</p>
      <h2>Remboursement</h2>
      <p>Le remboursement sera effectué dans un délai de 14 jours suivant la réception du retour.</p>
    `,
  },
  "politique-confidentialite": {
    title: "Politique de confidentialité",
    contentKey: "page_politique_confidentialite",
    defaultContent: `
      <h2>Collecte des données</h2>
      <p>Nous collectons les données personnelles nécessaires au traitement de vos commandes : nom, email, adresse, téléphone.</p>
      <h2>Utilisation des données</h2>
      <p>Vos données sont utilisées uniquement pour le traitement de vos commandes et l'envoi d'emails transactionnels.</p>
      <h2>Protection des données</h2>
      <p>Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers à des fins commerciales.</p>
      <h2>Vos droits (RGPD)</h2>
      <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Contactez-nous pour exercer vos droits.</p>
      <h2>Cookies</h2>
      <p>Ce site utilise des cookies nécessaires au fonctionnement du panier et de l'authentification.</p>
    `,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug];

  if (!page) return { title: "Page non trouvée" };

  return {
    title: page.title,
    description: `${page.title} de Ma Boutique`,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = legalPages[slug];

  if (!page) {
    notFound();
  }

  await connectDB();

  // Chercher le contenu CMS, sinon utiliser le contenu par défaut
  const content = await Content.findOne({ key: page.contentKey }).lean();
  const htmlContent = content?.value || page.defaultContent;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
