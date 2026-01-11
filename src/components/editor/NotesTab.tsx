"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  StickyNote, 
  Clock, 
  AlertCircle,
  Hash,
  ChevronRight,
  MoreVertical
} from "lucide-react";

export interface Note {
  _id?: string;
  title: string;
  content: string;
  tags: string[];
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

interface NotesTabProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export default function NotesTab({ notes, onChange }: NotesTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Note>>({});

  const startAdd = () => {
    setFormData({
      title: "",
      content: "",
      tags: [],
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditingIndex(-1);
  };

  const startEdit = (index: number) => {
    setFormData({ ...notes[index] });
    setEditingIndex(index);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) return;

    const note: Note = {
      _id: formData._id || `note-${Date.now()}`,
      title: formData.title!,
      content: formData.content!,
      tags: formData.tags || [],
      priority: formData.priority || "medium",
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingIndex === -1) {
      onChange([note, ...notes]); // New notes at the top
    } else if (editingIndex !== null) {
      const updated = [...notes];
      updated[editingIndex] = note;
      onChange(updated);
    }
    setEditingIndex(null);
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high": return "text-rose-400 border-rose-500/30 bg-rose-500/10";
      case "medium": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "low": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      default: return "text-zinc-500 border-zinc-700 bg-zinc-800/10";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <StickyNote className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Internal Notes</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Research Log & Brainstorming</p>
          </div>
        </div>
        
        {editingIndex === null && (
          <button
            onClick={startAdd}
            className="group flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-700 hover:border-emerald-500 shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Memo
          </button>
        )}
      </div>

      {/* Note Editor Form */}
      {editingIndex !== null && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Memo Title</label>
                <input
                  type="text"
                  autoFocus
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Methodology Adjustment for Q3..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-semibold focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Priority Status</label>
                <select
                  value={formData.priority || "medium"}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">Critical / High</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Content</label>
              <textarea
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Start typing your internal research notes..."
                rows={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 font-mono text-sm leading-relaxed outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Hash className="w-3 h-3 text-emerald-500" /> Organizational Tags
              </label>
              <input
                type="text"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="research, logic-gap, help-wanted..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-400 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800/50">
              <button onClick={() => setEditingIndex(null)} className="px-6 py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Display Grid */}
      <div className="grid grid-cols-1 gap-4">
        {notes.map((note, idx) => (
          <div key={idx} className="group relative bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 rounded-2xl p-6 transition-all shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{note.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getPriorityStyles(note.priority)}`}>
                    {note.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
                    <Clock className="w-3 h-3" /> 
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1.5">
                    {note.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] text-zinc-500 font-mono">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(idx)} className="p-2 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onChange(notes.filter((_, i) => i !== idx))} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/40 border border-zinc-800/40 rounded-xl">
              <p className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed italic">
                {note.content}
              </p>
            </div>
          </div>
        ))}

        {notes.length === 0 && editingIndex === null && (
          <div className="py-20 flex flex-col items-center justify-center border border-zinc-900 rounded-3xl bg-zinc-950/20">
            <StickyNote className="w-10 h-10 text-zinc-800 mb-4" />
            <h3 className="text-sm font-bold text-zinc-500 italic">No memos found for this session.</h3>
            <button onClick={startAdd} className="mt-4 px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 transition-all">
              Create First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}