"use client";

import React, { useRef, useEffect } from "react";
import {
  GripVertical,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Type,
  Heading as HeadingIcon,
  ImageIcon,
  List,
  Quote,
  Code,
  Layers,
} from "lucide-react";

export interface Block {
  _id?: string;
  type:
    | "text"
    | "heading"
    | "image"
    | "code"
    | "citation"
    | "list"
    | "blockquote";
  content?: string;
  level?: number;
  image?: any;
  caption?: string;
  language?: string;
  citation?: any;
  items?: string[];
}

interface ContentEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onAddImageClick: (insertIndex: number) => void;
}

export default function ContentEditor({
  blocks,
  onBlocksChange,
  onAddImageClick,
}: ContentEditorProps) {
  // Logic to auto-resize textareas as user types
  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const addBlock = (type: Block["type"], at?: number) => {
    const newBlock: Block = {
      _id: `temp-${Date.now()}`,
      type,
      content: "",
      level: type === "heading" ? 2 : undefined,
      items: type === "list" ? [""] : undefined,
    };

    if (at !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(at, 0, newBlock);
      onBlocksChange(newBlocks);
    } else {
      onBlocksChange([...blocks, newBlock]);
    }
  };

  const updateBlock = (index: number, updates: Partial<Block>) => {
    const newBlocks = blocks.map((block, idx) =>
      idx === index ? { ...block, ...updates } : block
    );
    onBlocksChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    onBlocksChange(blocks.filter((_, idx) => idx !== index));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    onBlocksChange(newBlocks);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Layers className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Composer
            </h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              {blocks.length} Content Blocks
            </p>
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-xl">
          {[
            { type: "heading", icon: HeadingIcon, label: "H" },
            { type: "text", icon: Type, label: "T" },
            { type: "list", icon: List, label: "L" },
            { type: "blockquote", icon: Quote, label: "Q" },
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => addBlock(btn.type as Block["type"])}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
              title={`Add ${btn.type}`}
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            onClick={() => onAddImageClick(blocks.length)}
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <div
            key={block._id || idx}
            className="group relative flex items-start gap-4 transition-all"
          >
            {/* Left Gutter: Movement & Controls */}
            <div className="flex flex-col items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => idx > 0 && moveBlock(idx, idx - 1)}
                className="p-1 text-zinc-600 hover:text-emerald-500 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="cursor-grab active:cursor-grabbing p-1">
                <GripVertical className="w-4 h-4 text-zinc-800 group-hover:text-zinc-600" />
              </div>
              <button
                onClick={() =>
                  idx < blocks.length - 1 && moveBlock(idx, idx + 1)
                }
                className="p-1 text-zinc-600 hover:text-emerald-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Block Container */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800/50 rounded-2xl overflow-hidden group-hover:border-zinc-700/50 transition-all shadow-sm group-hover:shadow-lg">
              {/* Block Action Bar (Internal) */}
              <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-800/10">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
                    Block {idx + 1}
                  </span>
                  <div className="h-3 w-px bg-zinc-800" />
                  <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">
                    {block.type}
                  </span>

                  {block.type === "heading" && (
                    <div className="flex gap-1 ml-2">
                      {[1, 2, 3].map((lv) => (
                        <button
                          key={lv}
                          onClick={() => updateBlock(idx, { level: lv })}
                          className={`w-6 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                            block.level === lv
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          H{lv}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeBlock(idx)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content Areas */}
              <div className="p-5">
                {block.type === "text" && (
                  <textarea
                    value={block.content || ""}
                    onChange={(e) => {
                      updateBlock(idx, { content: e.target.value });
                      autoResize(e);
                    }}
                    onFocus={autoResize}
                    placeholder="Continue your insight..."
                    className="w-full bg-transparent text-zinc-300 placeholder-zinc-700 text-sm leading-relaxed outline-none resize-none"
                    rows={2}
                  />
                )}

                {block.type === "heading" && (
                  <input
                    value={block.content || ""}
                    onChange={(e) =>
                      updateBlock(idx, { content: e.target.value })
                    }
                    placeholder="Section Title"
                    className={`w-full bg-transparent text-white placeholder-zinc-700 outline-none font-bold tracking-tight ${
                      block.level === 1
                        ? "text-3xl"
                        : block.level === 2
                        ? "text-2xl"
                        : "text-xl"
                    }`}
                  />
                )}

                {block.type === "list" && (
                  <div className="space-y-3">
                    {(block.items || [""]).map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center gap-3 group/item"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        <input
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(block.items || [""])];
                            newItems[itemIdx] = e.target.value;
                            updateBlock(idx, { items: newItems });
                          }}
                          className="flex-1 bg-transparent text-zinc-300 text-sm outline-none"
                          placeholder="List item..."
                        />
                        <button
                          onClick={() => {
                            const newItems = block.items?.filter(
                              (_, i) => i !== itemIdx
                            );
                            updateBlock(idx, { items: newItems });
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-400 transition-all"
                        >
                          <Plus className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        updateBlock(idx, {
                          items: [...(block.items || []), ""],
                        })
                      }
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 flex items-center gap-1 font-bold mt-2"
                    >
                      <Plus className="w-3 h-3" /> ADD ITEM
                    </button>
                  </div>
                )}

                {block.type === "blockquote" && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
                    <Quote className="w-8 h-8 text-zinc-800 absolute -right-2 -top-2 rotate-180" />
                    <textarea
                      value={block.content || ""}
                      onChange={(e) => {
                        updateBlock(idx, { content: e.target.value });
                        autoResize(e);
                      }}
                      className="w-full bg-transparent text-emerald-100/80 italic text-lg leading-relaxed outline-none resize-none"
                      placeholder="Enter powerful quote..."
                    />
                  </div>
                )}

                {block.type === "image" && (
                  <div className="space-y-4">
                    {block.image?.url ? (
                      <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black/20">
                        <img
                          src={block.image.url}
                          className="w-full max-h-[500px] object-contain"
                          alt=""
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => onAddImageClick(idx)}
                        className="py-12 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/5 hover:border-emerald-500/40 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                          Select Visual Resource
                        </span>
                      </div>
                    )}
                    <input
                      value={block.caption || ""}
                      onChange={(e) =>
                        updateBlock(idx, { caption: e.target.value })
                      }
                      placeholder="Provide context for this image..."
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-zinc-400 italic outline-none focus:border-emerald-500/30"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl">
            <div className="p-4 bg-zinc-900 rounded-full mb-4">
              <Plus className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-medium">Your canvas is empty.</p>
            <button
              onClick={() => addBlock("text")}
              className="mt-4 text-emerald-500 text-sm font-bold hover:underline"
            >
              Start writing your first block
            </button>
          </div>
        )}
      </div>

      {/* Floating Quick Action (Bottom) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-2xl shadow-2xl backdrop-blur-xl">
          {[
            { type: "heading", icon: HeadingIcon, label: "H" },
            { type: "text", icon: Type, label: "T" },
            { type: "list", icon: List, label: "L" },
            { type: "blockquote", icon: Quote, label: "Q" },
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => addBlock(btn.type as Block["type"])}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
              title={`Add ${btn.type}`}
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            onClick={() => onAddImageClick(blocks.length)}
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
