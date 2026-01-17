"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Check,
  Copy,
  Info,
  Eye,
  EyeOff,
  Link as LinkIcon,
  BookOpen,
  ListTree,
  KeyRound,
  FileText,
  Palette,
  User,
} from "lucide-react";
import {
  uploadToCloudinary,
  getOptimizedImageUrl,
  deleteFromCloudinary,
} from "@/lib/cloudinary";

// Types mirrored from your schema (kept compatible)
type Link = {
  text: string;
  url: string;
};

type ContentBlock = {
  _id?: string;
  type: "text" | "image" | "list" | "quote" | "code" | "equation";
  text?: string;
  links?: Link[]; // array of links in text
  image?:
    | {
        url: string;
        caption?: string;
        credit?: string;
        publicId?: string;
        width?: number;
        height?: number;
        format?: string;
      }
    | null;
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
  children?: Section[];
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function tryParseUrl(u: string) {
  try {
    const parsed = new URL(u);
    return parsed;
  } catch {
    return null;
  }
}

export default function EditorSlugPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

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
  const [authorsString, setAuthorsString] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "content" | "metadata" | "notes" | "scratchpad" | "resources" | "references" | "revisions"
  >("content");

  // Right-tab-only state (citations filter for content)
  const [citationFilter, setCitationFilter] = useState("");

  const autosaveTimer = useRef<number | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Warn on page unload if dirty
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    document.title = `${dirty ? "• " : ""}${title || "Untitled"} — Editor`;
  }, [dirty, title]);

  // Load article
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}`);
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

        const initialAuthors = (art.authors || [])
          .map((a: any) => (typeof a === "string" ? a : a?.name || ""))
          .filter(Boolean);
        setAuthorsString(initialAuthors.join(", "));

        setDirty(false);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (cmdOrCtrl && e.shiftKey && key === "p") {
        e.preventDefault();
        if (status !== "published") handlePublish();
      }
      if (cmdOrCtrl && e.shiftKey && key === "v") {
        e.preventDefault();
        setPreviewMode((m) => (m === "edit" ? "preview" : "edit"));
      }
      // Tab quick-switch: Cmd/Ctrl + 1..7
      const tabKeys: Record<string, typeof activeTab> = {
        "1": "content",
        "2": "metadata",
        "3": "notes",
        "4": "scratchpad",
        "5": "resources",
        "6": "references",
        "7": "revisions",
      };
      if (cmdOrCtrl && tabKeys[key]) {
        e.preventDefault();
        setActiveTab(tabKeys[key]);
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [status]);

  // Autosave debounce
  const scheduleAutosave = useCallback(() => {
    setDirty(true);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      handleSave({ silent: true });
    }, 1200);
  }, [title, abstractText, keywordsString, authorsString, sections, references, resources, scratchPad, notes, status]);

  // Save full article
  async function handleSave(opts?: { silent?: boolean }) {
    if (!slug || !article) return;
    try {
      if (!opts?.silent) setSaving(true);

      const parsedKeywords = keywordsString
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);

      const parsedAuthors = authorsString
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      const payload: Partial<ArticlePayload> = {
        title,
        abstract: abstractText,
        keywords: parsedKeywords,
        authors: parsedAuthors, // save as string array (compatible with many schemas)
        sections,
        references,
        resources,
        scratchPad,
        notes,
        status,
      };

      const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      setArticle(data.article || article);
      if (data.article?.revisions) setRevisions(data.article.revisions || []);
      const now = new Date();
      setLastSavedAt(now);
      setDirty(false);
    } catch (err: any) {
      console.error("Save error", err);
      if (!opts?.silent) setError(err.message || String(err));
    } finally {
      if (!opts?.silent) setSaving(false);
    }
  }

  // Publish / Draft
  async function handlePublish() {
    if (!slug) return;
    if (!window.confirm("Publish this article? It will become publicly visible.")) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}/publish`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to publish");
      setStatus("published");
      setRevisions((r) => [
        ...(r || []),
        { editedAt: new Date().toISOString(), summary: "Published" } as Revision,
      ]);
      setDirty(false);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setPublishing(false);
    }
  }
  async function handleDraft() {
    if (!slug) return;
    if (!window.confirm("Move this article back to Draft?")) return;
    try {
      const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}/draft`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to move to draft");
      setStatus("draft");
    } catch (err: any) {
      setError(err.message || String(err));
    }
  }

  // Content operations (sections/blocks) — same features as before
  function addSection(type: Section["type"] = "custom") {
    const defaultTitle =
      type === "introduction"
        ? "Introduction"
        : type === "methodology"
        ? "Methodology"
        : type === "results"
        ? "Results"
        : type === "literature"
        ? "Related Work"
        : type === "discussion"
        ? "Discussion"
        : type === "conclusion"
        ? "Conclusion"
        : "New Section";
    const s: Section = {
      _id: `s_${Date.now()}`,
      title: defaultTitle,
      type,
      order: sections.length,
      blocks: [],
      children: [],
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
    const ok = window.confirm("Remove this section and all its content?");
    if (!ok) return;
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

  function addSubsection(sectionIdx: number) {
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { blocks: [], children: [] }) } as Section;
      const children = parent.children ? [...parent.children] : [];
      const sub: Section = {
        _id: `ss_${Date.now()}`,
        title: "New Subsection",
        type: "custom",
        order: children.length,
        blocks: [],
        children: [],
      };
      children.push(sub);
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function updateSubsection(sectionIdx: number, subIdx: number, patch: Partial<Section>) {
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      children[subIdx] = { ...children[subIdx], ...patch };
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function removeSubsection(sectionIdx: number, subIdx: number) {
    const ok = window.confirm("Remove this subsection and its blocks?");
    if (!ok) return;
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = (parent.children || [])
        .filter((_, i) => i !== subIdx)
        .map((s, i) => ({ ...s, order: i }));
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function moveSubsection(sectionIdx: number, subIdx: number, dir: "up" | "down") {
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      const to = dir === "up" ? subIdx - 1 : subIdx + 1;
      if (to < 0 || to >= children.length) return prev;
      [children[subIdx], children[to]] = [children[to], children[subIdx]];
      parent.children = children.map((s, i) => ({ ...s, order: i }));
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }

  function addBlock(sectionIdx: number, type: ContentBlock["type"] = "text") {
    const blk: ContentBlock = {
      _id: `b_${Date.now()}`,
      type,
      text: "",
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
    const ok = window.confirm("Delete this block?");
    if (!ok) return;
    setSections((prev) => {
      const next = [...prev];
      const sec = { ...next[sectionIdx] };
      sec.blocks = sec.blocks.filter((_, i) => i !== blockIdx);
      next[sectionIdx] = sec;
      return next;
    });
    scheduleAutosave();
  }

  // Subsection block ops
  function addBlockToSubsection(sectionIdx: number, subIdx: number, type: ContentBlock["type"] = "text") {
    const blk: ContentBlock = {
      _id: `b_${Date.now()}`,
      type,
      text: "",
      image: type === "image" ? { url: "" } : undefined,
      listItems: type === "list" ? [] : undefined,
    };
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      const sub = { ...(children[subIdx] || { blocks: [] }) } as Section;
      sub.blocks = [...(sub.blocks || []), blk];
      children[subIdx] = sub;
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function updateBlockInSubsection(sectionIdx: number, subIdx: number, blockIdx: number, patch: Partial<ContentBlock>) {
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      const sub = { ...(children[subIdx] || { blocks: [] }) } as Section;
      const blks = [...(sub.blocks || [])];
      blks[blockIdx] = { ...blks[blockIdx], ...(patch as any) };
      sub.blocks = blks;
      children[subIdx] = sub;
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function removeBlockFromSubsection(sectionIdx: number, subIdx: number, blockIdx: number) {
    const ok = window.confirm("Delete this block?");
    if (!ok) return;
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      const sub = { ...(children[subIdx] || { blocks: [] }) } as Section;
      sub.blocks = (sub.blocks || []).filter((_, i) => i !== blockIdx);
      children[subIdx] = sub;
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }
  function moveBlockWithinSubsection(sectionIdx: number, subIdx: number, blockIdx: number, dir: "up" | "down") {
    setSections((prev) => {
      const next = [...prev];
      const parent = { ...(next[sectionIdx] || { children: [] }) } as Section;
      const children = [...(parent.children || [])];
      const sub = { ...(children[subIdx] || { blocks: [] }) } as Section;
      const blks = [...(sub.blocks || [])];
      const to = dir === "up" ? blockIdx - 1 : blockIdx + 1;
      if (to < 0 || to >= blks.length) return prev;
      [blks[blockIdx], blks[to]] = [blks[to], blks[blockIdx]];
      sub.blocks = blks;
      children[subIdx] = sub;
      parent.children = children;
      next[sectionIdx] = parent;
      return next;
    });
    scheduleAutosave();
  }

  // ScratchPad / Notes quick save
  async function saveScratchPadNow() {
    if (!slug) return;
    try {
      await fetch(`/api/articles/v1/${encodeURIComponent(slug)}/scratchpad`, {
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
      await fetch(`/api/articles/v1/${encodeURIComponent(slug)}/notes`, {
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
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    title?: string;
    className?: string;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel || title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-200 hover:bg-zinc-900/80 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
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
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Block type">
        {types.map((t) => (
          <ToolbarButton
            key={t}
            title={`Switch to ${t}`}
            aria-label={`Switch block type to ${t}`}
            onClick={() => onChange(t)}
            className={cx(
              "capitalize",
              current === t && "border-emerald-600/60 bg-emerald-600/10 text-emerald-300"
            )}
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
    const dropRef = useRef<HTMLDivElement | null>(null);

    async function handleFile(file: File) {
      setUploading(true);
      setProgressHint("Uploading image...");
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

    useEffect(() => {
      const el = dropRef.current;
      if (!el) return;

      const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        el.classList.add("ring-2", "ring-emerald-500/40");
      };
      const onDragLeave = () => {
        el.classList.remove("ring-2", "ring-emerald-500/40");
      };
      const onDrop = (e: DragEvent) => {
        e.preventDefault();
        el.classList.remove("ring-2", "ring-emerald-500/40");
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
          handleFile(file);
        }
      };
      el.addEventListener("dragover", onDragOver);
      el.addEventListener("dragleave", onDragLeave);
      el.addEventListener("drop", onDrop);
      return () => {
        el.removeEventListener("dragover", onDragOver);
        el.removeEventListener("dragleave", onDragLeave);
        el.removeEventListener("drop", onDrop);
      };
    }, []);

    useEffect(() => {
      const onPaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              handleFile(file);
              e.preventDefault();
              break;
            }
          }
        }
      };
      document.addEventListener("paste", onPaste);
      return () => document.removeEventListener("paste", onPaste);
    }, []);

    async function removeImage() {
      const ok = window.confirm("Remove this image?");
      if (!ok) return;
      if (block.image?.publicId) {
        try {
          await deleteFromCloudinary(block.image.publicId);
        } catch (e) {
          console.warn("Cloudinary delete failed", e);
        }
      }
      onChange({ image: null });
    }

    const previewUrl = useMemo(() => {
      if (block.image?.publicId) {
        return getOptimizedImageUrl(block.image.publicId, {
          width: 920,
          quality: 85,
          format: "auto",
        });
      }
      return block.image?.url || "";
    }, [block.image?.publicId, block.image?.url]);

    return (
      <div className="border border-zinc-800 rounded-md p-3 bg-zinc-950/20">
        {!block.image?.url ? (
          <div
            ref={dropRef}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-800 rounded-md p-6 bg-zinc-900/40 hover:bg-zinc-900/60 cursor-pointer"
            onClick={() => inputRef.current?.click()}
            aria-label="Upload image"
            title="Click or drag an image to upload"
          >
            <Images className="w-6 h-6 text-zinc-500" />
            <div className="text-sm text-zinc-400">Click, drag & drop, or paste an image to upload</div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
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
              <img src={previewUrl} alt={block.image?.caption || "Image"} className="w-full rounded-md border border-zinc-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                value={block.image?.caption || ""}
                onChange={(e) => onChange({ image: { ...(block.image || { url: "" }), caption: e.target.value } })}
                placeholder="Caption"
                className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                aria-label="Image caption"
              />
              <input
                value={block.image?.credit || ""}
                onChange={(e) => onChange({ image: { ...(block.image || { url: "" }), credit: e.target.value } })}
                placeholder="Credit / Source"
                className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                aria-label="Image credit"
              />
            </div>
            <div className="flex items-center gap-2">
              <ToolbarButton onClick={() => inputRef.current?.click()}>
                <ImagePlus className="w-4 h-4" /> Replace
              </ToolbarButton>
              <ToolbarButton onClick={removeImage}>
                <Trash className="w-4 h-4" /> Remove
              </ToolbarButton>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
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

  function LinkManager({
    block,
    onChange,
  }: {
    block: ContentBlock;
    onChange: (patch: Partial<ContentBlock>) => void;
  }) {
    const [showLinksPanel, setShowLinksPanel] = useState(false);
    const [newLinkText, setNewLinkText] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    const parsed = tryParseUrl(newLinkUrl);
    const domain = parsed ? parsed.hostname.replace(/^www\./, "") : "";
    const isValid = !!parsed;

    function addLink() {
      if (!newLinkText.trim() || !newLinkUrl.trim() || !isValid) {
        alert("Provide valid link text and a valid URL (starting with http:// or https://).");
        return;
      }
      const updatedLinks = [...(block.links || []), { text: newLinkText.trim(), url: newLinkUrl.trim() }];
      onChange({ links: updatedLinks });
      setNewLinkText("");
      setNewLinkUrl("");
    }

    function removeLink(idx: number) {
      const updatedLinks = (block.links || []).filter((_, i) => i !== idx);
      onChange({ links: updatedLinks.length > 0 ? updatedLinks : undefined });
    }

    const linkCount = block.links?.length || 0;

    return (
      <div>
        <button
          type="button"
          onClick={() => setShowLinksPanel(!showLinksPanel)}
          className={cx(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            showLinksPanel
              ? "bg-emerald-600/20 border border-emerald-600/50 text-emerald-300"
              : linkCount > 0
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          )}
          aria-expanded={showLinksPanel}
          aria-controls={`links-panel-${block._id}`}
          title="Manage links"
        >
          <LinkIcon className="w-4 h-4" />
          Links {linkCount > 0 && `(${linkCount})`}
        </button>

        {showLinksPanel && (
          <div id={`links-panel-${block._id}`} className="mt-3 border border-zinc-800 rounded-md p-3 bg-zinc-950/50">
            {block.links && block.links.length > 0 && (
              <div className="space-y-2 mb-4 pb-4 border-b border-zinc-800">
                {block.links.map((link, idx) => {
                  const parsedExisting = tryParseUrl(link.url || "");
                  const domainExisting = parsedExisting ? parsedExisting.hostname.replace(/^www\./, "") : "";
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-zinc-900 rounded border border-zinc-700 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="text-zinc-300 truncate">
                          <span className="text-zinc-500">Text:</span> {link.text}
                        </div>
                        <div className="text-blue-400 truncate mt-0.5">
                          <span className="text-zinc-500">URL:</span> {link.url}
                          {domainExisting && <span className="ml-2 text-zinc-500">({domainExisting})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToolbarButton
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(link.url);
                            } catch {}
                          }}
                          title="Copy URL"
                          aria-label="Copy URL"
                        >
                          <Copy className="w-3 h-3" />
                        </ToolbarButton>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 rounded border border-zinc-700 text-xs text-blue-300 hover:bg-zinc-800"
                          title="Open link"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
                          className="flex-shrink-0 p-1 hover:bg-red-600/20 rounded transition text-red-400"
                          title="Remove link"
                          aria-label="Remove link"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <input
                type="text"
                value={newLinkText}
                onChange={(e) => setNewLinkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLink()}
                placeholder="Link text (e.g., 'Read more')"
                className="w-full bg-transparent border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-600 focus:outline-none"
                aria-label="Link text"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  placeholder="https://example.com/article"
                  className={cx(
                    "flex-1 bg-transparent border rounded-md p-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none",
                    isValid ? "border-zinc-700 focus:border-emerald-600" : "border-red-600/50 focus:border-red-600"
                  )}
                  aria-label="Link URL"
                />
                {isValid ? (
                  <span className="inline-flex items-center text-xs text-emerald-300">
                    <Check className="w-3 h-3 mr-1" /> {domain}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs text-red-300">
                    <Info className="w-3 h-3 mr-1" /> Invalid URL
                  </span>
                )}
                <button
                  type="button"
                  onClick={addLink}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 text-emerald-300 text-xs font-medium transition"
                  aria-label="Add link"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render app layout
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
          <div className="mt-6">
            <ToolbarButton onClick={() => router.refresh()}>Retry</ToolbarButton>
          </div>
        </div>
      </div>
    );
  }

  const statusClass =
    status === "published"
      ? "border-emerald-600/60 bg-emerald-600/10 text-emerald-300"
      : status === "in-review"
      ? "border-sky-600/60 bg-sky-600/10 text-sky-300"
      : status === "archived"
      ? "border-zinc-700 bg-zinc-900 text-zinc-300"
      : "border-amber-600/60 bg-amber-600/10 text-amber-300";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-100">
      {/* Top Toolbar */}
      <div className="border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Palette className="w-4 h-4" /> Research Editor
            </div>
            <div className="flex items-center gap-2">
              <div className={cx("text-xs", dirty ? "text-amber-400" : "text-zinc-500")} aria-live="polite">
                {dirty ? "Unsaved changes" : lastSavedAt ? `Saved ${relativeTime(lastSavedAt)}` : "—"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Status:</span>
            <span className={cx("px-2 py-1 rounded text-xs border", statusClass)}>{status}</span>
            <ToolbarButton onClick={() => handleSave()} title="Save (Ctrl/Cmd+S)" aria-label="Save">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </ToolbarButton>
            {status !== "published" ? (
              <button
                onClick={() => handlePublish()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-2 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Publish (Ctrl/Cmd+Shift+P)"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Publish
              </button>
            ) : (
              <button
                onClick={() => handleDraft()}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                Move to Draft
              </button>
            )}
            <button
              onClick={() => setPreviewMode((m) => (m === "edit" ? "preview" : "edit"))}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-md font-medium"
              title="Toggle preview (Ctrl/Cmd+Shift+V)"
            >
              {previewMode === "edit" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {previewMode === "edit" ? "Preview" : "Edit"}
            </button>
          </div>
        </div>

        {/* Main Tab Bar (compact, high-contrast, keyboard-friendly) */}
        <div className="border-t border-zinc-900/70 bg-gradient-to-r from-zinc-950 via-zinc-950 to-zinc-900/80">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {([
                { key: "content", label: "Content", icon: FileText, hint: "Outline, blocks, media" },
                { key: "metadata", label: "Metadata", icon: BookOpen, hint: "Title, abstract, keywords" },
                { key: "notes", label: "Notes", icon: FileText, hint: "Research notes" },
                { key: "scratchpad", label: "ScratchPad", icon: FileText, hint: "Freeform pad" },
                { key: "resources", label: "Resources", icon: LinkIcon, hint: "Links & sources" },
                { key: "references", label: "References", icon: BookOpen, hint: "Citations" },
                { key: "revisions", label: "Revisions", icon: ListTree, hint: "History" },
              ] as const).map(({ key, label, icon: Icon, hint }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cx(
                    "group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    activeTab === key
                      ? "border-emerald-600/60 bg-emerald-600/10 text-emerald-200 shadow-[0_8px_24px_-18px_rgba(16,185,129,0.9)]"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-900"
                  )}
                  aria-pressed={activeTab === key}
                >
                  <span className={cx(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border",
                    activeTab === key ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  )}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 leading-tight">
                    <span className="block font-semibold">{label}</span>
                  </span>
                  {activeTab === key && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Content Panel: Outline + Editor */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Outline */}
            <nav className="lg:col-span-3">
              <div className="sticky top-24 bg-zinc-900/30 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200 mb-2">
                  <ListTree className="w-4 h-4" /> Outline
                </div>
                {sections.length === 0 && <div className="text-zinc-500 text-sm">No sections yet.</div>}
                <ol className="space-y-2 text-sm">
                  {sections.map((s, i) => (
                    <li key={s._id || i}>
                      <button
                        className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800/60 text-zinc-300"
                        onClick={() => {
                          const el = sectionRefs.current[s._id || String(i)];
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        title={`Jump to ${s.title}`}
                      >
                        {i + 1}. {s.title}
                      </button>
                      {s.children?.length ? (
                        <ol className="ml-4 mt-1 space-y-1 text-zinc-400">
                          {s.children.map((sub, j) => (
                            <li key={sub._id || j}>
                              <button
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800/60"
                                onClick={() => {
                                  const el = sectionRefs.current[`${s._id || i}__${sub._id || j}`];
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                title={`Jump to ${sub.title}`}
                              >
                                {(i + 1).toString()}.{j + 1} {sub.title}
                              </button>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ToolbarButton onClick={() => addSection("introduction")} title="Add Introduction">
                    <Plus className="w-3 h-3" /> Intro
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("methodology")} title="Add Methodology">
                    <Plus className="w-3 h-3" /> Method
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("results")} title="Add Results">
                    <Plus className="w-3 h-3" /> Results
                  </ToolbarButton>
                  <ToolbarButton onClick={() => addSection("custom")} title="Add custom section">
                    <Plus className="w-3 h-3" /> Section
                  </ToolbarButton>
                </div>
              </div>
            </nav>

            {/* Editor */}
            <main className="lg:col-span-9">

              {/* Sections */}
              <section className="space-y-5">
                {sections.length === 0 && (
                  <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-md text-zinc-400">
                    No sections yet. Start by adding one from the Outline panel.
                  </div>
                )}

                {sections.map((sec, sidx) => (
                  <div
                    key={sec._id || sidx}
                    ref={(el) => {
                      sectionRefs.current[sec._id || String(sidx)] = el;
                    }}
                    className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        {previewMode === "edit" ? (
                          <input
                            value={sec.title}
                            onChange={(e) => updateSection(sidx, { title: e.target.value })}
                            className="w-full bg-transparent border-none focus:outline-none text-white font-semibold text-lg"
                            aria-label={`Section ${sidx + 1} title`}
                          />
                        ) : (
                          <h3 className="text-white font-semibold text-lg">{sec.title}</h3>
                        )}
                        <div className="text-xs text-zinc-500 mt-1">Type: {sec.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToolbarButton onClick={() => moveSection(sidx, "up")} title="Move up" aria-label="Move section up">
                          <ChevronUp className="w-4 h-4" />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => moveSection(sidx, "down")} title="Move down" aria-label="Move section down">
                          <ChevronDown className="w-4 h-4" />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => addSubsection(sidx)} title="Add subsection">
                          <Plus className="w-3 h-3" /> Subsection
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
                              <ToolbarButton onClick={() => moveBlock(sidx, bidx, "up")} title="Move block up" aria-label="Move block up">
                                <ChevronUp className="w-4 h-4" />
                              </ToolbarButton>
                              <ToolbarButton onClick={() => moveBlock(sidx, bidx, "down")} title="Move block down" aria-label="Move block down">
                                <ChevronDown className="w-4 h-4" />
                              </ToolbarButton>
                              <ToolbarButton onClick={() => duplicateBlock(sidx, bidx)} title="Duplicate block" aria-label="Duplicate block">
                                <Copy className="w-4 h-4" />
                              </ToolbarButton>
                              <ToolbarButton onClick={() => removeBlock(sidx, bidx)} title="Delete block" aria-label="Delete block">
                                <Trash className="w-3 h-3" />
                              </ToolbarButton>
                            </div>
                          </div>

                          {/* Block Editors */}
                          {blk.type === "text" && (
                            <div className="space-y-4">
                              {previewMode === "edit" ? (
                                <textarea
                                  value={blk.text || ""}
                                  onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                                  placeholder="Write paragraph..."
                                  className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                />
                              ) : (
                                <div className="prose prose-invert max-w-none text-sm leading-6">
                                  {blk.text || <span className="text-zinc-500">Empty paragraph</span>}
                                </div>
                              )}
                              {previewMode === "edit" && (
                                <LinkManager block={blk} onChange={(patch) => updateBlock(sidx, bidx, patch)} />
                              )}
                            </div>
                          )}

                          {blk.type === "code" && (
                            <div>
                              {previewMode === "edit" ? (
                                <>
                                  <select
                                    value={blk.codeLanguage || ""}
                                    onChange={(e) => updateBlock(sidx, bidx, { codeLanguage: e.target.value })}
                                    className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mb-2"
                                    aria-label="Code language"
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
                                </>
                              ) : (
                                <pre className="bg-zinc-950/40 border border-zinc-800 rounded-md p-3 text-xs overflow-auto">
                                  <code>{blk.text}</code>
                                </pre>
                              )}
                            </div>
                          )}

                          {blk.type === "image" && <ImageUploader block={blk} onChange={(patch) => updateBlock(sidx, bidx, patch)} />}

                          {blk.type === "list" && (
                            <div>
                              {previewMode === "edit" ? (
                                <>
                                  <label className="text-xs text-zinc-400">List items (one per line)</label>
                                  <textarea
                                    value={(blk.listItems || []).join("\n")}
                                    onChange={(e) => updateBlock(sidx, bidx, { listItems: e.target.value.split("\n") })}
                                    className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                  />
                                </>
                              ) : (
                                <ul className="list-disc pl-5 text-sm text-zinc-200">
                                  {(blk.listItems || []).map((li, i) => (
                                    <li key={i}>{li}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {blk.type === "quote" && (
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                              {previewMode === "edit" ? (
                                <>
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
                                </>
                              ) : (
                                <blockquote className="md:col-span-6 border-l-2 border-zinc-700 pl-3 text-zinc-200">
                                  <p className="text-sm">{blk.text}</p>
                                  {blk.quoteAuthor && <cite className="mt-1 block text-xs text-zinc-400">— {blk.quoteAuthor}</cite>}
                                </blockquote>
                              )}
                            </div>
                          )}

                          {blk.type === "equation" && (
                            <>
                              {previewMode === "edit" ? (
                                <textarea
                                  value={blk.text || ""}
                                  onChange={(e) => updateBlock(sidx, bidx, { text: e.target.value })}
                                  placeholder="LaTeX equation (e.g., E = mc^2)"
                                  className="w-full min-h-[80px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                />
                              ) : (
                                <div className="p-3 border border-zinc-800 rounded-md bg-zinc-900/40 text-sm text-zinc-200 font-mono">
                                  {blk.text || <span className="text-zinc-500">No equation.</span>}
                                </div>
                              )}
                            </>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            {previewMode === "edit" ? (
                              <BlockTypeSwitcher current={blk.type} onChange={(t) => updateBlock(sidx, bidx, { type: t })} />
                            ) : (
                              <div className="text-xs text-zinc-500">Preview mode</div>
                            )}
                            {references.length > 0 && previewMode === "edit" && (
                              <div className="text-xs text-zinc-400 flex items-center gap-2">
                                <span>Citations:</span>
                                <input
                                  value={citationFilter}
                                  onChange={(e) => setCitationFilter(e.target.value)}
                                  placeholder="Filter..."
                                  className="bg-zinc-900/40 border border-zinc-800 rounded p-1 text-zinc-200"
                                  aria-label="Filter citations"
                                />
                                <select
                                  multiple
                                  value={blk.citations || []}
                                  onChange={(e) =>
                                    updateBlock(sidx, bidx, {
                                      citations: Array.from(e.target.selectedOptions).map((o) => o.value),
                                    })
                                  }
                                  className="bg-zinc-900/40 border border-zinc-800 rounded p-1 text-zinc-200"
                                  aria-label="Select citations"
                                >
                                  {references
                                    .filter((r) => {
                                      const q = citationFilter.trim().toLowerCase();
                                      if (!q) return true;
                                      return (
                                        (r.title || "").toLowerCase().includes(q) ||
                                        (r.journal || "").toLowerCase().includes(q) ||
                                        (r.authors || "").toLowerCase().includes(q)
                                      );
                                    })
                                    .map((r) => (
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

                      {/* Subsections */}
                      {sec.children?.length ? (
                        <div className="mt-4 space-y-4">
                          <div className="text-sm font-medium text-zinc-300">Subsections</div>
                          {sec.children.map((sub, subIdx) => (
                            <div
                              key={sub._id || subIdx}
                              ref={(el) => {
                                sectionRefs.current[`${sec._id || sidx}__${sub._id || subIdx}`] = el;
                              }}
                              className="bg-zinc-900/20 border border-zinc-800 rounded-md p-3"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  {previewMode === "edit" ? (
                                    <input
                                      value={sub.title}
                                      onChange={(e) => updateSubsection(sidx, subIdx, { title: e.target.value })}
                                      className="w-full bg-transparent border-none focus:outline-none text-white font-semibold"
                                      aria-label={`Subsection ${subIdx + 1} title`}
                                    />
                                  ) : (
                                    <h4 className="text-white font-semibold">{sub.title}</h4>
                                  )}
                                  <div className="text-xs text-zinc-500">Subsection</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ToolbarButton onClick={() => moveSubsection(sidx, subIdx, "up")} title="Move up">
                                    <ChevronUp className="w-4 h-4" />
                                  </ToolbarButton>
                                  <ToolbarButton onClick={() => moveSubsection(sidx, subIdx, "down")} title="Move down">
                                    <ChevronDown className="w-4 h-4" />
                                  </ToolbarButton>
                                  <ToolbarButton onClick={() => removeSubsection(sidx, subIdx)} title="Remove subsection">
                                    <Trash className="w-3 h-3" /> Remove
                                  </ToolbarButton>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {(sub.blocks || []).map((blk2, bi) => (
                                  <div key={blk2._id || bi} className="bg-zinc-950/10 border border-zinc-800 rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-zinc-400">Block: {blk2.type.toUpperCase()}</div>
                                      <div className="flex items-center gap-2">
                                        <ToolbarButton onClick={() => moveBlockWithinSubsection(sidx, subIdx, bi, "up")} title="Move up">
                                          <ChevronUp className="w-4 h-4" />
                                        </ToolbarButton>
                                        <ToolbarButton onClick={() => moveBlockWithinSubsection(sidx, subIdx, bi, "down")} title="Move down">
                                          <ChevronDown className="w-4 h-4" />
                                        </ToolbarButton>
                                        <ToolbarButton onClick={() => removeBlockFromSubsection(sidx, subIdx, bi)} title="Delete block">
                                          <Trash className="w-3 h-3" />
                                        </ToolbarButton>
                                      </div>
                                    </div>

                                    {blk2.type === "text" && (
                                      previewMode === "edit" ? (
                                        <textarea
                                          value={blk2.text || ""}
                                          onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { text: e.target.value })}
                                          placeholder="Write paragraph..."
                                          className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                        />
                                      ) : (
                                        <div className="prose prose-invert max-w-none text-sm leading-6">
                                          {blk2.text || <span className="text-zinc-500">Empty paragraph</span>}
                                        </div>
                                      )
                                    )}

                                    {blk2.type === "code" && (
                                      <div>
                                        {previewMode === "edit" ? (
                                          <>
                                            <select
                                              value={blk2.codeLanguage || ""}
                                              onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { codeLanguage: e.target.value })}
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
                                              value={blk2.text || ""}
                                              onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { text: e.target.value })}
                                              placeholder="Paste code..."
                                              className="w-full min-h-[140px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 font-mono resize-y"
                                            />
                                          </>
                                        ) : (
                                          <pre className="bg-zinc-950/40 border border-zinc-800 rounded-md p-3 text-xs overflow-auto">
                                            <code>{blk2.text}</code>
                                          </pre>
                                        )}
                                      </div>
                                    )}

                                    {blk2.type === "image" && (
                                      <ImageUploader
                                        block={blk2}
                                        onChange={(patch) => updateBlockInSubsection(sidx, subIdx, bi, patch)}
                                      />
                                    )}

                                    {blk2.type === "list" && (
                                      <div>
                                        {previewMode === "edit" ? (
                                          <>
                                            <label className="text-xs text-zinc-400">List items (one per line)</label>
                                            <textarea
                                              value={(blk2.listItems || []).join("\n")}
                                              onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { listItems: e.target.value.split("\n") })}
                                              className="w-full min-h-[90px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                            />
                                          </>
                                        ) : (
                                          <ul className="list-disc pl-5 text-sm text-zinc-200">
                                            {(blk2.listItems || []).map((li, i) => (
                                              <li key={i}>{li}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    )}

                                    {blk2.type === "quote" && (
                                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                        {previewMode === "edit" ? (
                                          <>
                                            <textarea
                                              value={blk2.text || ""}
                                              onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { text: e.target.value })}
                                              placeholder="Quote text..."
                                              className="md:col-span-4 w-full min-h-[80px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                            />
                                            <input
                                              value={blk2.quoteAuthor || ""}
                                              onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { quoteAuthor: e.target.value })}
                                              placeholder="Author"
                                              className="md:col-span-2 w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                                            />
                                          </>
                                        ) : (
                                          <blockquote className="md:col-span-6 border-l-2 border-zinc-700 pl-3 text-zinc-200">
                                            <p className="text-sm">{blk2.text}</p>
                                            {blk2.quoteAuthor && (
                                              <cite className="mt-1 block text-xs text-zinc-400">— {blk2.quoteAuthor}</cite>
                                            )}
                                          </blockquote>
                                        )}
                                      </div>
                                    )}

                                    {blk2.type === "equation" && (
                                      <>
                                        {previewMode === "edit" ? (
                                          <textarea
                                            value={blk2.text || ""}
                                            onChange={(e) => updateBlockInSubsection(sidx, subIdx, bi, { text: e.target.value })}
                                            placeholder="LaTeX equation (e.g., E = mc^2)"
                                            className="w-full min-h-[80px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
                                          />
                                        ) : (
                                          <div className="p-3 border border-zinc-800 rounded-md bg-zinc-900/40 text-sm text-zinc-200 font-mono">
                                            {blk2.text || <span className="text-zinc-500">No equation.</span>}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}

                                {previewMode === "edit" && (
                                  <div className="flex flex-wrap gap-2">
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "text")}>
                                      <Plus className="w-3 h-3" /> Text
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "code")}>
                                      <Plus className="w-3 h-3" /> Code
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "image")}>
                                      <Plus className="w-3 h-3" /> Image
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "list")}>
                                      <Plus className="w-3 h-3" /> List
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "quote")}>
                                      <Plus className="w-3 h-3" /> Quote
                                    </ToolbarButton>
                                    <ToolbarButton onClick={() => addBlockToSubsection(sidx, subIdx, "equation")}>
                                      <Plus className="w-3 h-3" /> Equation
                                    </ToolbarButton>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {previewMode === "edit" && (
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
                      )}
                    </div>
                  </div>
                ))}
              </section>
            </main>
          </div>
        )}

        {/* Metadata Panel */}
        {activeTab === "metadata" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Basic Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400">Title</label>
                    <input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        scheduleAutosave();
                      }}
                      className="mt-1 w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Abstract</label>
                    <textarea
                      value={abstractText}
                      onChange={(e) => {
                        setAbstractText(e.target.value);
                        scheduleAutosave();
                      }}
                      className="mt-1 w-full min-h-[110px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
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
                      className="mt-1 w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                    />
                    <div className="text-[11px] mt-1 text-zinc-500">Max 12 stored.</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> Authors
                    </label>
                    <input
                      value={authorsString}
                      onChange={(e) => {
                        setAuthorsString(e.target.value);
                        scheduleAutosave();
                      }}
                      placeholder="Jane Doe, John Smith"
                      className="mt-1 w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200"
                    />
                    <div className="text-[11px] mt-1 text-zinc-500">Comma-separated list of author names.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Status</h3>
                <div className="flex items-center gap-2">
                  <span className={cx("px-2 py-1 rounded text-xs border", statusClass)}>{status}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
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
                  <ToolbarButton onClick={() => handleSave()}>
                    <Save className="w-4 h-4" /> Save metadata
                  </ToolbarButton>
                </div>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Tips</h3>
                <ul className="text-sm text-zinc-400 list-disc pl-5 space-y-1">
                  <li>Keep title concise and informative.</li>
                  <li>Abstract should summarize the problem, method, and key findings.</li>
                  <li>Choose specific keywords for discoverability.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Notes Panel */}
        {activeTab === "notes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
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
                className="w-full min-h-[260px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
              />
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Guidance</h3>
                <p className="text-sm text-zinc-400">
                  Use Notes for thoughts, to-do items, and reminders while editing the main content.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ScratchPad Panel */}
        {activeTab === "scratchpad" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
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
                className="w-full min-h-[300px] bg-transparent border border-zinc-800 rounded-md p-3 text-sm text-zinc-200 resize-y"
              />
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Usage</h3>
                <p className="text-sm text-zinc-400">
                  The ScratchPad is free-form. Paste snippets, brainstorm, or temporarily store content here.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resources Panel */}
        {activeTab === "resources" && (
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

            <div className="space-y-3">
              {resources.length === 0 && <div className="text-zinc-500 text-sm">No resources yet.</div>}
              {resources.map((r, i) => (
                <div key={r._id || i} className="border border-zinc-800 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">Title</label>
                      <input
                        value={r.title}
                        onChange={(e) => {
                          const copy = [...resources];
                          copy[i] = { ...copy[i], title: e.target.value };
                          setResources(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-white mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">URL</label>
                      <input
                        value={r.url || ""}
                        onChange={(e) => {
                          const copy = [...resources];
                          copy[i] = { ...copy[i], url: e.target.value };
                          setResources(copy);
                          scheduleAutosave();
                        }}
                        placeholder="https://..."
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">Author</label>
                      <input
                        value={r.author || ""}
                        onChange={(e) => {
                          const copy = [...resources];
                          copy[i] = { ...copy[i], author: e.target.value };
                          setResources(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">Description</label>
                      <input
                        value={r.description || ""}
                        onChange={(e) => {
                          const copy = [...resources];
                          copy[i] = { ...copy[i], description: e.target.value };
                          setResources(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <ToolbarButton
                      onClick={() => {
                        const ok = window.confirm("Remove this resource?");
                        if (!ok) return;
                        setResources((r0) => r0.filter((_, idx) => idx !== i));
                        scheduleAutosave();
                      }}
                    >
                      Remove
                    </ToolbarButton>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500">Curated resources saved with the article.</div>
          </div>
        )}

        {/* References Panel */}
        {activeTab === "references" && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">References</h4>
              <ToolbarButton
                onClick={() => {
                  const ref: Reference = { title: "New reference" };
                  setReferences((r) => [...r, ref]);
                  scheduleAutosave();
                }}
              >
                Add
              </ToolbarButton>
            </div>

            <div className="space-y-3">
              {references.length === 0 && <div className="text-zinc-500 text-sm">No references yet.</div>}
              {references.map((r, i) => (
                <div key={r._id || i} className="border border-zinc-800 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">Title</label>
                      <input
                        value={r.title}
                        onChange={(e) => {
                          const copy = [...references];
                          copy[i] = { ...copy[i], title: e.target.value };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-white mt-1"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-zinc-500">Authors</label>
                      <input
                        value={r.authors || ""}
                        onChange={(e) => {
                          const copy = [...references];
                          copy[i] = { ...copy[i], authors: e.target.value };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500">Journal / Venue</label>
                      <input
                        value={r.journal || ""}
                        onChange={(e) => {
                          const copy = [...references];
                          copy[i] = { ...copy[i], journal: e.target.value };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs text-zinc-500">Year</label>
                      <input
                        value={r.year?.toString() || ""}
                        onChange={(e) => {
                          const copy = [...references];
                          const val = e.target.value.replace(/\D/g, "");
                          copy[i] = { ...copy[i], year: val ? Number(val) : undefined };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500">DOI</label>
                      <input
                        value={r.doi || ""}
                        onChange={(e) => {
                          const copy = [...references];
                          copy[i] = { ...copy[i], doi: e.target.value };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-zinc-200 mt-1"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="text-xs text-zinc-500">URL</label>
                      <input
                        value={r.url || ""}
                        onChange={(e) => {
                          const copy = [...references];
                          copy[i] = { ...copy[i], url: e.target.value };
                          setReferences(copy);
                          scheduleAutosave();
                        }}
                        placeholder="https://..."
                        className="w-full bg-transparent border border-zinc-800 rounded-md p-2 text-sm text-blue-400 mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end">
                    <ToolbarButton
                      onClick={() => {
                        const ok = window.confirm("Remove this reference?");
                        if (!ok) return;
                        setReferences((r0) => r0.filter((_, idx) => idx !== i));
                        scheduleAutosave();
                      }}
                    >
                      Remove
                    </ToolbarButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revisions Panel */}
        {activeTab === "revisions" && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Revisions</h4>
            <div className="max-h-[420px] overflow-auto text-sm text-zinc-400 space-y-2 pr-1">
              {revisions.length === 0 && <div className="text-zinc-500">No revisions yet.</div>}
              {revisions.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-zinc-800 pb-2">
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

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => handleSave()}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-md font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
          </button>
          <button
            onClick={() => router.push(`/articles/${encodeURIComponent(slug)}`)}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-md font-semibold"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}