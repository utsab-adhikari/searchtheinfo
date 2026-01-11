"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Trash2,
  Loader2,
  ArrowLeft,
  Eye,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface InterestedSubmission {
  _id: string;
  name: string;
  email: string;
  type?: string;
  timeline?: string;
  budget?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}


export default function InterestedAdmin() {
  const [submissions, setSubmissions] = useState<InterestedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<InterestedSubmission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/interested?limit=100&sortBy=createdAt&sortOrder=desc");
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.data);
      } else {
        toast.error("Failed to load submissions");
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    setDeleting(id);
    try {
      const response = await fetch("/api/interested", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setSubmissions(submissions.filter((s) => s._id !== id));
        toast.success("Submission deleted");
      } else {
        toast.error("Failed to delete submission");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission");
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Project Type", "Timeline", "Budget", "Submitted"];
    const rows = submissions.map((s) => [
      s.name,
      s.email,
      s.type || "N/A",
      s.timeline || "N/A",
      s.budget || "N/A",
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interested-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterType || s.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const projectTypes = Array.from(new Set(submissions.map((s) => s.type).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Interested Submissions</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Total Submissions</p>
            <p className="text-3xl font-bold text-white mt-1">{submissions.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">This Month</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">
              {submissions.filter(
                (s) =>
                  new Date(s.createdAt).getMonth() === new Date().getMonth() &&
                  new Date(s.createdAt).getFullYear() === new Date().getFullYear()
              ).length}
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Project Types</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{projectTypes.length}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent outline-none text-sm text-white"
              >
                <option value="">All Project Types</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="text-left p-4 font-medium text-zinc-300">Name</th>
                  <th className="text-left p-4 font-medium text-zinc-300">Email</th>
                  <th className="text-left p-4 font-medium text-zinc-300 hidden md:table-cell">
                    Project Type
                  </th>
                  <th className="text-left p-4 font-medium text-zinc-300 hidden lg:table-cell">
                    Timeline
                  </th>
                  <th className="text-left p-4 font-medium text-zinc-300 hidden xl:table-cell">
                    Budget
                  </th>
                  <th className="text-left p-4 font-medium text-zinc-300">Submitted</th>
                  <th className="text-right p-4 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission) => (
                    <tr
                      key={submission._id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="p-4 font-medium text-white">{submission.name}</td>
                      <td className="p-4">
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {submission.email}
                        </a>
                      </td>
                      <td className="p-4 text-zinc-400 hidden md:table-cell">
                        <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                          {submission.type || "N/A"}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400 hidden lg:table-cell">
                        {submission.timeline || "N/A"}
                      </td>
                      <td className="p-4 text-zinc-400 hidden xl:table-cell">
                        {submission.budget || "N/A"}
                      </td>
                      <td className="p-4 text-zinc-400 text-xs">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetails(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(submission._id)}
                          disabled={deleting === submission._id}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === submission._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      No submissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-zinc-500 mt-4">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </p>
      </div>

      {/* Details Modal */}
      {showDetails && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedSubmission.name}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Name</p>
                  <p className="text-white font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Email</p>
                  <a
                    href={`mailto:${selectedSubmission.email}`}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {selectedSubmission.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">
                    Project Type
                  </p>
                  <p className="text-white">{selectedSubmission.type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Timeline</p>
                  <p className="text-white">{selectedSubmission.timeline || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Budget</p>
                  <p className="text-white">{selectedSubmission.budget || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-1">Submitted</p>
                  <p className="text-white">
                    {new Date(selectedSubmission.createdAt).toLocaleDateString()} at{" "}
                    {new Date(selectedSubmission.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {selectedSubmission.description && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">
                    Requirements & Topics
                  </p>
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                    {selectedSubmission.description}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6 pt-6 border-t border-zinc-800">
                <a
                  href={`mailto:${selectedSubmission.email}`}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => handleDelete(selectedSubmission._id)}
                  disabled={deleting === selectedSubmission._id}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleting === selectedSubmission._id ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
