"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create or Update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const method = editId ? "PUT" : "POST";
      const body = editId
        ? { id: editId, name, description }
        : { name, description };

      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setEditId(null);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (error) {
      console.error("Error submitting category:", error);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchCategories();
      else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // Edit category
  const handleEdit = (cat) => {
    setName(cat.name);
    setDescription(cat.description);
    setEditId(cat._id);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-12">
      <h1 className="text-4xl font-light text-white mb-6 text-center">
        Category Manager
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-[#1a1c23] border border-gray-800 rounded-lg p-6 mb-12"
      >
        <h2 className="text-xl font-medium mb-4">
          {editId ? "Edit Category" : "Create Category"}
        </h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0f1117] border border-gray-700 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-emerald-500"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#0f1117] border border-gray-700 rounded-md px-4 py-2 text-gray-100 focus:outline-none focus:ring-emerald-500"
            rows={3}
          ></textarea>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-md text-white font-medium transition"
          >
            {editId ? "Update Category" : "Create Category"}
          </button>
        </div>
      </form>

      {/* Category List */}
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-400">No categories found.</div>
        ) : (
          <div className="grid gap-4">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex justify-between items-center bg-[#1a1c23] border border-gray-800 rounded-lg px-4 py-3"
              >
                <div>
                  <h3 className="text-white font-medium">{cat.name}</h3>
                  <p className="text-gray-400 text-sm">{cat.description}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-emerald-400 hover:text-emerald-500"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
