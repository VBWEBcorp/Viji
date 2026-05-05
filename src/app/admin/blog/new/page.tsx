"use client";

import dynamic from "next/dynamic";

const BlogEditor = dynamic(() => import("@/components/admin/BlogEditor"), {
  ssr: false,
  loading: () => (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nouvel article</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  ),
});

export default function NewBlogPostPage() {
  return <BlogEditor />;
}
