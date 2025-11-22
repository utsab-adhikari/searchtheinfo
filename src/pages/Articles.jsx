"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCalendarAlt, FaTags } from "react-icons/fa";
import Header from "@/components/Header";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchArticles = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?page=${page}&limit=6`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setArticles([]);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  useEffect(() => {
    fetchArticles(page);
  }, [page]);

  const isEmpty = !loading && initialLoaded && articles.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Page Header */}
        <div className="flex flex-col items-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white text-center mb-3">
            Latest <span className="text-emerald-400 font-medium">Articles</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base text-center max-w-xl">
            Deep dives into networking, programming, AI, and technical topics —
            curated and written to be clear and practical.
          </p>
        </div>

        {/* Loading & Content */}
        {loading && !initialLoaded && (
          <ArticlesSkeleton />
        )}

        {!loading && isEmpty && (
          <p className="text-center text-gray-500 text-sm sm:text-base">
            No articles found yet. Check back soon for new content.
          </p>
        )}

        {/* Content / Skeleton for page changes */}
        {(!loading || initialLoaded) && (
          <div className="space-y-4 sm:space-y-6">
            {loading && initialLoaded ? (
              <ArticlesSkeleton />
            ) : (
              articles.map((article) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug}`}
                  className="group block bg-[#151720] border border-gray-800/80 rounded-xl p-5 sm:p-6 hover:border-emerald-500/50 hover:bg-[#191b25] transition-colors duration-200"
                >
                  <div className="flex flex-col gap-2 sm:gap-3">
                    <h2 className="text-lg sm:text-2xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {article.title}
                    </h2>

                    {article.excerpt && (
                      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-[11px] sm:text-xs text-gray-500 mt-1">
                      {article.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#1f2230] border border-gray-800 text-emerald-300/90">
                          <FaTags className="text-[10px]" />
                          {article.category.name}
                        </span>
                      )}
                      {article.publishedAt && (
                        <span className="inline-flex items-center gap-1">
                          <FaCalendarAlt className="text-[10px]" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <span className="truncate">
                          Tags:{" "}
                          <span className="text-gray-300">
                            {article.tags.join(", ")}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 sm:gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="px-3 sm:px-4 py-2 text-sm bg-[#151720] border border-gray-700 rounded-lg hover:bg-[#1c1f2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 rounded-lg bg-[#151720] border border-gray-800">
              Page <span className="text-white">{page}</span> of{" "}
              <span className="text-white">{totalPages}</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-3 sm:px-4 py-2 text-sm bg-[#151720] border border-gray-700 rounded-lg hover:bg-[#1c1f2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for articles list
 */
function ArticlesSkeleton() {
  // show 3 skeleton cards (match your `limit=6` grid, but vertically)
  const placeholders = Array.from({ length: 3 });

  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {placeholders.map((_, idx) => (
        <div
          key={idx}
          className="bg-[#151720] border border-gray-800/80 rounded-xl p-5 sm:p-6"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="h-5 sm:h-6 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-800 rounded w-5/6" />
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="h-6 bg-gray-800 rounded-full w-24" />
              <div className="h-6 bg-gray-800 rounded-full w-20" />
              <div className="h-6 bg-gray-800 rounded-full w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}