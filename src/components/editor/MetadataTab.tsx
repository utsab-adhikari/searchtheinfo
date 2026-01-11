"use client";

import React, { useState, useMemo } from "react";
import { 
  ImageIcon, 
  Edit3, 
  Trash2, 
  Info, 
  Hash, 
  Layout, 
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import ImageUploadModal, { ImageData } from "./ImageUploadModal";

interface MetadataTabProps {
  title: string;
  excerpt: string;
  tags: string; 
  category: {
    _id: string;
    title: string;
  };
  featuredImage: ImageData | null;
  onTitleChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFeaturedImageChange: (image: ImageData | null) => void;
}

export default function MetadataTab({
  title,
  excerpt,
  tags,
  category,
  featuredImage,
  onTitleChange,
  onExcerptChange,
  onTagsChange,
  onCategoryChange,
  onFeaturedImageChange,
}: MetadataTabProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  const tagList = useMemo(() => 
    tags.split(",").map(t => t.trim()).filter(t => t !== ""), 
  [tags]);

  const excerptLimit = 160;
  const isExcerptOver = excerpt.length > excerptLimit;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Article Identity</h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
            SEO & Indexing
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Research Title</label>
              {title.length > 5 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : null}
            </div>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., The Impact of Latency on Distributed Consensus"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Summary / Abstract</label>
              <span className={`text-[10px] font-mono ${isExcerptOver ? 'text-orange-500' : 'text-zinc-500'}`}>
                {excerpt.length} / {excerptLimit}
              </span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Provide a technical summary for search engines and article cards..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-emerald-500" />
            <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Categorization</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Domain</label>
            <div className="relative">
               <input
                value={category.title}
                readOnly
                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-400 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed italic"
              />
              <Info className="w-3.5 h-3.5 absolute right-3 top-3 text-zinc-600" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tags (Keywords)</label>
            <input
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="Systems, Networking, AI..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 transition-all outline-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tagList.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-md">
                  <Hash className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">Cover Media</h3>
            </div>
            <button
              onClick={() => setShowImageModal(true)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[10px] font-bold transition-all"
            >
              {featuredImage ? "Replace" : "Upload"}
            </button>
          </div>

          <div className="flex-1 min-h-[160px]">
            {featuredImage ? (
              <div className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-full">
                <img
                  src={featuredImage.url}
                  alt={featuredImage.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">{featuredImage.title}</p>
                    <p className="text-[9px] text-zinc-400 font-mono">1600 x 900 px</p>
                  </div>
                  <button
                    onClick={() => onFeaturedImageChange(null)}
                    className="p-1.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-md hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setShowImageModal(true)}
                className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group"
              >
                <div className="p-3 bg-zinc-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-zinc-500 group-hover:text-emerald-500" />
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Recommended: 16:9 ratio</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onUpload={(image) => {
          onFeaturedImageChange(image);
          setShowImageModal(false);
        }}
        title="Set Featured Image"
        existingImage={featuredImage}
      />
    </div>
  );
}