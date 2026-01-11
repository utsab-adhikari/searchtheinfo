"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2,
  ArrowLeft,
  Hash,
  LayoutList,
  Type,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface ICategory {
  _id: string;
  title: string;
}

export default function NewArticle() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    excerpt: "",
    tags: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData({ ...formData, title, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.slug.trim() || !formData.category) {
      toast.error("Title, slug, and category are required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        category: formData.category,
        excerpt: formData.excerpt,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
      };

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to initialize article");
      }

      toast.success("Article initialized! Redirecting to editor...");
      router.push(`/editor/${result.data.slug}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
      <Toaster position="top-right" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FilePlus2 className="text-emerald-500" />
              Start New Article
            </h1>
            <p className="text-zinc-400 mt-2 max-w-xl">
              Configure slug, title, category, and excerpt to launch the block editor.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <section className="lg:col-span-4">
            <form
              onSubmit={handleSubmit}
              className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-white mb-6 border-b border-zinc-800 pb-4">
                Article Metadata
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Building Scalable APIs"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Slug (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-")
                            .replace(/-+/g, "-"),
                        })
                      }
                      placeholder="building-scalable-apis"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          slug: formData.title
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-")
                            .replace(/-+/g, "-"),
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                    >
                      Use title
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                  >
                    <option value="" className="bg-zinc-900 text-zinc-300">
                      Select a category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id} className="bg-zinc-900 text-zinc-100">
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="api, scaling, performance"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Comma-separated for discovery.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Excerpt
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder="Short teaser for the article card..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Launch Editor
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}