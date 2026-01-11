"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Search,
  Loader2,
  Trash2,
  ExternalLink,
  Upload,
  Calendar,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import ImageUploadModal from "@/components/editor/ImageUploadModal";

interface MediaImage {
  _id: string;
  url: string;
  title?: string;
  description?: string;
  caption?: string;
  attribution?: string;
  createdAt: string;
  uploadedAt: string;
}

export default function MediaPage() {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      let url = `/api/media?`;
      if (search) url += `search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setImages(data.data || []);
    } catch (error) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadImages();
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/media?id=${imageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Image deleted");
        loadImages();
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      toast.error("Error deleting image");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-[1920px] mx-auto space-y-6 pb-8 relative">
      <Toaster position="top-right" />

      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-emerald-400">Media</span>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Media Library</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{images.length} Assets</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-900/20"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Media
          </button>
        </header>

        {/* Search */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl p-4 shadow-lg shadow-black/30">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by title or description..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all"
            >
              Search
            </button>
            <button
              onClick={() => { setSearch(""); loadImages(); }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-all border border-zinc-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/30 rounded-xl overflow-hidden shadow-lg shadow-black/30">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs font-medium">Loading media...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-400 mb-1">No media found</h3>
              <p className="text-xs text-zinc-600 mb-4">Start by uploading your first image</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Media
              </button>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image._id}
                  className="group bg-zinc-900/40 border border-zinc-800/40 rounded-lg overflow-hidden hover:border-zinc-700/60 hover:shadow-md transition-all duration-200"
                >
                  <div className="aspect-video relative bg-black overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title || "Media"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-black/70 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded transition-all"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteImage(image._id)}
                        className="p-1.5 bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white rounded transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900/30">
                    <h3 className="text-xs font-bold text-white truncate mb-1">
                      {image.title || "Untitled"}
                    </h3>
                    {image.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">
                        {image.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(image.uploadedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <ImageUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={(image) => {
            setShowUploadModal(false);
            loadImages();
            toast.success("Image uploaded");
          }}
          title="Upload Media"
        />
      </div>
    </div>
  );
}