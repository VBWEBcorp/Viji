"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const BlogEditor = dynamic(() => import("@/components/admin/BlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-[var(--brand-cream)]/60" />
      <div className="h-64 bg-[var(--brand-cream)]/60" />
    </div>
  ),
});

export default function EditBlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setPost(data);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-[28px] sm:text-4xl text-gray-900 mb-6">Modifier l&apos;article</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-[var(--brand-cream)]/60" />
          <div className="h-64 bg-[var(--brand-cream)]/60" />
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="text-gray-500">Article non trouvé</div>;
  }

  return <BlogEditor initialData={post} editSlug={slug as string} />;
}
