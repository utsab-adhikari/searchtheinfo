import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import { Article, ScratchPad, Block, Note, Resource, View } from "@/models";
import Image from "@/models/imageModel";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connectDB();
  const { slug } = await params;

  const article = await Article.findOne({ slug })
    .populate("category")
    .populate("resources")
    .populate("featuredImage")
    .populate("researchedBy", "name email")
    .exec();

  if (!article) return NextResponse.json({ message: "Not Found" }, { status: 404 });

  const scratchPad = await ScratchPad.findOne({ article: article._id });

  const viewStats = await View.aggregate([
    { $match: { article: article._id } },
    { $group: { _id: null, total: { $sum: "$count" } } },
  ]);
  const viewCount = viewStats[0]?.total ?? 0;

  const articleObj = (typeof (article as any).toObject === 'function')
    ? (article as any).toObject()
    : JSON.parse(JSON.stringify(article));

  return NextResponse.json({
    data: {
      ...articleObj,
      viewCount,
      scratchpad: scratchPad?.text || "",
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { type, payload } = body; // 'type' tells us which tab is saving

  const { slug } = await params;
  const article = await Article.findOne({ slug });
  if (!article) return NextResponse.json({ message: "Article not found" }, { status: 404 });

  try {
    switch (type) {
      case "METADATA": // Tab 1
        {
          let featuredImageId = null;
          if (payload.featuredImage && typeof payload.featuredImage === 'object') {
            // Create or update image document
            if (payload.featuredImage.url) {
              let imageDoc = await Image.findOne({ url: payload.featuredImage.url });
              if (!imageDoc) {
                imageDoc = await Image.create(payload.featuredImage);
                featuredImageId = imageDoc._id;
              } else {
                // Update the existing image document and get the updated version
                await Image.updateOne({ _id: imageDoc._id }, {
                  $set: {
                    title: payload.featuredImage.title || imageDoc.title,
                    description: payload.featuredImage.description,
                    caption: payload.featuredImage.caption,
                    attribution: payload.featuredImage.attribution,
                  }
                });
                featuredImageId = imageDoc._id;
              }
            }
          }
          
          const updateData: any = {
            title: payload.title,
            excerpt: payload.excerpt,
            tags: payload.tags,
            category: payload.category,
            featuredImage: featuredImageId,
          };
          
          // Handle status change (publish/unpublish)
          if (payload.status) {
            updateData.status = payload.status;
            if (payload.status === 'published' && !article.publishedAt) {
              updateData.publishedAt = new Date();
              updateData.publishedBy = (session.user as any)?.id;
            }
          }
          
          await Article.findByIdAndUpdate(article._id, updateData);
        }
        break;
      
      case "CONTENT": // Tab 2: Handling blocks
        // Sanitize blocks to remove client-side ephemeral IDs
        const sanitizedBlocks = Array.isArray(payload)
          ? payload.map((b: any) => ({
              type: b.type ?? 'text',
              content: b.content ?? undefined,
              level: b.level ?? undefined,
              image: b.image ?? undefined,
              caption: b.caption ?? undefined,
              code: b.code ?? undefined,
              language: b.language ?? undefined,
              citation: b.citation ?? undefined,
              items: Array.isArray(b.items) ? b.items : undefined,
              note: b.note ?? undefined,
            }))
          : [];
        await Article.findByIdAndUpdate(article._id, { blocks: sanitizedBlocks });
        break;

      case "SCRATCHPAD": // Tab 5
        await ScratchPad.findOneAndUpdate(
          { article: article._id },
          { $set: { text: payload.text }, $setOnInsert: { article: article._id } },
          { upsert: true }
        );
        break;

      case "FULL_UPDATE": {
        let featuredImageId = null;
        if (payload.featuredImage && typeof payload.featuredImage === 'object') {
          if (payload.featuredImage.url) {
            let imageDoc = await Image.findOne({ url: payload.featuredImage.url });
            if (!imageDoc) {
              imageDoc = await Image.create(payload.featuredImage);
              featuredImageId = imageDoc._id;
            } else {
              // Update the existing image document and get the updated version
              await Image.updateOne({ _id: imageDoc._id }, {
                $set: {
                  title: payload.featuredImage.title || imageDoc.title,
                  description: payload.featuredImage.description,
                  caption: payload.featuredImage.caption,
                  attribution: payload.featuredImage.attribution,
                }
              });
              featuredImageId = imageDoc._id;
            }
          }
        }

        // Handle resources - create a single resource document if needed
        let resourceId = null;
        if (payload.resources && typeof payload.resources === 'object') {
          if (payload.resources.daysToComplete || payload.resources.sites?.length || payload.resources.books?.length || payload.resources.youtubeVideos?.length) {
            // Sanitize resources data
            const sanitizedResources = {
              article: article._id,
              daysToComplete: payload.resources.daysToComplete ?? 1,
              lastReviewed: payload.resources.lastReviewed ?? new Date().toISOString().split('T')[0],
              sites: Array.isArray(payload.resources.sites)
                ? payload.resources.sites.map((s: any) => ({
                    name: s.name ?? '',
                    url: s.url ?? '',
                    note: s.note ?? undefined,
                  }))
                : [],
              books: Array.isArray(payload.resources.books)
                ? payload.resources.books.map((b: any) => ({
                    title: b.title ?? '',
                    author: b.author ?? '',
                    publisher: b.publisher ?? undefined,
                    publishedDate: b.publishedDate ?? undefined,
                    note: b.note ?? undefined,
                  }))
                : [],
              youtubeVideos: Array.isArray(payload.resources.youtubeVideos)
                ? payload.resources.youtubeVideos.map((v: any) => ({
                    title: v.title ?? '',
                    url: v.url ?? '',
                    channel: v.channel ?? '',
                    uploadedDate: v.uploadedDate ?? undefined,
                    note: v.note ?? undefined,
                  }))
                : [],
            };

            let resourceDoc = await Resource.findOne({ article: article._id });
            if (!resourceDoc) {
              resourceDoc = await Resource.create(sanitizedResources);
            } else {
              await Resource.updateOne({ _id: resourceDoc._id }, sanitizedResources);
            }
            resourceId = resourceDoc._id;
          }
        }

        // Sanitize embedded arrays to avoid client-side ephemeral IDs
        const sanitizedBlocks = Array.isArray(payload.blocks)
          ? payload.blocks.map((b: any) => ({
              type: b.type ?? 'text',
              content: b.content ?? undefined,
              level: b.level ?? undefined,
              image: b.image ?? undefined,
              caption: b.caption ?? undefined,
              code: b.code ?? undefined,
              language: b.language ?? undefined,
              citation: b.citation ?? undefined,
              items: Array.isArray(b.items) ? b.items : undefined,
              note: b.note ?? undefined,
            }))
          : [];

        const sanitizedNotes = Array.isArray(payload.notes)
          ? payload.notes.map((n: any) => ({
              title: n.title ?? '',
              content: n.content ?? '',
              tags: Array.isArray(n.tags) ? n.tags : [],
              priority: n.priority ?? 'low',
              createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
              updatedAt: n.updatedAt ? new Date(n.updatedAt) : new Date(),
            }))
          : [];

        const sanitizedCitations = Array.isArray(payload.citations)
          ? payload.citations.map((c: any) => ({
              text: c.text ?? '',
              url: c.url ?? undefined,
              authors: Array.isArray(c.authors) ? c.authors : [],
              publisher: c.publisher ?? undefined,
              publishDate: c.publishDate ? new Date(c.publishDate) : undefined,
              accessedDate: c.accessedDate ? new Date(c.accessedDate) : undefined,
              note: c.note ?? undefined,
            }))
          : [];

        await Article.findByIdAndUpdate(article._id, {
          title: payload.title,
          excerpt: payload.excerpt,
          tags: payload.tags,
          category: payload.category,
          blocks: sanitizedBlocks,
          featuredImage: featuredImageId,
          citations: sanitizedCitations,
          notes: sanitizedNotes,
          resources: resourceId,
        });

        await ScratchPad.findOneAndUpdate(
          { article: article._id },
          { $set: { text: payload.scratchpad }, $setOnInsert: { article: article._id } },
          { upsert: true }
        );
        break;
      }

      default:
        return NextResponse.json({ message: "Invalid update type" }, { status: 400 });
    }

    return NextResponse.json({ message: "Draft updated successfully" });
  } catch (error: any) {
    console.error("Error updating article:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}