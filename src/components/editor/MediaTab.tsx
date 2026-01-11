"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Edit3, 
  ImageIcon, 
  Plus, 
  Layout, 
  Grid, 
  Maximize2,
  FileSearch
} from "lucide-react";
import ImageUploadModal, { ImageData } from "./ImageUploadModal";

interface MediaTabProps {
  featuredImage: ImageData | null;
  images: ImageData[];
  onFeaturedImageChange: (image: ImageData | null) => void;
  onImagesChange: (images: ImageData[]) => void;
}

export default function MediaTab({
  featuredImage,
  images,
  onFeaturedImageChange,
  onImagesChange,
}: MediaTabProps) {
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: FEATURED HERO ASSET */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Layout className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Featured Cover</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Primary Editorial Asset</p>
            </div>
          </div>
          
          {!featuredImage && (
            <button
              onClick={() => setShowFeaturedModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" /> Set Cover
            </button>
          )}
        </div>

        {featuredImage ? (
          <div className="group relative w-full h-80 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/40 shadow-2xl">
            <img
              src={featuredImage.url}
              alt={featuredImage.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
            />
            {/* Overlay Branding */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="space-y-1 max-w-xl">
                <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black uppercase rounded">Featured</span>
                <h3 className="text-xl font-bold text-white truncate">{featuredImage.title}</h3>
                <p className="text-sm text-zinc-400 line-clamp-1">{featuredImage.description || "No description provided for this asset."}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFeaturedModal(true)}
                  className="p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onFeaturedImageChange(null)}
                  className="p-3 bg-red-500/20 backdrop-blur-md border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setShowFeaturedModal(true)}
            className="h-64 w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="p-4 bg-zinc-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-emerald-500" />
            </div>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Click to upload cover image</p>
          </div>
        )}
      </section>

      {/* SECTION: ASSET GALLERY / FIGURES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Grid className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Research Gallery</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{images.length} Supporting Assets</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowGalleryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden aspect-square flex flex-col hover:border-emerald-500/50 transition-all"
            >
              {/* Image Container */}
              <div className="relative flex-1 bg-black/40 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-zinc-800 rounded-lg text-white hover:bg-emerald-500 transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
                    className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Bar */}
              <div className="p-3 bg-zinc-900/80 border-t border-zinc-800">
                <p className="text-[11px] font-bold text-white truncate">{img.title}</p>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">Asset #{idx + 1}</span>
                   <span className="text-[9px] text-emerald-500/60 font-mono italic">Validated</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Empty Grid Slot */}
          <div 
            onClick={() => setShowGalleryModal(true)}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-2xl hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="p-3 bg-zinc-900 rounded-full mb-2 group-hover:bg-zinc-800 transition-colors">
               <Plus className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500" />
            </div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400">Add Figure</span>
          </div>
        </div>

        {images.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border border-zinc-900 rounded-3xl bg-zinc-950/50">
            <FileSearch className="w-10 h-10 text-zinc-800 mb-4" />
            <h3 className="text-sm font-bold text-zinc-500">No supporting visuals found</h3>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mt-1">Gallery is currently empty for this research.</p>
          </div>
        )}
      </section>

      {/* Modals remain the same but styled within their component */}
      <ImageUploadModal
        isOpen={showFeaturedModal}
        onClose={() => setShowFeaturedModal(false)}
        onUpload={(image) => { onFeaturedImageChange(image); setShowFeaturedModal(false); }}
        title="Set Research Cover"
        existingImage={featuredImage}
      />

      <ImageUploadModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onUpload={(image) => { onImagesChange([...images, image]); setShowGalleryModal(false); }}
        title="Add Supporting Visual"
      />
    </div>
  );
}