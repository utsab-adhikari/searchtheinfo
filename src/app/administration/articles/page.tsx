"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Clock,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface Article {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  status: "draft" | "published" | "archived";
  category?: {
    _id: string;
    title: string;
    slug: string;
  };
  researchedBy?: {
    _id: string;
    name: string;
  };
  views?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });

  useEffect(() => {
    loadArticles();
  }, [statusFilter]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const query = params.toString();
      const url = `/api/articles/v1${query ? `?${query}` : ""}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Failed to load articles");
        setArticles([]);
        setStats({ total: 0, published: 0, draft: 0, archived: 0 });
        return;
      }

      const list: Article[] = data.articles || [];
      setArticles(list);

      const total = list.length;
      const published = list.filter((a) => a.status === "published").length;
      const draft = list.filter((a) => a.status === "draft").length;
      const archived = list.filter((a) => a.status === "archived").length;
      setStats({ total, published, draft, archived });
    } catch (error) {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadArticles();
  };

  const deleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/articles/v1?id=${articleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Article deleted");
        loadArticles();
      } else {
        toast.error("Failed to delete article");
      }
    } catch (error) {
      toast.error("Error deleting article");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      published: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      archived: "bg-zinc-700/30 text-zinc-400 border border-zinc-700/40",
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[11px] font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      <Toaster position="top-right" />

      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Articles</span>
      </div>

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Articles Management</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{stats.total} Total Articles</p>
          </div>
          <Link
            href="/editor/v1/new"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-900/20"
          >
            <FileText className="w-3.5 h-3.5" />
            New Article
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<FileText className="w-4 h-4 text-zinc-400" />} 
            label="Total Articles" 
            value={stats.total}
            bgColor="bg-zinc-900/50"
            borderColor="border-zinc-800/30"
          />
          <StatCard 
            icon={<Eye className="w-4 h-4 text-emerald-400" />} 
            label="Published" 
            value={stats.published}
            bgColor="bg-emerald-500/5"
            borderColor="border-emerald-500/10"
          />
          <StatCard 
            icon={<Clock className="w-4 h-4 text-amber-400" />} 
            label="Drafts" 
            value={stats.draft}
            bgColor="bg-amber-500/5"
            borderColor="border-amber-500/10"
          />
          <StatCard 
            icon={<FileText className="w-4 h-4 text-zinc-500" />} 
            label="Archived" 
            value={stats.archived}
            bgColor="bg-zinc-900/50"
            borderColor="border-zinc-800/30"
          />
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search articles by title..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white focus:border-emerald-500 outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all"
              >
                Search
              </button>
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); loadArticles(); }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all border border-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs font-medium">Loading articles...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-400 mb-1">No articles found</h3>
              <p className="text-xs text-zinc-600 mb-4">Create your first article to get started</p>
              <Link
                href="/editor/v1/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Create Article
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-800/30">
                  <tr>
                    <th className="text-left p-3 font-medium text-zinc-400">Title</th>
                    <th className="text-left p-3 font-medium text-zinc-400 hidden sm:table-cell">Category</th>
                    <th className="text-left p-3 font-medium text-zinc-400 hidden md:table-cell">Author</th>
                    <th className="text-left p-3 font-medium text-zinc-400">Status</th>
                    <th className="text-left p-3 font-medium text-zinc-400 hidden md:table-cell">Views</th>
                    <th className="text-left p-3 font-medium text-zinc-400 hidden lg:table-cell">Updated</th>
                    <th className="text-right p-3 font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr 
                      key={article._id} 
                      className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <Link
                            href={`/editor/${article.slug}`}
                            className="font-medium text-white hover:text-emerald-400 transition-colors line-clamp-1"
                          >
                            {article.title}
                          </Link>
                          {article.description && (
                            <p className="text-zinc-500 mt-1 line-clamp-1">
                              {article.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        {article.category ? (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <Tag className="w-3 h-3" />
                            {article.category.title}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {article.researchedBy ? (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <User className="w-3 h-3" />
                            {article.researchedBy.name}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(article.status)}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Eye className="w-3 h-3" />
                          {article.views || 0}
                        </span>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-zinc-400">
                        {formatDate(article.updatedAt)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/editor/${article.slug}`}
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => deleteArticle(article._id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgColor, borderColor }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out`}>
      <div className="flex items-start justify-between">
        <div className="p-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
          {icon}
        </div>
      </div>
      <p className="text-[11px] font-medium text-zinc-400 mt-1.5">{label}</p>
      <h3 className="text-lg font-bold text-white mt-1">{value}</h3>
    </div>
  );
}