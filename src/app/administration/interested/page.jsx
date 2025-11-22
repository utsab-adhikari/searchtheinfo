"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

export default function AdminInterested() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    inProgress: 0
  });

  // Fetch all submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interested');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch submissions');
      }

      setSubmissions(data);
      calculateStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      new: data.filter(s => s.status === 'new').length,
      contacted: data.filter(s => s.status === 'contacted').length,
      inProgress: data.filter(s => s.status === 'in-progress').length
    };
    setStats(stats);
  };

  // Update submission status
  const updateSubmission = async (id, updates) => {
    try {
      const response = await fetch('/api/interested', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update submission');
      }

      // Refresh the list
      await fetchSubmissions();
      setEditModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete submission
  const deleteSubmission = async (id) => {
    try {
      const response = await fetch('/api/interested', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete submission');
      }

      // Refresh the list
      await fetchSubmissions();
      setDeleteModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'in-progress': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || colors.new;
  };

  // Get budget label
  const getBudgetLabel = (budget) => {
    const labels = {
      basic: 'Basic Setup ($500-$1,000)',
      standard: 'Standard Platform ($1,000-$2,500)',
      premium: 'Premium Custom ($2,500-$5,000)',
      enterprise: 'Enterprise Solution ($5,000+)',
      discuss: 'Let\'s discuss'
    };
    return labels[budget] || budget;
  };

  // Get timeline label
  const getTimelineLabel = (timeline) => {
    const labels = {
      asap: 'As soon as possible',
      '1month': 'Within 1 month',
      '3months': 'Within 3 months',
      '6months': 'Within 6 months',
      flexible: 'Flexible timeline'
    };
    return labels[timeline] || timeline;
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Header */}
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
            <div className="text-2xl font-bold text-white mb-2">{stats.total}</div>
            <div className="text-gray-400 text-sm">Total Submissions</div>
          </div>
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
            <div className="text-2xl font-bold text-blue-400 mb-2">{stats.new}</div>
            <div className="text-gray-400 text-sm">New</div>
          </div>
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
            <div className="text-2xl font-bold text-yellow-400 mb-2">{stats.contacted}</div>
            <div className="text-gray-400 text-sm">Contacted</div>
          </div>
          <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
            <div className="text-2xl font-bold text-purple-400 mb-2">{stats.inProgress}</div>
            <div className="text-gray-400 text-sm">In Progress</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => setError("")}
              className="text-red-300 hover:text-red-100 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-[#1a1c23] border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Interest Submissions</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage and track all platform interest submissions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Name</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Email</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Project Type</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Timeline</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Budget</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Submitted</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{submission.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <a 
                        href={`mailto:${submission.email}`}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        {submission.email}
                      </a>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-300 capitalize">{submission.projectType}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-300">{getTimelineLabel(submission.timeline)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-300">{getBudgetLabel(submission.budget)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                        {submission.status === 'in-progress' ? 'In Progress' : submission.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-400 text-sm">
                        {formatDate(submission.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setEditModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded text-sm hover:border-blue-400 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setDeleteModal(true);
                          }}
                          className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-sm hover:border-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No submissions found</div>
              <p className="text-gray-500 text-sm">
                There are no interest submissions in the database yet.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#1a1c23] border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Submission</h3>
              <button
                onClick={() => {
                  setEditModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={selectedSubmission.name}
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={selectedSubmission.email}
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Research Topics</label>
                <input
                  type="text"
                  value={selectedSubmission.researchTopics}
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Type</label>
                  <input
                    type="text"
                    value={selectedSubmission.projectType}
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white capitalize"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) => setSelectedSubmission({
                      ...selectedSubmission,
                      status: e.target.value
                    })}
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none transition-colors"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Requirements</label>
                <textarea
                  value={selectedSubmission.requirements || ''}
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white resize-none"
                  rows={4}
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setEditModal(false);
                  setSelectedSubmission(null);
                }}
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateSubmission(selectedSubmission._id, {
                  status: selectedSubmission.status
                })}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#1a1c23] border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-400 mb-6">
              Are you sure you want to delete the submission from <strong className="text-white">{selectedSubmission.name}</strong>? 
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setSelectedSubmission(null);
                }}
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSubmission(selectedSubmission._id)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Delete Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}