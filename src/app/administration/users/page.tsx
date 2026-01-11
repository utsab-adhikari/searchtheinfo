"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Loader2,
  Edit3,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  image?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?`;
      if (filterRole) url += `role=${filterRole}&`;
      if (search) url += `search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadUsers();
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        toast.success("Role updated");
        loadUsers();
      } else {
        toast.error("Failed to update role");
      }
    } catch (error) {
      toast.error("Error updating role");
    }
  };

  const toggleVerified = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isVerified: !currentStatus }),
      });

      if (res.ok) {
        toast.success("Verification status updated");
        loadUsers();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("User deleted");
        loadUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Error deleting user");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "member": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "subscriber": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-zinc-700/20 text-zinc-400 border-zinc-700/30";
    }
  };

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      <Toaster position="top-right" />

      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Users</span>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{users.length} Total Users</p>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5 block">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white focus:border-emerald-500 outline-none transition-all"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="user">User</option>
                <option value="subscriber">Subscriber</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                onClick={() => { setSearch(""); setFilterRole(""); loadUsers(); }}
                className="w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all border border-zinc-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs font-medium">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-400 mb-1">No users found</h3>
              <p className="text-xs text-zinc-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-800/30">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="px-3 py-2.5 text-left font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user._id} 
                      className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          <span className="truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className={`px-2 py-1 border rounded-md text-[11px] font-medium ${getRoleBadgeColor(user.role)} bg-transparent outline-none cursor-pointer hover:opacity-90`}
                        >
                          <option value="user">User</option>
                          <option value="subscriber">Subscriber</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleVerified(user._id, user.isVerified)}
                          className={`flex items-center gap-1.5 px-2 py-1 border rounded-md text-[11px] font-medium ${
                            user.isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30 hover:bg-zinc-700/30"
                          }`}
                        >
                          {user.isVerified ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {user.isVerified ? "Verified" : "Unverified"}
                        </button>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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