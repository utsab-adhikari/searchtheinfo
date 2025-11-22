// app/api/articles/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/db/ConnectDB";
import Article from "@/models/articleModel";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

// helper: turn title into a clean URL slug
function makeSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      category,
      slug,
      excerpt,
      tags,
      featuredImage,
      images = [],
      citations = [],
      sources = [],
      resources = {},
      blocks = [],
      seo = {},
      scratchpad,
      researchedBy,
      publishedBy,
      status = "draft",
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    // generate slug automatically if not provided
    const finalSlug = slug ? makeSlug(slug) : makeSlug(title);

    // ensure slug is unique (append a suffix if exists)
    const existing = await Article.findOne({ slug: finalSlug });
    let uniqueSlug = finalSlug;
    if (existing) {
      uniqueSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    // --- Always generate valid ObjectIds server-side ---
    const fixedImages = images.map((img) => ({
      ...img,
      _id: new mongoose.Types.ObjectId(),
    }));

    const fixedCitations = citations.map((c) => ({
      ...c,
      _id: new mongoose.Types.ObjectId(),
    }));

    const fixedBlocks = blocks.map((b) => {
      const block = { ...b, _id: new mongoose.Types.ObjectId() };

      // Link block references correctly
      if (b.image) {
        const found = fixedImages.find((img) => img.url === b.image?.url);
        block.image = found ? found._id : undefined;
      }
      if (b.citation) {
        const found = fixedCitations.find((c) => c.text === b.citation?.text);
        block.citation = found ? found._id : undefined;
      }

      return block;
    });

    // --- Process Resources with proper ObjectId ---
    const processedResources = resources
      ? {
          ...resources,
          _id: new mongoose.Types.ObjectId(),
          // Ensure dates are properly formatted
          lastReviewed: resources.lastReviewed
            ? new Date(resources.lastReviewed)
            : new Date(),
          // Process nested arrays
          sites: (resources.sites || []).map((site) => ({
            ...site,
            // You might want to add _id for sites if needed, but your schema doesn't require it
          })),
          books: (resources.books || []).map((book) => ({
            ...book,
            publishedDate: book.publishedDate
              ? new Date(book.publishedDate)
              : null,
          })),
          youtubeVideos: (resources.youtubeVideos || []).map((video) => ({
            ...video,
            uploadedDate: video.uploadedDate
              ? new Date(video.uploadedDate)
              : null,
          })),
        }
      : null;

    const article = new Article({
      title,
      category,
      slug: uniqueSlug,
      excerpt,
      tags,
      featuredImage,
      images: fixedImages,
      citations: fixedCitations,
      sources,
      blocks: fixedBlocks,
      resources: processedResources, // Add processed resources
      seo,
      scratchpad,
      researchedBy: session.user.id,
      publishedBy,
      status,
      publishedAt: status === "published" ? new Date() : null,
    });

    await article.save();

    return NextResponse.json({ success: true, article });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
