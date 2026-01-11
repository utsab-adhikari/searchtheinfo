"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Image as ImageIcon,
  BookMarked,
  StickyNote,
  FolderOpen,
  Save,
  Globe,
  Loader2,
  ArrowLeft,
  Settings,
  PenTool,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import MetadataTab from "@/components/editor/MetadataTab";
import ContentEditor, { Block } from "@/components/editor/ContentEditor";
import MediaTab from "@/components/editor/MediaTab";
import ScratchpadTab from "@/components/editor/ScratchpadTab";
import ResourcesTab, { Resources } from "@/components/editor/ResourcesTab";
import CitationsTab, { Citation } from "@/components/editor/CitationsTab";
import NotesTab, { Note } from "@/components/editor/NotesTab";
import ImageUploadModal, {
  ImageData,
} from "@/components/editor/ImageUploadModal";

export default function ArticleEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageInsertIndex, setImageInsertIndex] = useState<number | null>(null);

  const [article, setArticle] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<{ _id: string; title: string } | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [featuredImage, setFeaturedImage] = useState<ImageData | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [scratchpad, setScratchpad] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [resources, setResources] = useState<Resources>({
    daysToComplete: 1,
    lastReviewed: new Date().toISOString().split("T")[0],
    sites: [],
    books: [],
    youtubeVideos: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load article");
        }

        const articleData = json.data;
        setArticle(articleData);
        setTitle(articleData.title || "");
        setExcerpt(articleData.excerpt || "");
        setTags((articleData.tags || []).join(", "));
        if (articleData.category) {
          const cat = articleData.category as any;
          setCategory({ _id: cat._id?.toString?.() || cat._id || "", title: cat.title || cat.name || "" });
        } else {
          setCategory(null);
        }
        setBlocks(articleData.blocks || []);
        setFeaturedImage(articleData.featuredImage || null);
        setImages(articleData.images || []);
        setScratchpad(articleData.scratchpad || "");
        setCitations(articleData.citations || []);
        setNotes(articleData.notes || []);

        if (articleData.resources) {
          setResources({
            daysToComplete: articleData.resources.daysToComplete || 1,
            lastReviewed: articleData.resources.lastReviewed
              ? new Date(articleData.resources.lastReviewed)
                  .toISOString()
                  .split("T")[0]
              : new Date().toISOString().split("T")[0],
            sites: articleData.resources.sites || [],
            books: articleData.resources.books || [],
            youtubeVideos: articleData.resources.youtubeVideos || [],
          });
        }

        setLoading(false);
      } catch (error: any) {
        toast.error(error.message || "Failed to load article");
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const saveCurrentWork = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        excerpt,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category: category?._id || "",
        blocks,
        featuredImage,
        images,
        scratchpad,
        citations,
        notes,
        resources: {
          ...resources,
          lastReviewed: resources.lastReviewed
            ? new Date(resources.lastReviewed)
            : new Date(),
        },
      };

      const res = await fetch(`/api/articles/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "FULL_UPDATE", payload }),
      });

      if (res.ok) {
        toast.success("Changes saved");
      } else {
        throw new Error("Save failed");
      }
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (image: ImageData) => {
    if (imageInsertIndex !== null) {
      const newBlock: Block = {
        _id: `img-${Date.now()}`,
        type: "image",
        image,
        caption: image.caption,
      };
      const newBlocks = [...blocks];
      newBlocks.splice(imageInsertIndex, 0, newBlock);
      setBlocks(newBlocks);
    }
    setImages([...images, image]);
  };

  const handlePublish = async () => {
    if (!confirm("Ready to publish to the world?")) return;

    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "METADATA",
          payload: { status: "published" },
        }),
      });

      if (res.ok) {
        toast.success("Article published!");
        router.push(`/articles/${slug}`);
      } else {
        throw new Error("Publish failed");
      }
    } catch (error) {
      toast.error("Failed to publish article");
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const tabs = [
    { id: "metadata", label: "Metadata", icon: Settings },
    { id: "content", label: "Content", icon: FileText },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "scratchpad", label: "Scratchpad", icon: PenTool },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "citations", label: "Citations", icon: BookMarked },
    { id: "resources", label: "Resources", icon: FolderOpen },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster position="top-right" />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-50 sticky top-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/administration/drafts"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <Link href="/" className="font-light text-white text-sm">
                SearchThe
                <span className="text-emerald-400 font-medium">Info</span>
              </Link>
              <p className="text-zinc-500 text-[10px]">/{slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                article?.status === "published"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }`}
            >
              {article?.status || "Draft"}
            </div>
            <button
              onClick={saveCurrentWork}
              disabled={saving}
              className="px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs hover:border-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handlePublish}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3 h-3" />
              Publish
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-3 sticky top-16">
              <nav className="space-y-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-2 tracking-wider">
                  Stats
                </h3>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Blocks</span>
                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {blocks.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Images</span>
                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {images.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Citations</span>
                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {citations.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Notes</span>
                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {notes.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Resources</span>
                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {resources.sites.length +
                        resources.books.length +
                        resources.youtubeVideos.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-10">
            {activeTab === "metadata" && (
              <MetadataTab
                title={title}
                excerpt={excerpt}
                tags={tags}
                category={category ?? { _id: "", title: "" }}
                featuredImage={featuredImage}
                onTitleChange={setTitle}
                onExcerptChange={setExcerpt}
                onTagsChange={setTags}
                onCategoryChange={(value) => setCategory((prev) => ({ _id: prev?._id || "", title: value }))}
                onFeaturedImageChange={setFeaturedImage}
              />
            )}

            {activeTab === "content" && (
              <ContentEditor
                blocks={blocks}
                onBlocksChange={setBlocks}
                onAddImageClick={(index) => {
                  setImageInsertIndex(index);
                  setShowImageModal(true);
                }}
              />
            )}

            {activeTab === "media" && (
              <MediaTab
                featuredImage={featuredImage}
                images={images}
                onFeaturedImageChange={setFeaturedImage}
                onImagesChange={setImages}
              />
            )}

            {activeTab === "scratchpad" && (
              <ScratchpadTab content={scratchpad} onChange={setScratchpad} />
            )}

            {activeTab === "notes" && (
              <NotesTab notes={notes} onChange={setNotes} />
            )}

            {activeTab === "citations" && (
              <CitationsTab citations={citations} onChange={setCitations} />
            )}

            {activeTab === "resources" && (
              <ResourcesTab resources={resources} onChange={setResources} />
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setImageInsertIndex(null);
        }}
        onUpload={handleImageUpload}
        title="Add Image to Content"
      />
    </div>
  );
}
