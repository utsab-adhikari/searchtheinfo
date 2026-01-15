"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: {
    name?: string;
    title?: string;
  };
  researchedBy?: {
    name: string;
    email: string;
  };
  publishedAt?: string;
  createdAt?: string;
  tags?: string[];
  status: string;
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/articles/v2");
        if (!res.ok) {
          throw new Error("Failed to fetch articles");
        }

        const data = await res.json();
        setArticles(data.articles || []);
      } catch (err: any) {
        setError(err.message || "Error loading articles");
        console.error("Failed to fetch articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTag = (article: Article) => {
    if (article.category?.name) return article.category.name;
    if (article.category?.title) return article.category.title;
    if (article.tags && article.tags.length > 0) return article.tags[0];
    return "Article";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100 font-sans">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Error Loading Articles
            </h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <main className="relative z-10">
        <Header />
        <section
          id="articles"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Recent Insights
              </h2>
              <p className="text-zinc-400 mt-2 text-sm sm:text-base">
                Latest breakdowns and technical deep dives.
              </p>
            </div>
          </div>

          {loading ? (
            <ArticlesSkeleton />
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="text-4xl mb-4 text-zinc-700">📄</div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Articles Found
              </h3>
              <p className="text-zinc-400 mb-6">
                We don't have any articles published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8">
              {articles.map((article) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug}`}
                  className="group h-full"
                >
                  <div className="h-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 hover:border-emerald-500/50 hover:bg-zinc-900/70 transition-all flex flex-col backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                        {getTag(article)}
                      </span>
                      <span className="text-zinc-500 text-xs font-medium">
                        {article.researchedBy
                          ? `${article.researchedBy.name}`
                          : "Unknown"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-3 group-hover:text-emerald-300 transition-colors leading-tight">
                      {article.title}
                    </h3>

                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 flex-grow line-clamp-3">
                      {article.excerpt ||
                        "No excerpt available for this article."}
                    </p>

                    <div className="flex items-center text-xs text-zinc-500 border-t border-zinc-800 pt-4 w-full mt-auto">
                      <span>
                        {formatDate(article.publishedAt || article.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ArticlesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-pulse"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="h-5 w-20 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-16 bg-zinc-800 rounded-md"></div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="h-5 bg-zinc-800 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
            <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
          </div>

          <div className="flex items-center pt-4 border-t border-zinc-800 mt-auto">
            <div className="h-3 w-24 bg-zinc-800 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
