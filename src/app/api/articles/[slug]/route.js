import connectDB from "@/db/ConnectDB";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Article from "@/models/articleModel";
import Category from "@/models/categoryModel";
import User from "@/models/userModel"

function makeSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializeArticle(rawArticle) {
  if (!rawArticle) return null;

  const article = { ...rawArticle };

  const images = (article.images || []).map((img) => ({
    ...img,
    _id: img._id?.toString(),
  }));

  const imageMap = new Map(images.map((img) => [img._id, img]));

  const citations = (article.citations || []).map((cite) => ({
    ...cite,
    _id: cite._id?.toString(),
    publishedDate: cite.publishedDate
      ? new Date(cite.publishedDate).toISOString()
      : null,
    accessedDate: cite.accessedDate
      ? new Date(cite.accessedDate).toISOString()
      : null,
  }));

  const citationMap = new Map(citations.map((cite) => [cite._id, cite]));

  const blocks = (article.blocks || []).map((block) => {
    const serializedBlock = {
      ...block,
      _id: block._id?.toString(),
    };

    if (block.image) {
      const imageKey =
        typeof block.image === "string"
          ? block.image
          : block.image._id?.toString?.() ?? block.image._id;
      const fallbackImage =
        typeof block.image === "object" ? block.image : null;
      serializedBlock.image = imageMap.get(imageKey) || fallbackImage;
    }

    if (block.citation) {
      const citationKey =
        typeof block.citation === "string"
          ? block.citation
          : block.citation._id?.toString?.() ?? block.citation._id;
      const fallbackCitation =
        typeof block.citation === "object" ? block.citation : null;
      serializedBlock.citation =
        citationMap.get(citationKey) || fallbackCitation;
    }

    return serializedBlock;
  });

  const featuredImage = article.featuredImage
    ? {
        ...article.featuredImage,
        _id: article.featuredImage._id?.toString(),
      }
    : null;

  return {
    ...article,
    _id: article._id?.toString(),
    createdAt: article.createdAt
      ? new Date(article.createdAt).toISOString()
      : null,
    updatedAt: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : null,
    publishedAt: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : null,
    featuredImage,
    images,
    citations,
    blocks,
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { slug } = await params;
    const includeDrafts =
      request.nextUrl?.searchParams?.get("includeDrafts") === "true";

    // Find published article by slug and populate necessary fields
    const query = includeDrafts ? { slug } : { slug };
    const article = await Article.findOne(query)
      .populate("publishedBy", "name email")
      .populate("researchedBy", "name email")
      .populate("category", "name")
      .lean();

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const transformedArticle = serializeArticle(article);

    return NextResponse.json({ article: transformedArticle });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { slug: currentSlug } = await params;
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      tags = [],
      featuredImage,
      images = [],
      citations = [],
      sources = [],
      blocks = [],
      resources, // ✅ added
      seo = {},
      scratchpad,
      researchedBy,
      status,
      category,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    const article = await Article.findOne({ slug: currentSlug });
    if (!article) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    // Generate or validate slug
    const desiredSlug = slug ? makeSlug(slug) : makeSlug(title);
    let finalSlug = desiredSlug;
    if (desiredSlug !== article.slug) {
      const exists = await Article.findOne({
        slug: desiredSlug,
        _id: { $ne: article._id },
      });
      if (exists) {
        finalSlug = `${desiredSlug}-${Date.now().toString(36)}`;
      }
    }

    // ✅ Normalize resources safely
    const normalizedResources = resources
      ? {
          daysToComplete: resources.daysToComplete ?? 1,
          sites: resources.sites || [],
          books: (resources.books || []).map((b) => ({
            ...b,
            publishedDate: b.publishedDate ? new Date(b.publishedDate) : null,
          })),
          youtubeVideos: (resources.youtubeVideos || []).map((v) => ({
            ...v,
            uploadedDate: v.uploadedDate ? new Date(v.uploadedDate) : null,
          })),
          lastReviewed: resources.lastReviewed
            ? new Date(resources.lastReviewed)
            : new Date(),
        }
      : article.resources || {};

    // ✅ Normalize tags
    const normalizedTags = Array.isArray(tags)
      ? tags.map((t) => t.trim())
      : String(tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    // ✅ Apply updates
    article.title = title;
    article.slug = finalSlug;
    article.excerpt = excerpt;
    article.tags = normalizedTags;
    article.featuredImage = featuredImage || null;
    article.images = images || [];
    article.citations = citations || [];
    article.sources = sources.length
      ? sources
      : (citations || []).map((c) => c.url).filter(Boolean);
    article.blocks = blocks || [];
    article.resources = normalizedResources;
    article.seo = { ...article.seo, ...seo };
    article.scratchpad = scratchpad || article.scratchpad;
    if (researchedBy !== undefined) article.researchedBy = researchedBy;
    if (category) article.category = category;

    // ✅ Handle status changes
    const prevStatus = article.status;
    const nextStatus = status ?? prevStatus;
    article.status = nextStatus;

    if (nextStatus === "published") {
      article.publishedAt = article.publishedAt || new Date();
    } else if (prevStatus === "published" && nextStatus !== "published") {
      article.publishedAt = null;
    }

    await article.save();

    const updated = await Article.findById(article._id)
      .populate("category", "name")
      .populate("publishedBy", "name email")
      .populate("researchedBy", "name email")
      .lean();

    return NextResponse.json({ success: true, article: updated });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { slug: currentSlug } = await params;

    const article = await Article.findOne({ slug: currentSlug });
    if (!article) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    await Article.deleteOne({ _id: article._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
