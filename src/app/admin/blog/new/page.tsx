"use client";

import dynamic from "next/dynamic";

const BlogEditor = dynamic(() => import("@/components/admin/BlogEditor"), {
  ssr: false,
  loading: () => (
    <div>
      <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 mb-6">Nouvel article</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[var(--brand-cream)]/60" />
        <div className="h-64 bg-[var(--brand-cream)]/60" />
      </div>
    </div>
  ),
});

export default function NewBlogPostPage() {
  return <BlogEditor />;
}
