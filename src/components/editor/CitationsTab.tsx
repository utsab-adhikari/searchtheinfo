"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  BookMarked, 
  Link2, 
  User, 
  Globe, 
  ChevronRight,
  ExternalLink,
  StickyNote
} from "lucide-react";

export interface Citation {
  _id?: string;
  text: string;
  url: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  accessedDate: string;
  note?: string;
}

interface CitationsTabProps {
  citations: Citation[];
  onChange: (citations: Citation[]) => void;
}

export default function CitationsTab({ citations, onChange }: CitationsTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Citation>>({});

  const startAdd = () => {
    setFormData({
      text: "",
      url: "",
      authors: [],
      publisher: "",
      publishDate: "",
      accessedDate: new Date().toISOString().split("T")[0],
      note: "",
    });
    setEditingIndex(-1);
  };

  const startEdit = (index: number) => {
    setFormData({ ...citations[index] });
    setEditingIndex(index);
  };

  const handleSave = () => {
    if (!formData.text || !formData.url) return;

    const citation: Citation = {
      _id: formData._id || `cite-${Date.now()}`,
      text: formData.text!,
      url: formData.url!,
      authors: formData.authors || [],
      publisher: formData.publisher,
      publishDate: formData.publishDate,
      accessedDate: formData.accessedDate || new Date().toISOString().split("T")[0],
      note: formData.note,
    };

    if (editingIndex === -1) {
      onChange([...citations, citation]);
    } else if (editingIndex !== null) {
      const updated = [...citations];
      updated[editingIndex] = citation;
      onChange(updated);
    }
    setEditingIndex(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header & Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <BookMarked className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Bibliography</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              {citations.length} Verified Sources
            </p>
          </div>
        </div>
        
        {editingIndex === null && (
          <button
            onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" /> New Source
          </button>
        )}
      </div>

      {/* Editor Form Modal-style */}
      {editingIndex !== null && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/20 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {editingIndex === -1 ? "Register Source" : "Update Source"}
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono italic">Source ID: {formData._id || 'Pending'}</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Edit3 className="w-3 h-3 text-emerald-500" /> Source Title / Citation Text
                </label>
                <input
                  type="text"
                  value={formData.text || ""}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="e.g. Nielsen, J. (2026). UX Trends in Decentralized Apps."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Link2 className="w-3 h-3 text-emerald-500" /> Resource URL
                </label>
                <input
                  type="url"
                  value={formData.url || ""}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://doi.org/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3 text-emerald-500" /> Authors (CSV)
                </label>
                <input
                  type="text"
                  value={formData.authors?.join(", ") || ""}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value.split(",").map(a => a.trim()).filter(Boolean) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3 text-emerald-500" /> Publisher
                </label>
                <input
                  type="text"
                  value={formData.publisher || ""}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-emerald-500" /> Date Published
                </label>
                <input
                  type="date"
                  value={formData.publishDate || ""}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <StickyNote className="w-3 h-3 text-emerald-500" /> Internal Research Notes
              </label>
              <textarea
                value={formData.note || ""}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button onClick={() => setEditingIndex(null)} className="px-6 py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                Discard
              </button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all">
                Finalize Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citations List Visualization */}
      <div className="space-y-4">
        {citations.map((cite, idx) => (
          <div key={idx} className="group relative bg-zinc-900/30 border border-zinc-800/50 hover:border-emerald-500/30 rounded-2xl p-6 transition-all">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-700">[{idx + 1}]</span>
                  <h4 className="text-sm font-semibold text-zinc-100 leading-snug">{cite.text}</h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                   <a href={cite.url} target="_blank" className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors font-mono">
                    <Link2 className="w-3 h-3" /> Source Link <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  {cite.publisher && (
                    <span className="text-zinc-500 flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                      <Globe className="w-3 h-3" /> {cite.publisher}
                    </span>
                  )}
                  {cite.publishDate && (
                    <span className="text-zinc-500 flex items-center gap-1.5 border-l border-zinc-800 pl-4">
                      <Calendar className="w-3 h-3" /> {new Date(cite.publishDate).getFullYear()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {cite.authors.map((author, i) => (
                    <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md text-[9px] font-bold tracking-tighter uppercase border border-zinc-700/50">
                      {author}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(idx)} className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onChange(citations.filter((_, i) => i !== idx))} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {cite.note && (
              <div className="mt-4 p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-xl text-[11px] text-zinc-500 italic leading-relaxed">
                <span className="text-zinc-700 not-italic font-bold uppercase text-[9px] mr-2 tracking-widest">Memo:</span>
                {cite.note}
              </div>
            )}
          </div>
        ))}

        {citations.length === 0 && editingIndex === null && (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl">
             <BookMarked className="w-8 h-8 text-zinc-800 mb-3" />
             <p className="text-zinc-600 text-sm">Your research bibliography is empty.</p>
             <button onClick={startAdd} className="mt-2 text-emerald-500 text-xs font-bold hover:underline">Register your first source</button>
          </div>
        )}
      </div>
    </div>
  );
}