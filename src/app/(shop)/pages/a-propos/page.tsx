import { connectDB } from "@/lib/db";
import { getContents, c } from "@/lib/content";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const cms = await getContents(["page_about_title", "page_about_subtitle"]);
  return {
    title: c(cms, "page_about_title", "Notre histoire"),
    description: c(cms, "page_about_subtitle", "Decouvrez qui nous sommes."),
  };
}

export default async function AboutPage() {
  await connectDB();
  const cms = await getContents([
    "page_about_title",
    "page_about_subtitle",
    "page_about",
    "page_about_image",
  ]);

  const title = c(cms, "page_about_title", "Notre histoire");
  const subtitle = c(cms, "page_about_subtitle", "Decouvrez qui nous sommes.");
  const html = cms.page_about || "";
  const image = cms.page_about_image || "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-3">{subtitle}</p>}
      </header>

      {image && (
        <div className="mb-10 rounded-2xl overflow-hidden border border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} className="w-full h-auto" />
        </div>
      )}

      {html ? (
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="text-gray-500 text-center py-12">
          Le contenu de cette page n&apos;a pas encore ete redige.
        </p>
      )}
    </div>
  );
}
