"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import LoadingUI from "../loading";
import AdminHeader from "@/components/AdminHeader";

import {
  MdOutlineArticle,
  MdOutlinePublish,
  MdShare,
  MdOutlineModeEditOutline,
} from "react-icons/md";
import { RiDraftLine } from "react-icons/ri";
import { TbCategory } from "react-icons/tb";
import { IoMdTime } from "react-icons/io";
import { FaRegFileWord, FaTrashAlt } from "react-icons/fa";
import { BsCalendar2Date } from "react-icons/bs";
import { FaFacebook, FaWhatsapp, FaLink } from "react-icons/fa6";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("draft");
  const [articles, setArticles] = useState({ draft: [], published: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [shareModal, setShareModal] = useState(null);
  const router = useRouter();

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch articles");

      setArticles({
        draft: data.draftArticles || [],
        published: data.publishedArticles || [],
      });
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (slug, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      setDeletingId(slug);
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete article");
      await fetchArticles();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = (article) => {
    setShareModal(article);
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  if (loading) return <LoadingUI />;

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        {/* New Article Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/editor"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            + New Article
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Articles"
            value={articles.draft.length + articles.published.length}
            icon={<MdOutlineArticle />}
          />
          <StatCard
            title="Published"
            value={articles.published.length}
            color="text-emerald-400"
            icon={<MdOutlinePublish />}
          />
          <StatCard
            title="Drafts"
            value={articles.draft.length}
            color="text-yellow-400"
            icon={<RiDraftLine />}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError("")} className="text-red-400">
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden">
          <div className="border-b border-gray-800 flex">
            {["draft", "published"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-1/2 py-4 font-medium text-sm border-b-2 transition ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab === "draft"
                  ? `Draft Articles (${articles.draft.length})`
                  : `Published Articles (${articles.published.length})`}
              </button>
            ))}
          </div>

          {/* Article List */}
          <div className="p-6">
            {(activeTab === "draft"
              ? articles.draft
              : articles.published
            ).length === 0 ? (
              <EmptyState type={activeTab} />
            ) : (
              (activeTab === "draft"
                ? articles.draft
                : articles.published
              ).map((article) => (
                <ArticleCard
                  key={article._id}
                  article={article}
                  type={activeTab}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                  onShare={handleShare}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div
          onClick={() => setShareModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1c23] border border-gray-700 rounded-xl p-6 max-w-sm w-full text-center"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Share: {shareModal.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Choose a platform to share this article.
            </p>
            <div className="flex justify-center gap-6 text-2xl mb-4">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://searchtheinfo.utsabadhikari.me/articles/${shareModal.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition"
              >
                <FaFacebook />
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check this out: https://searchtheinfo.utsabadhikari.me/articles/${shareModal.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition"
              >
                <FaWhatsapp />
              </a>
              <button
                onClick={() =>
                  copyToClipboard(
                    `https://searchtheinfo.utsabadhikari.me/articles/${shareModal.slug}`
                  )
                }
                className="text-gray-400 hover:text-white transition"
              >
                <FaLink />
              </button>
            </div>
            <button
              onClick={() => setShareModal(null)}
              className="mt-3 text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Reusable Components --- */
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6 flex justify-between items-center hover:border-emerald-600/40 transition">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className={`text-2xl font-semibold mt-1 ${color || "text-white"}`}>
          {value}
        </p>
      </div>
      <div className="text-2xl opacity-70">{icon}</div>
    </div>
  );
}

function EmptyState({ type }) {
  const icon = type === "draft" ? "📝" : "🚀";
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No {type === "draft" ? "Draft" : "Published"} Articles
      </h3>
      <p className="text-gray-400 mb-6">
        {type === "draft"
          ? "Start creating your first article!"
          : "You haven’t published anything yet."}
      </p>
      <Link
        href="/editor"
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
      >
        Create Article
      </Link>
    </div>
  );
}

function ArticleCard({ article, type, onDelete, deletingId, onShare }) {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="border border-gray-800 rounded-lg p-5 bg-[#14161d] hover:border-emerald-600/40 transition-all shadow-sm">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white">
              {article.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                type === "published"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {type === "published" ? "Published" : "Draft"}
            </span>
          </div>

          {article.excerpt && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500">
            {article.category?.name && (
              <span className="flex items-center gap-1">
                <TbCategory /> {article.category.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <IoMdTime /> {Math.max(1, Math.round(article.wordCount / 200))}{" "}
              min read
            </span>
            <span className="flex items-center gap-1">
              <FaRegFileWord /> {article.wordCount || 0} words
            </span>
            <span className="flex items-center gap-1">
              <BsCalendar2Date /> {formatDate(article.updatedAt)}
            </span>
          </div>

          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {article.tags.slice(0, 3).map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 self-start">
          <Link
            href={`/articles/${article.slug}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm flex items-center gap-2 transition"
          >
            <MdOutlineArticle /> {type === "draft" ? "Preview" : "View"}
          </Link>
          <Link
            href={`/editor/${article.slug}`}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm flex items-center gap-2 transition"
          >
            <MdOutlineModeEditOutline /> Edit
          </Link>
          <button
            onClick={() => onShare(article)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center gap-2 transition"
          >
            <MdShare /> Share
          </button>
          <button
            onClick={() => onDelete(article.slug, article.title)}
            disabled={deletingId === article.slug}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm flex items-center gap-2 disabled:opacity-50 transition"
          >
            <FaTrashAlt />
            {deletingId === article.slug ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
