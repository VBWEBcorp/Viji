import { connectDB } from "@/lib/db";
import Content from "@/models/Content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Informations légales — MADAME VIJI TINOT (Entre Maman et Moi)
const COMPANY = {
  legalName: "Madame Viji Tinot",
  tradingName: "Entre Maman et Moi",
  commercialName: "Tinot Entreprenariat",
  form: "Entrepreneur individuel",
  siren: "953 254 406",
  siret: "953 254 406 00028",
  vat: "FR15953254406",
  ape: "4791B (Vente à distance sur catalogue spécialisé)",
  address: "3 rue de la Libération, 35770 Vern-sur-Seiche, France",
  email: "entremamanetmoicook@gmail.com",
  phone: "",
  director: "Viji Tinot",
  hostingName: "Vercel Inc.",
  hostingAddress: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
};

const legalPages: Record<
  string,
  { title: string; eyebrow: string; contentKey: string; defaultContent: string }
> = {
  "mentions-legales": {
    title: "Mentions légales",
    eyebrow: "Informations légales",
    contentKey: "page_mentions_legales",
    defaultContent: `
      <h2>Éditeur du site</h2>
      <p>
        <strong>${COMPANY.legalName}</strong> — exploitant la marque <em>${COMPANY.tradingName}</em><br />
        Forme juridique : ${COMPANY.form}<br />
        Nom commercial : ${COMPANY.commercialName}<br />
        Siège social : ${COMPANY.address}<br />
        SIREN : ${COMPANY.siren}<br />
        SIRET (siège) : ${COMPANY.siret}<br />
        Numéro de TVA intracommunautaire : ${COMPANY.vat}<br />
        Code APE / NAF : ${COMPANY.ape}<br />
        Email : <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      </p>

      <h2>Directrice de la publication</h2>
      <p>${COMPANY.director}</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>${COMPANY.hostingName}</strong><br />
        ${COMPANY.hostingAddress}
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu de ce site (textes, photographies, logos, graphismes, recettes) est la propriété exclusive de ${COMPANY.legalName} ou de ses partenaires, et est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Les données collectées sur ce site font l'objet d'un traitement informatique destiné au traitement des commandes et au service client. Pour en savoir plus, consultez notre <a href="/pages/politique-confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        Conformément à l'article L.612-1 du Code de la consommation, le consommateur a la possibilité de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige.
      </p>
    `,
  },
  cgv: {
    title: "Conditions générales de vente",
    eyebrow: "Vente à distance",
    contentKey: "page_cgv",
    defaultContent: `
      <h2>Article 1 – Objet</h2>
      <p>
        Les présentes conditions générales de vente régissent les relations contractuelles entre <strong>${COMPANY.legalName}</strong> (ci-après <em>${COMPANY.tradingName}</em>) et tout client effectuant un achat sur le site <strong>entre-maman-et-moi.fr</strong>.
      </p>

      <h2>Article 2 – Produits et services</h2>
      <p>
        ${COMPANY.tradingName} commercialise des box culinaires composées d'épices sèches et de fiches recettes, ainsi que des prestations d'ateliers de cuisine indienne et un service traiteur. Les produits sont décrits avec la plus grande précision possible, mais des variations mineures (couleur, présentation) peuvent exister.
      </p>

      <h2>Article 3 – Prix</h2>
      <p>
        Les prix sont indiqués en euros, hors frais de livraison. ${COMPANY.tradingName} se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix applicable est celui en vigueur au moment de la commande.
      </p>

      <h2>Article 4 – Commande</h2>
      <p>
        Toute commande passée sur le site implique l'acceptation pleine et entière des présentes conditions générales de vente. La commande est confirmée par l'envoi d'un email récapitulatif à l'adresse indiquée par le client.
      </p>

      <h2>Article 5 – Paiement</h2>
      <p>
        Le paiement est exigible au moment de la commande. Les paiements sont sécurisés et traités par <strong>Stripe</strong>. Les données bancaires ne transitent à aucun moment par les serveurs de ${COMPANY.tradingName}.
      </p>

      <h2>Article 6 – Livraison</h2>
      <p>
        Les commandes sont expédiées via <strong>Mondial Relay</strong> en point relais. Les délais de préparation sont en moyenne de 2 à 5 jours ouvrés à compter de la confirmation de la commande, auxquels s'ajoutent les délais d'acheminement Mondial Relay (généralement 2 à 4 jours). ${COMPANY.tradingName} ne pourra être tenue responsable des retards de livraison imputables au transporteur.
      </p>

      <h2>Article 7 – Droit de rétractation</h2>
      <p>
        <strong>Pour les box d'épices :</strong> conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sous réserve que les produits soient retournés dans leur emballage d'origine, non ouverts et en parfait état.
      </p>
      <p>
        <strong>Exception – produits périssables :</strong> conformément à l'article L221-28 4° du Code de la consommation, le droit de rétractation ne s'applique pas aux denrées alimentaires susceptibles de se détériorer rapidement (notamment les plats traiteur préparés).
      </p>
      <p>
        <strong>Pour les ateliers :</strong> annulation gratuite jusqu'à 7 jours avant la date de l'atelier. Au-delà, la prestation est due.
      </p>

      <h2>Article 8 – Allergènes</h2>
      <p>
        Nos box contiennent des épices et arômes pouvant comporter des traces des 14 allergènes majeurs réglementés. La liste complète des allergènes pour chaque produit est indiquée sur sa fiche. En cas d'allergie sévère, contactez-nous avant toute commande.
      </p>

      <h2>Article 9 – Responsabilité</h2>
      <p>
        ${COMPANY.tradingName} ne saurait être tenue responsable des dommages indirects résultant de l'utilisation des produits ou d'une mauvaise préparation des recettes par le client.
      </p>

      <h2>Article 10 – Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront seuls compétents.
      </p>
    `,
  },
  "politique-retour": {
    title: "Politique de retour",
    eyebrow: "Retour & remboursement",
    contentKey: "page_politique_retour",
    defaultContent: `
      <h2>Délai de rétractation</h2>
      <p>
        Vous disposez d'un délai de <strong>14 jours</strong> à compter de la réception de votre commande pour exercer votre droit de rétractation, conformément à l'article L221-18 du Code de la consommation.
      </p>

      <h2>Produits non concernés</h2>
      <p>
        Conformément à l'article L221-28 4° du Code de la consommation, le droit de rétractation <strong>ne s'applique pas</strong> aux <strong>plats traiteur préparés</strong> (denrées alimentaires susceptibles de se détériorer rapidement) ni aux <strong>ateliers</strong> (prestations de service exécutées).
      </p>

      <h2>Conditions de retour</h2>
      <p>
        Les box d'épices doivent être retournées :
      </p>
      <ul>
        <li>Dans leur <strong>emballage d'origine</strong>, non ouvert ;</li>
        <li>Avec tous les sachets d'épices et fiches recette intacts ;</li>
        <li>Accompagnées du numéro de commande.</li>
      </ul>

      <h2>Procédure</h2>
      <p>
        Contactez-nous à <a href="mailto:${COMPANY.email}">${COMPANY.email}</a> en indiquant votre numéro de commande. Nous vous communiquerons l'adresse de retour. <strong>Les frais de retour sont à la charge du client.</strong>
      </p>

      <h2>Remboursement</h2>
      <p>
        Une fois le retour reçu et vérifié, vous serez remboursé(e) sous <strong>14 jours</strong> sur le moyen de paiement utilisé lors de la commande.
      </p>
    `,
  },
  "politique-confidentialite": {
    title: "Politique de confidentialité",
    eyebrow: "Vos données personnelles",
    contentKey: "page_politique_confidentialite",
    defaultContent: `
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est <strong>${COMPANY.legalName}</strong>, ${COMPANY.address}.<br />
        Contact : <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      </p>

      <h2>Données collectées</h2>
      <p>
        Lors de la création d'un compte ou d'une commande, nous collectons :
      </p>
      <ul>
        <li>Nom et prénom</li>
        <li>Adresse email</li>
        <li>Numéro de téléphone (requis par Mondial Relay)</li>
        <li>Adresse de livraison (point relais sélectionné)</li>
        <li>Historique des commandes</li>
      </ul>

      <h2>Finalités</h2>
      <p>
        Vos données sont utilisées uniquement pour :
      </p>
      <ul>
        <li>Traiter et expédier vos commandes</li>
        <li>Vous envoyer les emails de suivi (confirmation, expédition, retrait)</li>
        <li>Répondre à vos demandes via le formulaire de contact</li>
        <li>Améliorer nos services (statistiques anonymisées)</li>
      </ul>

      <h2>Sous-traitants</h2>
      <p>
        Les données sont partagées uniquement avec nos prestataires nécessaires à l'exécution de la commande :
      </p>
      <ul>
        <li><strong>Stripe</strong> — traitement des paiements</li>
        <li><strong>Mondial Relay</strong> — expédition</li>
        <li><strong>Resend</strong> — envoi des emails transactionnels</li>
        <li><strong>Vercel</strong> — hébergement du site</li>
      </ul>
      <p>
        Aucune donnée n'est revendue ni transmise à des tiers à des fins commerciales.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données de commande sont conservées 10 ans pour respecter nos obligations comptables. Les données du compte client sont conservées tant que le compte est actif, puis supprimées sur demande ou après 3 ans d'inactivité.
      </p>

      <h2>Vos droits (RGPD)</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression, de portabilité et d'opposition au traitement de vos données personnelles. Pour exercer vos droits, écrivez-nous à <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise uniquement des cookies <strong>essentiels</strong> au fonctionnement (panier, authentification). Aucun cookie publicitaire n'est déposé sans votre consentement.
      </p>
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
    description: `${page.title} de ${COMPANY.tradingName}`,
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
  const content = await Content.findOne({ key: page.contentKey }).lean();
  const htmlContent = content?.value || page.defaultContent;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
            {page.eyebrow}
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-gray-900 leading-[1.05]">
            {page.title}
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/50 mx-auto mt-7" />
        </div>
      </section>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div
          className="prose prose-gray max-w-none prose-headings:font-serif prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-[14px] prose-p:leading-[1.85] prose-p:text-gray-700 prose-li:text-[14px] prose-li:text-gray-700 prose-a:text-[var(--brand-gold)] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className="mt-16 pt-8 border-t border-[var(--brand-gold)]/15 text-center">
          <p className="font-serif italic text-[13px] text-gray-500">
            Dernière mise à jour&nbsp;: {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </article>
    </div>
  );
}
