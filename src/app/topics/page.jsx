"use client";

import { useEffect, useState } from "react";

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    id: "",
    topic: "",
    description: "",
    category: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetchCategories();
  }, []);

  async function fetchTopics() {
    setLoading(true);
    const res = await fetch("/api/topic");
    if (res.ok) {
      setTopics(await res.json());
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch("/api/category");
    if (res.ok) {
      setCategories(await res.json());
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/topic", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await fetchTopics();
      setForm({ id: "", topic: "", description: "", category: "" });
      setEditing(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    await fetch("/api/topic", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTopics();
  }

  function handleEdit(topic) {
    setForm({
      id: topic._id,
      topic: topic.topic,
      description: topic.description,
      category: topic.category?._id || "",
    });
    setEditing(true);
  }

  async function toggleResearched(t, checked) {
    // Optimistic UI update
    setTopics((prev) =>
      prev.map((topic) =>
        topic._id === t._id ? { ...topic, isResearched: checked } : topic
      )
    );

    const res = await fetch("/api/topic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: t._id,
        topic: t.topic,
        description: t.description,
        category: t.category?._id,
        isResearched: checked,
      }),
    });

    if (!res.ok) {
      alert("Failed to update topic status.");
      fetchTopics(); // rollback on error
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-light text-white mb-8 text-center sm:text-left">
          Manage <span className="text-emerald-400 font-medium">Topics</span>
        </h1>

        {/* Topic Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1c23] border border-gray-800 rounded-lg p-6 mb-10 shadow-lg"
        >
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Topic Name"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-4 py-2 rounded-md bg-[#0f1117] border border-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full px-4 py-2 rounded-md bg-[#0f1117] border border-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full px-4 py-2 rounded-md bg-[#0f1117] border border-gray-700 text-gray-100 focus:ring-2 focus:ring-emerald-500 outline-none mb-4 resize-none"
          />

          <div className="flex flex-wrap gap-4">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md transition"
            >
              {editing ? "Update Topic" : "Create Topic"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm({ id: "", topic: "", description: "", category: "" });
                }}
                className="border border-gray-700 hover:border-emerald-500 px-6 py-2 rounded-md transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Topics Grouped by Category */}
        {loading ? (
          <p className="text-gray-400 text-center">Loading topics...</p>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const categoryTopics = topics.filter(
                (t) => t.category?._id === cat._id
              );

              return (
                <div key={cat._id} className="border-b border-gray-800 pb-6">
                  <h2 className="text-2xl font-light text-white mb-4 text-center sm:text-left">
                    <span className="text-emerald-400 font-medium">
                      {cat.name}
                    </span>{" "}
                    Topics
                  </h2>

                  {categoryTopics.length === 0 ? (
                    <p className="text-gray-500 text-sm italic text-center">
                      No topics available for this category.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                      {categoryTopics.map((t) => (
                        <div
                          key={t._id}
                          className="bg-[#1a1c23] border border-gray-800 rounded-lg p-5 hover:border-emerald-500 transition shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-white">
                              {t.topic}
                            </h3>
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                              <input
                                type="checkbox"
                                checked={t.isResearched}
                                onChange={(e) =>
                                  toggleResearched(t, e.target.checked)
                                }
                                className="w-4 h-4 text-emerald-500 bg-[#0f1117] border border-gray-700 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              Researched
                            </label>
                          </div>

                          <p className="text-sm text-gray-400 mt-2 mb-4 break-words">
                            {t.description || "No description provided."}
                          </p>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEdit(t)}
                              className="px-3 py-1 border border-gray-700 rounded-md hover:border-emerald-500 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t._id)}
                              className="px-3 py-1 border border-red-700 text-red-400 rounded-md hover:border-red-500 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
