"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  FolderPlus,
  AlertCircle,
  Hash,
  ShieldCheck,
  Lock,
  User,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";

interface IUser {
  _id: string;
  name: string;
  email?: string;
}

interface ICategory {
  _id: string;
  title: string;
  description?: string;
  createdBy: IUser;
  createdAt?: string;
}

export default function CategoryManager() {
  const { data: session, status } = useSession();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  /* -------------------------------------------------------------------------- */
  /*                                  FETCHING                                  */
  /* -------------------------------------------------------------------------- */

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to fetch categories");
      }

      const sorted = (result.data || []).sort(
        (a: ICategory, b: ICategory) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
      setCategories(sorted);
    } catch (error: any) {
      toast.error(error.message || "Unable to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!(session?.user as any)?.id) {
      toast.error("You must be logged in to create a category");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Category title is required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to create category");
      }

      toast.success("Category created successfully");
      setFormData({ title: "", description: "" });
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string, creatorId: string) => {
    if ((session?.user as any)?.id !== creatorId) {
      toast.error("You are not authorized to delete this category");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to permanently delete this category?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      toast.success("Category deleted");
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster position="top-right" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <Header />
      <div className="relative z-10 py-10 max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FolderPlus className="text-emerald-500" />
              Research Domains
            </h1>
            <p className="text-zinc-400 mt-2 max-w-xl">
              Organize and manage knowledge categories for your research
              articles and technical documentation.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-4">
            <form
              onSubmit={handleCreate}
              className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-white mb-6 border-b border-zinc-800 pb-4">
                Create New Domain
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Domain Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Machine Learning"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Briefly describe the scope of this domain..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <section className="lg:col-span-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-zinc-500">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                <AlertCircle className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-zinc-400">
                  No research domains have been created yet.
                </p>
              </div>
            ) : (
              <div
                className={`${
                  categories.length > 4 ? "max-h-[600px] overflow-y-auto" : ""
                } space-y-3 pr-2`}
              >
                {categories.map((category) => {
                  const isOwner =
                    (session?.user as any)?.id === category.createdBy?._id;

                  return (
                    <div
                      key={category._id}
                      className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 p-3 rounded-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            isOwner
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <Hash className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="text-sm font-semibold text-zinc-100 truncate">
                              {category.title}
                            </h3>
                            {!isOwner && (
                              <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                            {category.description || "No description provided."}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
                            <User className="w-3 h-3" />
                            <span className="text-zinc-400">
                              {category.createdBy?.name || "Unknown"}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isOwner ? (
                            <button
                              onClick={() =>
                                handleDelete(
                                  category._id,
                                  category.createdBy._id
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          ) : (
                            <span className="text-[10px] uppercase font-semibold text-zinc-700 px-2 py-1 bg-zinc-800/60 rounded">
                              Managed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
