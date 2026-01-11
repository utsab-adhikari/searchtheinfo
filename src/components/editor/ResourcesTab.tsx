"use client";

import React from "react";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Book, 
  Youtube, 
  Clock, 
  CalendarCheck, 
  Search,
  ExternalLink,
  Info
} from "lucide-react";

export interface ResourcesSite {
  name: string;
  url: string;
  note: string;
}

export interface ResourcesBook {
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  note: string;
}

export interface ResourcesVideo {
  title: string;
  url: string;
  channel: string;
  uploadedDate: string;
  note: string;
}

export interface Resources {
  daysToComplete: number;
  lastReviewed: string;
  sites: ResourcesSite[];
  books: ResourcesBook[];
  youtubeVideos: ResourcesVideo[];
}

interface ResourcesTabProps {
  resources: Resources;
  onChange: (resources: Resources) => void;
}

export default function ResourcesTab({ resources, onChange }: ResourcesTabProps) {
  const updateField = (field: keyof Resources, value: any) => {
    onChange({ ...resources, [field]: value });
  };

  const addResource = (type: 'sites' | 'books' | 'youtubeVideos', defaultObj: any) => {
    updateField(type, [...resources[type], defaultObj]);
  };

  const totalResources = resources.sites.length + resources.books.length + resources.youtubeVideos.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Search className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Research Resources</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              {totalResources} External Sources Cataloged
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: RESEARCH METRICS */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Research Metrics</h3>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Research Duration (Days)</label>
            <input
              type="number"
              value={resources.daysToComplete}
              onChange={(e) => updateField("daysToComplete", parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Last Reviewed</label>
            <input
              type="date"
              value={resources.lastReviewed}
              onChange={(e) => updateField("lastReviewed", e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION: WEBSITES */}
      <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Web Archives</h3>
            <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
              {resources.sites.length}
            </span>
          </div>
          <button 
            onClick={() => addResource('sites', { name: "", url: "", note: "" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Site
          </button>
        </div>

        <div className="p-6 space-y-4">
          {resources.sites.map((site, idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Site Name</label>
                  <input
                    placeholder="Source Name"
                    value={site.name}
                    onChange={(e) => {
                      const updated = [...resources.sites];
                      updated[idx].name = e.target.value;
                      updateField("sites", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">URL</label>
                  <input
                    placeholder="https://..."
                    value={site.url}
                    onChange={(e) => {
                      const updated = [...resources.sites];
                      updated[idx].url = e.target.value;
                      updateField("sites", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Note</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Contribution note..."
                    value={site.note}
                    onChange={(e) => {
                      const updated = [...resources.sites];
                      updated[idx].note = e.target.value;
                      updateField("sites", updated);
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 outline-none focus:border-emerald-500/50"
                  />
                  <button 
                    onClick={() => updateField("sites", resources.sites.filter((_, i) => i !== idx))} 
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {resources.sites.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
              <Globe className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-xs">No websites added yet</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: LITERATURE / BOOKS */}
      <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Library & Publications</h3>
            <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
              {resources.books.length}
            </span>
          </div>
          <button 
            onClick={() => addResource('books', { title: "", author: "", publisher: "", publishedDate: "", note: "" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Book
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {resources.books.map((book, idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex justify-between items-start gap-3">
                <input
                  placeholder="Publication Title"
                  value={book.title}
                  onChange={(e) => {
                    const updated = [...resources.books];
                    updated[idx].title = e.target.value;
                    updateField("books", updated);
                  }}
                  className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-zinc-700"
                />
                <button 
                  onClick={() => updateField("books", resources.books.filter((_, i) => i !== idx))} 
                  className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Author</label>
                  <input
                    placeholder="Author name"
                    value={book.author}
                    onChange={(e) => {
                      const updated = [...resources.books];
                      updated[idx].author = e.target.value;
                      updateField("books", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 outline-none focus:border-blue-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Publisher</label>
                    <input
                      placeholder="Publisher"
                      value={book.publisher}
                      onChange={(e) => {
                        const updated = [...resources.books];
                        updated[idx].publisher = e.target.value;
                        updateField("books", updated);
                      }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Published</label>
                    <input
                      type="date"
                      value={book.publishedDate}
                      onChange={(e) => {
                        const updated = [...resources.books];
                        updated[idx].publishedDate = e.target.value;
                        updateField("books", updated);
                      }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Notes</label>
                  <textarea
                    placeholder="Key insights or chapter references..."
                    value={book.note}
                    onChange={(e) => {
                      const updated = [...resources.books];
                      updated[idx].note = e.target.value;
                      updateField("books", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 outline-none resize-none focus:border-blue-500/50"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {resources.books.length === 0 && (
            <div className="lg:col-span-2 py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
              <Book className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-xs">No books or publications added yet</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: MEDIA / YOUTUBE */}
      <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Video Intelligence</h3>
            <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
              {resources.youtubeVideos.length}
            </span>
          </div>
          <button 
            onClick={() => addResource('youtubeVideos', { title: "", url: "", channel: "", uploadedDate: "", note: "" })}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Video
          </button>
        </div>

        <div className="p-6 space-y-4">
          {resources.youtubeVideos.map((video, idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-red-500/30 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Video Title</label>
                  <input
                    placeholder="Video Title"
                    value={video.title}
                    onChange={(e) => {
                      const updated = [...resources.youtubeVideos];
                      updated[idx].title = e.target.value;
                      updateField("youtubeVideos", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">YouTube URL</label>
                  <input
                    placeholder="https://youtube.com/..."
                    value={video.url}
                    onChange={(e) => {
                      const updated = [...resources.youtubeVideos];
                      updated[idx].url = e.target.value;
                      updateField("youtubeVideos", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-red-400 font-mono outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Channel</label>
                  <input
                    placeholder="Channel Name"
                    value={video.channel}
                    onChange={(e) => {
                      const updated = [...resources.youtubeVideos];
                      updated[idx].channel = e.target.value;
                      updateField("youtubeVideos", updated);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 outline-none focus:border-red-500/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Research Context</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Research context or key takeaways..."
                    value={video.note}
                    onChange={(e) => {
                      const updated = [...resources.youtubeVideos];
                      updated[idx].note = e.target.value;
                      updateField("youtubeVideos", updated);
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 outline-none focus:border-red-500/50"
                  />
                  <button 
                    onClick={() => updateField("youtubeVideos", resources.youtubeVideos.filter((_, i) => i !== idx))} 
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {resources.youtubeVideos.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
              <Youtube className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-xs">No videos added yet</p>
            </div>
          )}
        </div>
      </section>

      {/* EMPTY STATE - All Resources */}
      {totalResources === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-zinc-900 rounded-2xl">
          <Info className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
          <h4 className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No External Resources Cataloged</h4>
          <p className="text-zinc-700 text-[10px] mt-2">Add websites, books, or videos to establish research depth.</p>
        </div>
      )}
    </div>
  );
}