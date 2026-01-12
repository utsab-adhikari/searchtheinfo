"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Save,
  Trash,
  Plus,
  Loader2,
  ChevronUp,
  ChevronDown,
  Images,
  ImagePlus,
  Replace,
  Check,
  Copy,
} from "lucide-react";
import {
  uploadToCloudinary,
  getOptimizedImageUrl,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

// Types mirrored from your schema (kept compatible)
type ContentBlock = {
  _id?: string;
  type: "text" | "image" | "list" | "quote" | "code" | "equation";
  text?: string;
  image?: {
    url: string;
    caption?: string;
    credit?: string;
    // Optional Cloudinary metadata (recommended)
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
  } | null;
  listItems?: string[];
  quoteAuthor?: string;
  codeLanguage?: string;
  citations?: string[]; // reference ids
};

type Section = {
  _id?: string;
  title: string;
  type:
    | "introduction"
    | "literature"
    | "methodology"
    | "results"
    | "discussion"
    | "conclusion"
    | "custom";
  order: number;
  blocks: ContentBlock[];
};

type Reference = {
  _id?: string;
  title: string;
  authors?: string;
  publisher?: string;
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
};

type Resource = {
  _id?: string;
  type: "book" | "website" | "youtube" | "paper" | "course" | "other";
  title: string;
  author?: string;
  url?: string;
  description?: string;
};

type Revision = {
  _id?: string;
  editedBy: { _id?: string; name?: string } | string;
  editedAt: string;
  summary?: string;
};

type ArticlePayload = {
  title: string;
  slug: string;
  abstract: string;
  keywords: string[];
  authors?: any[];
  sections: Section[];
  references: Reference[];
  resources: Resource[];
  scratchPad: string;
  notes: string;
  status: "draft" | "in-review" | "published" | "archived";
  revisions?: Revision[];
};

export default function EditorSlugPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editor local state
  const [sections, setSections] = useState<Section[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [scratchPad, setScratchPad] = useState("");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [keywordsString, setKeywordsString] = useState("");
  const [status, setStatus] = useState<ArticlePayload["status"]>("draft");
  const [revisions, setRevisions] = useState<Revision[]>([]);

  // UI helpers
  const [activeRightTab, setActiveRightTab] = useState<"scratch" | "notes" | "resources" | "references" | "revisions">("scratch");
  const autosaveTimer = useRef<number | null>(null);

  // Load article by slug
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/articles/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");

        const art = data.article as ArticlePayload;
        setArticle(art);
        setTitle(art.title || "");
        setAbstractText(art.abstract || "");
        setKeywordsString((art.keywords || []).join(", "));
        setSections(art.sections || []);
        setReferences(art.references || []);
        setResources(art.resources || []);
        setScratchPad(art.scratchPad || "");
        setNotes(art.notes || "");
        setStatus(art.status || "draft");
        setRevisions(art.revisions || []);
        setDirty(false);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Keyboard shortcut: Ctrl/Cmd+S to Save
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [title, abstractText, keywordsString, sections, references, resources, scratchPad, notes, status]);

  // Autosave debounce
  function scheduleAutosave() {
    setDirty(true);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      handleSave({ silent: true });
    }, 1200);
  }

  // Save full article
  async function handleSave(opts?: { silent?: boolean }) {
    if (!slug || !article) return;
    try {
      if (!opts?.silent) setSaving(true);

      const payload: Partial<ArticlePayload> = {
        title,
        abstract: abstractText,
        keywords: keywordsString
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        sections,
        references,
        resources,
        scratchPad,
        notes,
        status,
      };

      const res = await fetch(`/api/v1/articles/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      setArticle(data.article || article);
      if (data.article?.revisions) setRevisions(data.article.revisions || []);
      setLastSavedAt(new Date());
      setDirty(false);
    } catch (err: any) {
      console.error("Save error", err);
      if (!opts?.silent) setError(err.message || String(err));
    } finally {
      if (!opts?.silent) setSaving(false);
    }
  }

  // Publish/Draft
  async function handlePublish() {
    if (!slug) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/articles/${encodeURIComponent(slug)}/publish`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish");
      setStatus("published");
      setRevisions((r) => [
        ...(r || []),
        { editedAt: new Date().toISOString(), summary: "Published" } as Revision,
      ]);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setPublishing(false);
    }
  }
  async function handleDraft() {
    if (!slug) return;
    try {
      const res = await fetch(`/api/v1/articles/${encodeURIComponent(slug)}/draft`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to move to draft");
      setStatus("draft");
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  // Section ops
  function addSection(type: Section["type"] = "custom") {
    const s: Section = {
      _id: `s_${Date.now()}`,
      title: type === "introduction" ? "Introduction" : type === "methodology" ? "Methodology" : "New Section",
      type,
      order: sections.length,
      blocks: [],
    };
    setSections((prev) => [...prev, s]);
    scheduleAutosave();
  }
  function updateSection(idx: number, patch: Partial<Section>) {
    setSections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
    scheduleAutosave();
  }
  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    scheduleAutosave();
  }
  function moveSection(idx: number, dir: "up" | "down") {
    setSections((prev) => {
      const next = [...prev];
      const to = dir === "up" ? idx - 1 : idx + 1;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
    scheduleAutosave();
  }

  // Blocks
  function addBlock(sectionIdx: number, type: ContentBlock["type"] = "text") {
    const blk: ContentBlock = {
      _id: `b_${Date.now()}`,
      type,
      text: type === "list" ? "" : "",
      image: type === "image" ? { url: "" } : undefined,
      listItems: type === "list" ? [] : undefined,
    };
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx] = { ...next[sectionIdx], blocks: [...next[sectionIdx].blocks, blk] };
      return next;
    });
    scheduleAutosave();
  }
  function updateBlock(sectionIdx: number, blockIdx: number, patch: Partial<ContentBlock>) {
    setSections((prev) => {
      const next = [...prev];
      const sec = { ...next[sectionIdx] };
      const blks = [...sec.blocks];
      blks[blockIdx] = { ...blks[blockIdx], ...(patch as any) };
      sec.blocks = blks;
      next[sectionIdx] = sec;
      return next;
    });
    scheduleAutosave();
  }
  function duplicateBlock(sectionIdx: number, blockIdx: number) {
    setSections((prev) => {
      const next = [...prev];
      const sec = { ...next[sectionIdx] };
      const blks = [...sec.blocks];
      const copy = JSON.parse(JSON.stringify(blks[blockIdx])) as ContentBlock;
      copy._id = `b_${Date.now()}`;
      blks.splice(blockIdx + 1, 0, copy);
      sec.blocks = blks;
      next[sectionIdx] = sec;
      return next;
    });
    scheduleAutosave();
  }
  function moveBlock(sectionIdx: number, blockIdx: number, dir: "up" | "down") {
    setSections((prev) => {
      const next = [...prev];
      const sec = { ...next[sectionIdx] };
      const blks = [...sec.blocks];
      const to = dir === "up" ? blockIdx - 1 : blockIdx + 1;
      if (to < 0 || to >= blks.length) return prev;
      [blks[blockIdx], blks[to]] = [blks[to], blks[blockIdx]];
      sec.blocks = blks;
      next[sectionIdx] = sec;
      return next;
    });
    scheduleAutosave();
  }
  function removeBlock(sectionIdx: number, blockIdx: number) {
    setSections((prev) => {
      const next = [...prev];
      const sec = { ...next[sectionIdx] };
      sec.blocks = sec.blocks.filter((_, i) => i !== blockIdx);
      next[sectionIdx] = sec;
      return next;
    });
    scheduleAutosave();
  }

  // ScratchPad / Notes quick save
  async function saveScratchPadNow() {
    if (!slug) return;
    try {
      await fetch(`/api/v1/articles/${encodeURIComponent(slug)}/scratchpad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scratchPad }),
      });
    } catch (err) {
      console.error(err);
    }
  }
  async function saveNotesNow() {
    if (!slug) return;
    try {
      await fetch(`/api/v1/articles/${encodeURIComponent(slug)}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // UI Components
  const ToolbarButton = ({
    children,
    onClick,
    title,
    className = "",
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
    className?: string;
    disabled?: boolean;
  }) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-200 hover:bg-zinc-900/80 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );

  function BlockTypeSwitcher({
    current,
    onChange,
  }: {
    current: ContentBlock["type"];
    onChange: (t: ContentBlock["type"]) => void;
  }) {
    const types: ContentBlock["type"][] = ["text", "code", "image", "list", "quote", "equation"];
    return (
      <div className="flex flex-wrap gap-1">
        {types.map((t) => (
          <ToolbarButton
            key={t}
            title={`Switch to ${t}`}
            onClick={() => onChange(t)}
            className={current === t ? "border-emerald-600/60 bg-emerald-600/10 text-emerald-300" : ""}
          >
            {t}
          </ToolbarButton>
        ))}
      </div>
    );
  }

  function ImageUploader({
    block,
    onChange,
  }: {
    block: ContentBlock;
    onChange: (patch: Partial<ContentBlock>) => void;
  }) {
    const [uploading, setUploading] = useState(false);
    const [progressHint, setProgressHint] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    async function handleFile(file: File) {
      setUploading(true);
      setProgressHint("Preparing...");
      try {
        const res = await uploadToCloudinary({ file, folder: "articles" });
        if (!res.success || !res.url) {
          throw new Error(res.error || "Upload failed");
        }
        onChange({
          image: {
            ...(block.image || { url: "" }),
            url: res.url,
            publicId: res.publicId,
            width: res.width,
            height: res.height,
            format: res.format,
          },
        });
        setProgressHint(null);
      } catch (e: any) {
        setProgressHint(e.message || "Upload error");
      } finally {
        setUploading(false);
      }
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    }

    async function removeImage() {
      if (block.image?.publicId) {
        await deleteFromCloudinary(block.image.publicId);
      }
      onChange({ image: { url: "", caption: block.image?.caption, credit: block.image?.credit } });
    }

    const previewUrl = useMemo(() => {
      if (block.image?.publicId) {
        return getOptimizedImageUrl(block.image.publicId, { width: 920, quality: 85, format: "auto" });
      }
      return block.image?.url || "";
    }, [block.image?.publicId, block.image?.url]);

    return (
      <div className="border border-zinc-800 rounded-md p-3 bg-zinc-950/20">
        {!block.image?.url ? (
          <div
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-800 rounded-md p-6 bg-zinc-900/40 hover:bg-zinc-900/60 cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Images className="w-6 h-6 text-zinc-500" />
            <div className="text-sm text-zinc-400">Click or drag an image to upload</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progressHint || "Uploading..."}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={block.image.caption || "Image"}
                className="w-full rounded-md border border-zinc-800"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={block.image.caption || ""}
                onChange={(e) => onChange({ image: { ...(block.image || { url: "" }), caption: e.target.value } })}
                placeholder="Caption"
                className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
              />
              <input
                value={block.image.credit || ""}
                onChange={(e) => onChange({ image: { ...(block.image || { url: "" }), credit: e.target.value } })}
                placeholder="Credit / Source"
                className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <ToolbarButton onClick={() => inputRef.current?.click()}>
                <ImagePlus className="w-4 h-4" /> Replace
              </ToolbarButton>
              <ToolbarButton onClick={removeImage}>
                <Trash className="w-4 h-4" /> Remove
              </ToolbarButton>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                {progressHint || "Uploading..."}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Renderers
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-400 px-4">
        <div className="max-w-xl text-center">
          <h2 className="text-2xl font-semibold">Failed to load editor</h2>
          <p className="mt-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Toolbar */}
      <div className="border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-400">Editor</div>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleAutosave();
              }}
              placeholder="Article title"
              className="text-base md:text-lg font-semibold bg-transparent border-none focus:outline-none text-white w-[46vw]"
            />
            <div className={`text-xs ${dirty ? "text-amber-400" : "text-zinc-500"}`}>
              {dirty ? "Unsaved changes" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : "—"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Status:</span>
            <span className={`px-2 py-1 rounded text-xs border ${
              status === "published" ? "border-emerald-600/60 bg-emerald-600/10 text-emerald-300"
              : status === "in-review" ? "border-sky-600/60 bg-sky-600/10 text-sky-300"
              : status === "archived" ? "border-zinc-700 bg-zinc-900 text-zinc-300"
              : "border-amber-600/60 bg-amber-600/10 text-amber-300"
            }`}>
              {status}
            </span>
            <ToolbarButton onClick={() => handleSave()} title="Save (Ctrl/Cmd+S)">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </ToolbarButton>
            {status !== "published" ? (
              <button
                onClick={() => handlePublish()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-2 rounded-md font-medium"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Publish
              </button>
            ) : (
              <button
                onClick={() => handleDraft()}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-md font-medium"
              >
                Move to Draft
              </button>
            )}
            <button
              onClick={() => router.push(`/articles/${encodeURIComponent(slug)}`)}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-md font-medium"
            >
              View
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main column */}
          <div className="flex-1">
            {/* Abstract + Keywords */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="text-xs text-zinc-400">Abstract</label>
                <textarea
                  value={abstractText}
                  onChange={(e) => {
                    setAbstractText(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="Brief and compelling summary to contextualize the work..."
                  className="w-full min-h-[90px] mt-2 bg-zinc-900/40 border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Keywords</label>
                <input
                  value={keywordsString}
                  onChange={(e) => {
                    setKeywordsString(e.target.value);
                    scheduleAutosave();
                  }}
                  placeholder="comma,separated,keywords"
                  className="w-full mt-2 bg-zinc-900/40 border border-zinc-800 rounded-md p-2.5 text-sm text-zinc-200"
                />
                <div className="text-[11px] mt-2 text-zinc-500">
                  Tip: Use 5–10 specific keywords for discoverability.
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sections</h3>
                <div className="flex items-center gap-2">
                  <ToolbarButton onClick={() => addSection("introduction")} title="Add introduction">
                    <Plus className="w-3 h-3" /> Intro
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("methodology")} title="Add methodology">
                    <Plus className="w-3 h-3" /> Method
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("results")} title="Add results">
                    <Plus className="w-3 h-3" /> Results
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("custom")} title="Add custom section">
                    <Plus className="w-3 h-3" /> Section
                  </ToolbarButton>
                </div>
              </div>

              {sections.length === 0 && (
                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-md text-zinc-400">
                  No sections yet. Start by adding one.
                </div>
              )}

              {sections.map((sec, sidx) => (
                <div key={sec._id || sidx} className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <input
                        value={sec.title}
                        onChange={(e) => updateSection(sidx, { title: e.target.value })}
                        className="w-full bg-transparent border-none focus:outline-none text-white font-semibold text-lg"
                      />
                      <div className="text-xs text-zinc-500 mt-1">Type: {sec.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToolbarButton onClick={() => moveSection(sidx, "up")} title="Move up">
                        <ChevronUp className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton onClick={() => moveSection(sidx, "down")} title="Move down">
                        <ChevronDown className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton onClick={() => removeSection(sidx)} title="Remove section">
                        <Trash className="w-3 h-3" /> Remove
                      </ToolbarButton>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sec.blocks.length === 0 && (
                      <div className="text-zinc-500 text-sm">
                        No blocks yet. Add text, image, code, list, quote, or equation blocks.
                      </div>
                    )}

                    {sec.blocks.map((blk, bidx) => (
                      <div key={blk._id || bidx} className="bg-zinc-950/20 border border-zinc-800 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-zinc-400">Block: {blk.type.toUpperCase()}</div>
                          <div className="flex items-center gap-2">
                            <ToolbarButton onClick={() => moveBlock(sidx, bidx, "up")} title="Move block up">
                              <ChevronUp className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton onClick={() => moveBlock(sidx, bidx, "down")} title="Move block down">
                              <ChevronDown className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton onClick={() => duplicateBlock(sidx, bidx)} title="Duplicate block">
                              <Copy className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton onClick={() => removeBlock(sidx, bidx)} title="Delete block">
                              <Trash className="w-3 h-3" />
                            </ToolbarButton>
                          </div>
                        </div>

                        {/* Block Editors */}
                        {blk.type === "text" && (
                          <textarea
                            value={blk.text || ""}
                            onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                            placeholder="Write paragraph..."
                            className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                          />
                        )}

                        {blk.type === "code" && (
                          <div>
                            <select
                              value={blk.codeLanguage || ""}
                              onChange={(e) => updateBlock(sidx, bidx, { codeLanguage: e.target.value })}
                              className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mb-2"
                            >
                              <option value="">Language</option>
                              <option value="js">JavaScript</option>
                              <option value="ts">TypeScript</option>
                              <option value="python">Python</option>
                              <option value="c">C</option>
                              <option value="cpp">C++</option>
                              <option value="java">Java</option>
                              <option value="go">Go</option>
                              <option value="rust">Rust</option>
                            </select>
                            <textarea
                              value={blk.text || ""}
                              onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                              placeholder="Paste code..."
                              className="w-full min-h-[140px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 font-mono resize-y"
                            />
                          </div>
                        )}

                        {blk.type === "image" && (
                          <ImageUploader
                            block={blk}
                            onChange={(patch) => updateBlock(sidx, bidx, patch)}
                          />
                        )}

                        {blk.type === "list" && (
                          <div>
                            <label className="text-xs text-zinc-400">List items (one per line)</label>
                            <textarea
                              value={(blk.listItems || []).join("\n")}
                              onChange={(e) => updateBlock(sidx, bidx, { listItems: e.target.value.split("\n") })}
                              className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                            />
                          </div>
                        )}

                        {blk.type === "quote" && (
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                            <textarea
                              value={blk.text || ""}
                              onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                              placeholder="Quote text..."
                              className="md:col-span-4 w-full min-h-[80px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                            />
                            <input
                              value={blk.quoteAuthor || ""}
                              onChange={(e) => updateBlock(sidx, bidx, { quoteAuthor: e.target.value })}
                              placeholder="Author"
                              className="md:col-span-2 w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                            />
                          </div>
                        )}

                        {blk.type === "equation" && (
                          <textarea
                            value={blk.text || ""}
                            onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                            placeholder="LaTeX equation (e.g., E = mc^2)"
                            className="w-full min-h-[80px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                          />
                        )}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <BlockTypeSwitcher
                            current={blk.type}
                            onChange={(t) => updateBlock(sidx, bidx, { type: t })}
                          />
                          {/* Citations picker (simple) */}
                          {references.length > 0 && (
                            <div className="text-xs text-zinc-400">
                              Citations:
                              <select
                                multiple
                                value={blk.citations || []}
                                onChange={(e) =>
                                  updateBlock(sidx, bidx, {
                                    citations: Array.from(e.target.selectedOptions).map((o) => o.value),
                                  })
                                }
                                className="ml-2 bg-zinc-900/40 border border-zinc-800 rounded p-1 text-zinc-200"
                              >
                                {references.map((r) => (
                                  <option key={r._id || r.title} value={String(r._id || r.title)}>
                                    {r.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2">
                      <ToolbarButton onClick={() => addBlock(sidx, "text")}>
                        <Plus className="w-3 h-3" /> Text
                      </ToolbarButton>
                      <ToolbarButton onClick={() => addBlock(sidx, "code")}>
                        <Plus className="w-3 h-3" /> Code
                      </ToolbarButton>
                      <ToolbarButton onClick={() => addBlock(sidx, "image")}>
                        <Plus className="w-3 h-3" /> Image
                      </ToolbarButton>
                      <ToolbarButton onClick={() => addBlock(sidx, "list")}>
                        <Plus className="w-3 h-3" /> List
                      </ToolbarButton>
                      <ToolbarButton onClick={() => addBlock(sidx, "quote")}>
                        <Plus className="w-3 h-3" /> Quote
                      </ToolbarButton>
                      <ToolbarButton onClick={() => addBlock(sidx, "equation")}>
                        <Plus className="w-3 h-3" /> Equation
                      </ToolbarButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <aside className="w-96 flex-shrink-0">
            <div className="space-y-6 sticky top-20">
              {/* Right tabs */}
              <div className="flex gap-2">
                {(["scratch", "notes", "resources", "references", "revisions"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveRightTab(tab)}
                    className={`flex-1 text-xs py-2 rounded-md border ${
                      activeRightTab === tab
                        ? "border-emerald-600/60 bg-emerald-600/10 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* ScratchPad */}
              {activeRightTab === "scratch" && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">ScratchPad</h4>
                    <ToolbarButton onClick={() => saveScratchPadNow()} title="Save scratchpad">
                      <Check className="w-4 h-4" /> Save
                    </ToolbarButton>
                  </div>
                  <textarea
                    value={scratchPad}
                    onChange={(e) => {
                      setScratchPad(e.target.value);
                      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
                      autosaveTimer.current = window.setTimeout(() => saveScratchPadNow(), 1200);
                    }}
                    className="w-full min-h-[180px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                  />
                </div>
              )}

              {/* Notes */}
              {activeRightTab === "notes" && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <ToolbarButton onClick={() => saveNotesNow()}>
                      <Check className="w-4 h-4" /> Save
                    </ToolbarButton>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
                      autosaveTimer.current = window.setTimeout(() => saveNotesNow(), 1200);
                    }}
                    className="w-full min-h-[160px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                  />
                </div>
              )}

              {/* Resources */}
              {activeRightTab === "resources" && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Resources</h4>
                    <ToolbarButton
                      onClick={() => {
                        const sample: Resource = { type: "website", title: "New resource", url: "", description: "" };
                        setResources((r) => [...r, sample]);
                        scheduleAutosave();
                      }}
                    >
                      Add
                    </ToolbarButton>
                  </div>

                  <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
                    {resources.length === 0 && <div className="text-zinc-500 text-sm">No resources yet.</div>}
                    {resources.map((r, i) => (
                      <div key={r._id || i} className="border border-zinc-800 rounded-md p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <input
                              value={r.title}
                              onChange={(e) => {
                                const copy = [...resources];
                                copy[i] = { ...copy[i], title: e.target.value };
                                setResources(copy); scheduleAutosave();
                              }}
                              className="w-full bg-transparent border-none text-sm text-white"
                            />
                            <input
                              value={r.url || ""}
                              onChange={(e) => {
                                const copy = [...resources];
                                copy[i] = { ...copy[i], url: e.target.value };
                                setResources(copy); scheduleAutosave();
                              }}
                              placeholder="URL"
                              className="w-full bg-transparent border-none text-xs text-zinc-400 mt-1"
                            />
                          </div>
                          <ToolbarButton onClick={() => { setResources((r0) => r0.filter((_, idx) => idx !== i)); scheduleAutosave(); }}>
                            Remove
                          </ToolbarButton>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-zinc-500">Curated resources saved with the article.</div>
                </div>
              )}

              {/* References */}
              {activeRightTab === "references" && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">References</h4>
                    <ToolbarButton
                      onClick={() => {
                        const ref: Reference = { title: "New reference" };
                        setReferences((r) => [...r, ref]); scheduleAutosave();
                      }}
                    >
                      Add
                    </ToolbarButton>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                    {references.length === 0 && <div className="text-zinc-500 text-sm">No references yet.</div>}
                    {references.map((r, i) => (
                      <div key={r._id || i} className="border border-zinc-800 rounded-md p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <input
                              value={r.title}
                              onChange={(e) => {
                                const copy = [...references];
                                copy[i] = { ...copy[i], title: e.target.value };
                                setReferences(copy); scheduleAutosave();
                              }}
                              className="w-full bg-transparent border-none text-sm text-white"
                            />
                            <input
                              value={r.url || ""}
                              onChange={(e) => {
                                const copy = [...references];
                                copy[i] = { ...copy[i], url: e.target.value };
                                setReferences(copy); scheduleAutosave();
                              }}
                              placeholder="URL / DOI"
                              className="w-full bg-transparent border-none text-xs text-zinc-400 mt-1"
                            />
                          </div>
                          <ToolbarButton onClick={() => { setReferences((r0) => r0.filter((_, idx) => idx !== i)); scheduleAutosave(); }}>
                            Remove
                          </ToolbarButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revisions */}
              {activeRightTab === "revisions" && (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">Revisions</h4>
                  <div className="max-h-[260px] overflow-auto text-sm text-zinc-400 space-y-2 pr-1">
                    {revisions.length === 0 && <div className="text-zinc-500">No revisions yet.</div>}
                    {revisions.map((r, i) => (
                      <div key={i} className="flex justify-between">
                        <div>
                          <div className="text-xs text-zinc-300">{new Date(r.editedAt).toLocaleString()}</div>
                          <div className="text-xs text-zinc-400">{r.summary || "(no summary)"}</div>
                        </div>
                        <div className="text-xs text-zinc-500">{(r as any).editedBy?.name || "you"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Save */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave()}
                    className="flex-1 inline-flex items-center gap-2 justify-center bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-md font-semibold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button
                    onClick={() => router.push(`/articles/${encodeURIComponent(slug)}`)}
                    className="flex-1 inline-flex items-center gap-2 justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-md font-semibold"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}