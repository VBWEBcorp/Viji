import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbJsonLd } from "./JsonLd";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

export default function Breadcrumbs({ items, baseUrl = "" }: BreadcrumbsProps) {
  const allItems = [{ label: "Accueil", href: "/" }, ...items];

  const jsonLdItems = allItems
    .filter((item) => item.href)
    .map((item) => ({
      name: item.label,
      url: `${baseUrl}${item.href}`,
    }));

  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} />
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-gray-400 mb-6 flex-wrap">
        {allItems.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
            {item.href && i < allItems.length - 1 ? (
              <Link href={item.href} className="hover:text-gray-700 transition">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
