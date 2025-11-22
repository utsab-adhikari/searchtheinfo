"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_BLOCKS = [
  { type: "heading", level: 1, content: "" },
  { type: "text", content: "" },
];

function normalizeBlocks(blocks = [], images = [], citations = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return DEFAULT_BLOCKS.map((block) => ({ ...block }));
  }

  const imageMap = new Map(
    images.map((img) => [img?._id?.toString?.() ?? img?._id ?? img?.url, img])
  );
  const citationMap = new Map(
    citations.map((cite) => [
      cite?._id?.toString?.() ?? cite?._id ?? cite?.text,
      cite,
    ])
  );

  return blocks.map((block) => {
    const normalized = { ...block };
    if (block.image) {
      const imageKey =
        typeof block.image === "string"
          ? block.image
          : block.image._id?.toString?.() ?? block.image._id ?? block.image.url;
      normalized.image = imageMap.get(imageKey) || block.image || null;
    }
    if (block.citation) {
      const citationKey =
        typeof block.citation === "string"
          ? block.citation
          : block.citation._id?.toString?.() ??
            block.citation._id ??
            block.citation.text;
      normalized.citation =
        citationMap.get(citationKey) || block.citation || null;
    }
    return normalized;
  });
}

export default function ArticleUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.slug;

  const [id, setId] = useState(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [citations, setCitations] = useState([]);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading article...");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFeaturedImageModal, setShowFeaturedImageModal] = useState(false);
  const [imageMeta, setImageMeta] = useState({
    file: null,
    filename: "",
    title: "",
    description: "",
    caption: "",
    attribution: "",
  });
  const [insertIndex, setInsertIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("content");
  const [status, setStatus] = useState("draft");
  const [currentSlug, setCurrentSlug] = useState(slugParam);
  const [initializing, setInitializing] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [researchedBy, setResearchedBy] = useState("Your Name");
  const [publishedBy, setPublishedBy] = useState("");
  const [scratchpad, setScratchpad] = useState("");
  const [resources, setResources] = useState({
    daysToComplete: 1,
    sites: [],
    books: [],
    youtubeVideos: [],
    lastReviewed: new Date().toISOString().split("T")[0],
  });

  /* ---------- Block Management ---------- */
  function insertBlock(block, at) {
    if (at === null || at === undefined) setBlocks((p) => [...p, block]);
    else {
      const c = [...blocks];
      c.splice(at, 0, block);
      setBlocks(c);
    }
  }

  function addTextBlock(at = null) {
    insertBlock({ type: "text", content: "" }, at);
  }

  function addHeadingBlock(at = null) {
    insertBlock({ type: "heading", level: 2, content: "Heading" }, at);
  }

  function removeBlock(i) {
    setBlocks((p) => p.filter((_, idx) => idx !== i));
  }

  function updateBlock(i, patch) {
    setBlocks((p) => p.map((b, idx) => (i === idx ? { ...b, ...patch } : b)));
  }

  /* ---------- Data Loading ---------- */
  const loadArticle = useCallback(async () => {
    if (!slugParam) return;
    setInitializing(true);
    setLoadError(null);
    setMessage("Loading article...");
    try {
      const response = await fetch(
        `/api/articles/${slugParam}?includeDrafts=true`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load article");
      }
      const article = data.article;
      if (!article) {
        throw new Error("Article not found");
      }
      setId(article._id);
      setTitle(article.title || "");
      setExcerpt(article.excerpt || "");
      setTags((article.tags || []).join(", "));
      setFeaturedImage(article.featuredImage || null);
      setImages(article.images || []);
      setCitations(article.citations || []);
      setBlocks(
        normalizeBlocks(article.blocks, article.images, article.citations)
      );
      setStatus(article.status || "draft");
      setCurrentSlug(article.slug);
      setResearchedBy(article.researchedBy || "Your Name");
      setPublishedBy(article.publishedBy || "");
      setScratchpad(article.scratchpad || "");

      // Load resources if they exist
      if (article.resources) {
        setResources({
          daysToComplete: article.resources.daysToComplete || 1,
          sites: article.resources.sites || [],
          books: article.resources.books || [],
          youtubeVideos: article.resources.youtubeVideos || [],
          lastReviewed: article.resources.lastReviewed
            ? new Date(article.resources.lastReviewed)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      }

      setMessage("Article loaded");
    } catch (err) {
      console.error("Failed to load article:", err);
      setLoadError(err.message);
      setMessage(`Load failed: ${err.message}`);
    } finally {
      setInitializing(false);
    }
  }, [slugParam]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  /* ---------- Image Upload ---------- */
  async function uploadImageFile(meta) {
    setMessage("Uploading image...");
    const file = meta.file;
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result;
          const resp = await fetch("/api/articles/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: base64,
              filename: meta.filename || file.name,
              title: meta.title,
              description: meta.description,
              articleId: id,
            }),
          });
          const json = await resp.json();
          if (!json.success) throw new Error(json.error || "Upload failed");
          const img = {
            ...json.image,
            caption: meta.caption,
            attribution: meta.attribution,
          };
          setImages((prev) => [...prev, img]);
          setMessage("Image uploaded");
          resolve(img);
        } catch (err) {
          console.error(err);
          setMessage("Upload failed: " + err.message);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function handleImageAdd() {
    if (!imageMeta.file) {
      setMessage("Please choose an image file first.");
      return;
    }
    try {
      const img = await uploadImageFile(imageMeta);
      insertBlock(
        {
          type: "image",
          image: img,
          caption: imageMeta.caption,
        },
        insertIndex
      );
      setShowImageModal(false);
      setImageMeta({
        file: null,
        filename: "",
        title: "",
        description: "",
        caption: "",
        attribution: "",
      });
    } catch {}
  }

  async function handleFeaturedImageAdd() {
    if (!imageMeta.file) {
      setMessage("Please choose an image file first.");
      return;
    }
    try {
      const img = await uploadImageFile(imageMeta);
      setFeaturedImage(img);
      setShowFeaturedImageModal(false);
      setImageMeta({
        file: null,
        filename: "",
        title: "",
        description: "",
        caption: "",
        attribution: "",
      });
    } catch {}
  }

  /* ---------- Citations ---------- */
  function addCitation() {
    const cite = {
      text: prompt("Short citation text (Author, Title, Year):") || "Untitled",
      url: prompt("Source URL:") || "",
      authors: (prompt("Authors (comma-separated):") || "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      publisher: prompt("Publisher (optional):") || "",
      note: prompt("Note (optional):") || "",
      accessedDate: new Date().toISOString(),
    };
    cite._id = "c_" + Math.random().toString(36).slice(2, 9);
    setCitations((p) => [...p, cite]);
    return cite;
  }

  /* ---------- Save & Publish ---------- */
  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      setMessage("Title is required");
      return;
    }
    setSaving(true);
    setMessage("Saving changes...");

    // Format dates properly for the API
    const formattedResources = {
      ...resources,
      lastReviewed: resources.lastReviewed
        ? new Date(resources.lastReviewed)
        : new Date(),
      books: resources.books.map((book) => ({
        ...book,
        publishedDate: book.publishedDate ? new Date(book.publishedDate) : null,
      })),
      youtubeVideos: resources.youtubeVideos.map((video) => ({
        ...video,
        uploadedDate: video.uploadedDate ? new Date(video.uploadedDate) : null,
      })),
    };

    const payload = {
      id,
      title,
      slug: currentSlug,
      excerpt,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featuredImage,
      images,
      citations,
      sources: citations.map((c) => c.url).filter(Boolean),
      blocks,
      scratchpad, // Add scratchpad to payload
      resources: formattedResources,
      seo: {
        metaTitle: title,
        metaDescription: excerpt,
      },
      researchedBy,
      publishedBy,
      status,
    };

    try {
      const resp = await fetch(`/api/articles/${currentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || "Failed to save changes");
      }
      const article = json.article;
      setId(article._id);
      setTitle(article.title || "");
      setExcerpt(article.excerpt || "");
      setTags((article.tags || []).join(", "));
      setFeaturedImage(article.featuredImage || null);
      setImages(article.images || []);
      setCitations(article.citations || []);
      setBlocks(
        normalizeBlocks(article.blocks, article.images, article.citations)
      );
      setStatus(article.status || status);
      setCurrentSlug(article.slug);
      setResearchedBy(article.researchedBy || researchedBy);
      setPublishedBy(article.publishedBy || publishedBy);
      setScratchpad(article.scratchpad || scratchpad);

      // Update resources from response
      if (article.resources) {
        setResources({
          daysToComplete: article.resources.daysToComplete || 1,
          sites: article.resources.sites || [],
          books: article.resources.books || [],
          youtubeVideos: article.resources.youtubeVideos || [],
          lastReviewed: article.resources.lastReviewed
            ? new Date(article.resources.lastReviewed)
                .toISOString()
                .split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      }

      setMessage("Changes saved");
      if (article.slug && article.slug !== slugParam) {
        router.replace(`/editor/${article.slug}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }, [
    id,
    title,
    currentSlug,
    excerpt,
    tags,
    featuredImage,
    images,
    citations,
    blocks,
    scratchpad, // Add scratchpad to dependencies
    resources,
    researchedBy,
    publishedBy,
    status,
    slugParam,
    router,
  ]);

  const handlePublish = useCallback(async () => {
    if (!id) {
      setMessage("Please save changes before publishing");
      return;
    }
    setMessage("Publishing...");
    try {
      const resp = await fetch("/api/articles/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          publishedBy: publishedBy || researchedBy || "Unknown",
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        throw new Error(json.error || "Publish failed");
      }
      setStatus("published");
      setPublishedBy(json.article?.publishedBy || publishedBy || researchedBy);
      setMessage("Published! Public URL: " + json.url);
    } catch (err) {
      console.error(err);
      setMessage("Publish failed: " + err.message);
    }
  }, [id, publishedBy, researchedBy]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-gray-100 flex items-center justify-center px-4">
        <p className="text-gray-400 text-sm">Loading article...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">🔁</div>
          <h1 className="text-xl font-semibold text-white">
            Unable to load article
          </h1>
          <p className="text-gray-400 text-sm">{loadError}</p>
          <button
            onClick={loadArticle}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 hidden lg:block">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#0f1117]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <Link href="/" className="font-light text-white text-lg">
                SearchThe
                <span className="text-emerald-400 font-medium">Info</span>
              </Link>
              <p className="text-gray-400 text-sm">Editing /{currentSlug}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1 rounded-full text-sm ${
                message.includes("failed")
                  ? "bg-red-500/20 text-red-400"
                  : message
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {message || "Ready"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-emerald-500 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6 sticky top-24">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("content")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "content"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  📝 Content
                </button>
                <button
                  onClick={() => setActiveTab("media")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "media"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  🖼️ Media
                </button>
                <button
                  onClick={() => setActiveTab("citations")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "citations"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  📚 Citations
                </button>
                <button
                  onClick={() => setActiveTab("scratchpad")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "scratchpad"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  📓 Scratchpad
                </button>
                <button
                  onClick={() => setActiveTab("seo")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "seo"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  🔍 SEO
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === "resources"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  📊 Resources
                </button>
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Article Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Blocks</span>
                    <span className="text-white">{blocks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Images</span>
                    <span className="text-white">{images.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Citations</span>
                    <span className="text-white">{citations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scratchpad</span>
                    <span className="text-white">
                      {scratchpad ? `${scratchpad.length} chars` : "Empty"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resources</span>
                    <span className="text-white">
                      {resources.sites.length +
                        resources.books.length +
                        resources.youtubeVideos.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span
                      className={
                        status === "published"
                          ? "text-emerald-400"
                          : "text-yellow-400"
                      }
                    >
                      {status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {activeTab === "content" && (
              <div className="space-y-6">
                {/* Title & Excerpt */}
                <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Research Title
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter the main title of your research..."
                        className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Excerpt / Summary
                      </label>
                      <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Brief summary of your research findings..."
                        rows={3}
                        className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags
                      </label>
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="History, Engineering, Technology, Society..."
                        className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate tags with commas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Blocks */}
                <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-white">
                      Content Structure
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addHeadingBlock()}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-emerald-500 transition-colors"
                      >
                        + Heading
                      </button>
                      <button
                        onClick={() => addTextBlock()}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-emerald-500 transition-colors"
                      >
                        + Text
                      </button>
                      <button
                        onClick={() => {
                          setInsertIndex(blocks.length);
                          setShowImageModal(true);
                        }}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm hover:border-emerald-500 transition-colors"
                      >
                        + Image
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {blocks.map((b, idx) => (
                      <div
                        key={b._id || idx}
                        className="border border-gray-700 rounded-lg p-4 bg-[#0f1117] hover:border-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                              #{idx + 1} • {b.type}
                            </span>
                            {b.type === "heading" && (
                              <select
                                value={b.level ?? 2}
                                onChange={(e) =>
                                  updateBlock(idx, {
                                    level: parseInt(e.target.value, 10),
                                  })
                                }
                                className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
                              >
                                <option value={1}>H1</option>
                                <option value={2}>H2</option>
                                <option value={3}>H3</option>
                              </select>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                insertBlock({ type: "text", content: "" }, idx)
                              }
                              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:border-emerald-500 transition-colors"
                            >
                              Insert Below
                            </button>
                            <button
                              onClick={() => {
                                setInsertIndex(blocks.length);
                                setShowImageModal(true);
                              }}
                              className="text-xs px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:border-emerald-500 transition-colors"
                            >
                              + Image
                            </button>
                            <button
                              onClick={() => removeBlock(idx)}
                              className="text-xs px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:border-red-400 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {b.type === "text" && (
                          <textarea
                            value={b.content}
                            onChange={(e) =>
                              updateBlock(idx, { content: e.target.value })
                            }
                            placeholder="Write your research content here..."
                            className="w-full p-3 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                            rows={6}
                          />
                        )}

                        {b.type === "heading" && (
                          <input
                            value={b.content}
                            onChange={(e) =>
                              updateBlock(idx, { content: e.target.value })
                            }
                            placeholder="Enter heading text..."
                            className={`w-full p-3 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors ${
                              b.level === 1
                                ? "text-2xl font-bold"
                                : b.level === 2
                                ? "text-xl font-semibold"
                                : "text-lg font-medium"
                            }`}
                          />
                        )}

                        {b.type === "image" && (
                          <div className="space-y-3">
                            {b.image?.url ? (
                              <div className="relative">
                                <img
                                  src={b.image.url}
                                  alt=""
                                  className="w-full max-h-96 object-contain rounded border border-gray-700"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
                                  {b.image.title || b.image.filename}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded text-gray-500">
                                No image selected
                              </div>
                            )}
                            <input
                              value={b.caption || ""}
                              onChange={(e) =>
                                updateBlock(idx, { caption: e.target.value })
                              }
                              placeholder="Image caption..."
                              className="w-full p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "media" && (
              <div className="space-y-6">
                {/* Featured Image - Enhanced */}
                <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Featured Image
                    </h3>
                    <button
                      onClick={() => {
                        setShowFeaturedImageModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {featuredImage
                        ? "Edit Featured Image"
                        : "+ Add Featured Image"}
                    </button>
                  </div>

                  {featuredImage ? (
                    <div className="border border-gray-700 rounded-lg p-4 bg-[#0f1117]">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0">
                          <img
                            src={featuredImage.url}
                            alt=""
                            className="w-48 h-32 object-cover rounded border border-gray-700"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Title
                            </label>
                            <p className="text-white">
                              {featuredImage.title || "No title"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Filename
                            </label>
                            <p className="text-gray-400 text-sm">
                              {featuredImage.filename}
                            </p>
                          </div>
                          {featuredImage.description && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Description
                              </label>
                              <p className="text-gray-400 text-sm">
                                {featuredImage.description}
                              </p>
                            </div>
                          )}
                          {featuredImage.caption && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Caption
                              </label>
                              <p className="text-gray-400 text-sm">
                                {featuredImage.caption}
                              </p>
                            </div>
                          )}
                          {featuredImage.attribution && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Attribution
                              </label>
                              <p className="text-gray-400 text-sm">
                                {featuredImage.attribution}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setFeaturedImage(null)}
                          className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-sm hover:border-red-400 transition-colors"
                        >
                          Remove Featured Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded">
                      No featured image selected
                    </div>
                  )}
                </div>

                {/* Image Gallery */}
                <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Image Gallery
                    </h3>
                    <button
                      onClick={() => {
                        setInsertIndex(null);
                        setShowImageModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Add Image
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((im, i) => (
                      <div
                        key={im._id || i}
                        className="border border-gray-700 rounded-lg p-3 bg-[#0f1117]"
                      >
                        <img
                          src={im.url}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <p className="text-xs text-white truncate">
                          {im.title || im.filename}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {im.description}
                        </p>
                      </div>
                    ))}
                    {images.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded">
                        No images in gallery
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "scratchpad" && (
              <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Research Scratchpad
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Write your rough research notes, ideas, and outlines here
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={scratchpad}
                    onChange={(e) => setScratchpad(e.target.value)}
                    placeholder="Start writing your research notes, ideas, outlines, or rough drafts here... This is your private workspace for brainstorming and organizing thoughts before structuring the final article."
                    rows={20}
                    className="w-full p-4 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none font-mono text-sm"
                  />

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div>
                      {scratchpad.length} characters •{" "}
                      {scratchpad.split(/\s+/).filter(Boolean).length} words
                    </div>
                    <div>Last saved: {new Date().toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">
                    Scratchpad Tips
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>
                      • Use this space for rough drafts, research notes, and
                      brainstorming
                    </li>
                    <li>
                      • Organize your thoughts before structuring the final
                      article
                    </li>
                    <li>• Save frequently to avoid losing your work</li>
                    <li>
                      • This content is only visible to you during editing
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "citations" && (
              <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Research Citations
                  </h3>
                  <button
                    onClick={addCitation}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    + Add Citation
                  </button>
                </div>
                <div className="space-y-3">
                  {citations.map((cite, i) => (
                    <div
                      key={cite._id || i}
                      className="border border-gray-700 rounded-lg p-4 bg-[#0f1117]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{cite.text}</h4>
                        <button
                          onClick={() =>
                            setCitations((p) => p.filter((_, idx) => idx !== i))
                          }
                          className="text-xs px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:border-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {cite.url && (
                        <p className="text-sm text-emerald-400 break-all">
                          {cite.url}
                        </p>
                      )}
                      {cite.authors?.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Authors: {cite.authors.join(", ")}
                        </p>
                      )}
                      {cite.publisher && (
                        <p className="text-xs text-gray-400">
                          Publisher: {cite.publisher}
                        </p>
                      )}
                      {cite.note && (
                        <p className="text-xs text-gray-400 mt-1">
                          {cite.note}
                        </p>
                      )}
                    </div>
                  ))}
                  {citations.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded">
                      No citations added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                  SEO Optimization
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {title.length}/60 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {excerpt.length}/160 characters
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">
                      SEO Tips
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>
                        • Include primary keywords in title and first paragraph
                      </li>
                      <li>• Use descriptive headings with H2, H3 tags</li>
                      <li>• Add alt text to all images</li>
                      <li>• Keep meta description under 160 characters</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="bg-[#1a1c23] border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Research Resources
                  </h3>
                  <div className="text-sm text-gray-400">
                    Track your research process and sources
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Days to Complete */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Days Spent on Research
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={resources.daysToComplete}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          daysToComplete: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-32 p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated number of days spent on this research
                    </p>
                  </div>

                  {/* Last Reviewed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Reviewed Date
                    </label>
                    <input
                      type="date"
                      value={resources.lastReviewed}
                      onChange={(e) =>
                        setResources({
                          ...resources,
                          lastReviewed: e.target.value,
                        })
                      }
                      className="w-64 p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When you last verified or reviewed these resources
                    </p>
                  </div>

                  {/* Websites Section */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-medium">
                        Research Websites
                      </h4>
                      <button
                        onClick={() => {
                          const newSite = { name: "", url: "", note: "" };
                          setResources({
                            ...resources,
                            sites: [...resources.sites, newSite],
                          });
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                      >
                        + Add Website
                      </button>
                    </div>

                    <div className="space-y-3">
                      {resources.sites.map((site, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              placeholder="Website name"
                              value={site.name}
                              onChange={(e) => {
                                const newSites = [...resources.sites];
                                newSites[index].name = e.target.value;
                                setResources({ ...resources, sites: newSites });
                              }}
                              className="p-2 bg-[#0f1117] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              placeholder="https://example.com"
                              value={site.url}
                              onChange={(e) => {
                                const newSites = [...resources.sites];
                                newSites[index].url = e.target.value;
                                setResources({ ...resources, sites: newSites });
                              }}
                              className="p-2 bg-[#0f1117] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              placeholder="What was used from this site"
                              value={site.note}
                              onChange={(e) => {
                                const newSites = [...resources.sites];
                                newSites[index].note = e.target.value;
                                setResources({ ...resources, sites: newSites });
                              }}
                              className="p-2 bg-[#0f1117] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newSites = resources.sites.filter(
                                (_, i) => i !== index
                              );
                              setResources({ ...resources, sites: newSites });
                            }}
                            className="px-2 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:border-red-400 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {resources.sites.length === 0 && (
                        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-700 rounded text-sm">
                          No websites added yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Books Section */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-medium">Research Books</h4>
                      <button
                        onClick={() => {
                          const newBook = {
                            title: "",
                            author: "",
                            publisher: "",
                            publishedDate: "",
                            note: "",
                          };
                          setResources({
                            ...resources,
                            books: [...resources.books, newBook],
                          });
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                      >
                        + Add Book
                      </button>
                    </div>

                    <div className="space-y-3">
                      {resources.books.map((book, index) => (
                        <div
                          key={index}
                          className="border border-gray-600 rounded-lg p-3 bg-[#0f1117]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              placeholder="Book Title *"
                              value={book.title}
                              onChange={(e) => {
                                const newBooks = [...resources.books];
                                newBooks[index].title = e.target.value;
                                setResources({ ...resources, books: newBooks });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              placeholder="Author"
                              value={book.author}
                              onChange={(e) => {
                                const newBooks = [...resources.books];
                                newBooks[index].author = e.target.value;
                                setResources({ ...resources, books: newBooks });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <input
                              placeholder="Publisher"
                              value={book.publisher}
                              onChange={(e) => {
                                const newBooks = [...resources.books];
                                newBooks[index].publisher = e.target.value;
                                setResources({ ...resources, books: newBooks });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              type="date"
                              placeholder="Published Date"
                              value={book.publishedDate}
                              onChange={(e) => {
                                const newBooks = [...resources.books];
                                newBooks[index].publishedDate = e.target.value;
                                setResources({ ...resources, books: newBooks });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <button
                              onClick={() => {
                                const newBooks = resources.books.filter(
                                  (_, i) => i !== index
                                );
                                setResources({ ...resources, books: newBooks });
                              }}
                              className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:border-red-400 transition-colors text-sm"
                            >
                              Remove Book
                            </button>
                          </div>
                          <input
                            placeholder="How this book was used in research..."
                            value={book.note}
                            onChange={(e) => {
                              const newBooks = [...resources.books];
                              newBooks[index].note = e.target.value;
                              setResources({ ...resources, books: newBooks });
                            }}
                            className="w-full p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                          />
                        </div>
                      ))}
                      {resources.books.length === 0 && (
                        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-700 rounded text-sm">
                          No books added yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* YouTube Videos Section */}
                  <div className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-medium">YouTube Videos</h4>
                      <button
                        onClick={() => {
                          const newVideo = {
                            title: "",
                            url: "",
                            channel: "",
                            uploadedDate: "",
                            note: "",
                          };
                          setResources({
                            ...resources,
                            youtubeVideos: [
                              ...resources.youtubeVideos,
                              newVideo,
                            ],
                          });
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                      >
                        + Add Video
                      </button>
                    </div>

                    <div className="space-y-3">
                      {resources.youtubeVideos.map((video, index) => (
                        <div
                          key={index}
                          className="border border-gray-600 rounded-lg p-3 bg-[#0f1117]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              placeholder="Video Title"
                              value={video.title}
                              onChange={(e) => {
                                const newVideos = [...resources.youtubeVideos];
                                newVideos[index].title = e.target.value;
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              placeholder="Channel Name"
                              value={video.channel}
                              onChange={(e) => {
                                const newVideos = [...resources.youtubeVideos];
                                newVideos[index].channel = e.target.value;
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              placeholder="https://youtube.com/watch?v=..."
                              value={video.url}
                              onChange={(e) => {
                                const newVideos = [...resources.youtubeVideos];
                                newVideos[index].url = e.target.value;
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <input
                              type="date"
                              placeholder="Uploaded Date"
                              value={video.uploadedDate}
                              onChange={(e) => {
                                const newVideos = [...resources.youtubeVideos];
                                newVideos[index].uploadedDate = e.target.value;
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                          </div>
                          <div className="flex gap-3">
                            <input
                              placeholder="How this video contributed to research..."
                              value={video.note}
                              onChange={(e) => {
                                const newVideos = [...resources.youtubeVideos];
                                newVideos[index].note = e.target.value;
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="flex-1 p-2 bg-[#14161d] border border-gray-700 rounded text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                            />
                            <button
                              onClick={() => {
                                const newVideos =
                                  resources.youtubeVideos.filter(
                                    (_, i) => i !== index
                                  );
                                setResources({
                                  ...resources,
                                  youtubeVideos: newVideos,
                                });
                              }}
                              className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:border-red-400 transition-colors text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {resources.youtubeVideos.length === 0 && (
                        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-700 rounded text-sm">
                          No YouTube videos added yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal for Gallery */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#1a1c23] border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Add Research Image
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image File
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setImageMeta((m) => ({ ...m, file: e.target.files[0] }))
                  }
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filename
                  </label>
                  <input
                    placeholder="research-image.jpg"
                    value={imageMeta.filename}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, filename: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    placeholder="Ancient Roman Aqueduct"
                    value={imageMeta.title}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, title: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Detailed description for accessibility and SEO..."
                  value={imageMeta.description}
                  onChange={(e) =>
                    setImageMeta((m) => ({ ...m, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caption
                  </label>
                  <input
                    placeholder="Display caption for the image"
                    value={imageMeta.caption}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, caption: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attribution
                  </label>
                  <input
                    placeholder="Wikimedia Commons / Author Name"
                    value={imageMeta.attribution}
                    onChange={(e) =>
                      setImageMeta((m) => ({
                        ...m,
                        attribution: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImageAdd}
                disabled={!imageMeta.file}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Research
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Image Modal */}
      {showFeaturedImageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-[#1a1c23] border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {featuredImage ? "Edit Featured Image" : "Add Featured Image"}
              </h3>
              <button
                onClick={() => setShowFeaturedImageModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image File
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setImageMeta((m) => ({ ...m, file: e.target.files[0] }))
                  }
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filename
                  </label>
                  <input
                    placeholder="featured-image.jpg"
                    value={imageMeta.filename}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, filename: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    placeholder="Main Research Image"
                    value={imageMeta.title}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, title: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Detailed description for accessibility and SEO..."
                  value={imageMeta.description}
                  onChange={(e) =>
                    setImageMeta((m) => ({ ...m, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caption
                  </label>
                  <input
                    placeholder="Display caption for the featured image"
                    value={imageMeta.caption}
                    onChange={(e) =>
                      setImageMeta((m) => ({ ...m, caption: e.target.value }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attribution
                  </label>
                  <input
                    placeholder="Wikimedia Commons / Author Name"
                    value={imageMeta.attribution}
                    onChange={(e) =>
                      setImageMeta((m) => ({
                        ...m,
                        attribution: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-[#0f1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={() => setShowFeaturedImageModal(false)}
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFeaturedImageAdd}
                disabled={!imageMeta.file}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {featuredImage
                  ? "Update Featured Image"
                  : "Set as Featured Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
