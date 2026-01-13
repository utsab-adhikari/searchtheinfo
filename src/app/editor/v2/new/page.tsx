"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

interface Category {
  _id: string;
  title: string;
}

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setSlug(generated);
  }, [title]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load categories");

        setCategories(data.data || []);
      } catch (err) {
        console.error("❌ Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/articles/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          abstract,
          category,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create article");
        setLoading(false);
        return;
      }

      router.push(`/editor/v2/${slug}`);
    } catch (error) {
      console.error("❌ Create article error:", error);
      alert("Something went wrong while creating the article");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-emerald-500 mb-2">
            Research Editor · v2
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Initialize New Article
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            Create the structural foundation of your research work. Content comes
            next.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8 backdrop-blur"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Understanding Linux Scheduling Internals"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Slug (URL Identifier)
            </label>
            <input
              type="text"
              placeholder="auto-generated-from-title"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-zinc-500 mt-1">
              This becomes: /editor/v2/{slug || "your-slug"}
            </p>
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Abstract
            </label>
            <textarea
              placeholder="Brief summary of what this article will explore..."
              className="w-full min-h-[120px] bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all resize-none"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Category
            </label>
            <select
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Keywords
            </label>
            <input
              type="text"
              placeholder="kernel, scheduling, linux, os"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Comma separated. Used for indexing and research discovery.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  Initialize Article
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
