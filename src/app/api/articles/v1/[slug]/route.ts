import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import Category from "@/models/categoryModel";
import { Article, Reference } from "@/models/v1/articleModelV1"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";
import { withApiTiming } from "@/lib/monitoring/apiTimer";
import { withDbTiming } from "@/lib/monitoring/dbTimer";


interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface ArticleWithPopulated {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  abstract: string;
  keywords: string[];
  status: string;

  category: {
    _id: Types.ObjectId;
    title: string;
    description?: string;
  };

  authors: any[];
  sections: any[];

  references: any[];
  resources: any[];

  scratchPad?: string;
  notes?: string;

  createdBy: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

interface UpdateArticleRequest {
  title?: string;
  abstract?: string;
  keywords?: string[];
  status?: "draft" | "in-review" | "published" | "archived";
  scratchPad?: string;
  notes?: string;
  sections?: any[];
  references?: any[];
  resources?: any[];
}

interface SuccessResponse {
  success: true;
}

interface ErrorResponse {
  success: false;
  message: string;
}


function isValidObjectId(id: any): boolean {
  return typeof id === "string" && Types.ObjectId.isValid(id);
}

function sanitizeBlocks(blocks: any[] | undefined) {
  if (!Array.isArray(blocks)) return undefined;
  return blocks.map((b) => {
    const copy: any = { ...b };
    if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
    
    // Sanitize links
    if (Array.isArray(copy.links)) {
      copy.links = copy.links.map((link: any) => ({
        text: String(link.text || "").trim(),
        url: String(link.url || "").trim(),
      })).filter((link: any) => link.text && link.url);
      if (copy.links.length === 0) delete copy.links;
    }
    
    return copy;
  });
}

function sanitizeSections(sections: any[] | undefined) {
  if (!Array.isArray(sections)) return undefined;
  return sections.map((s, idx) => {
    const copy: any = { ...s };
    if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
    // sanitize blocks
    copy.blocks = sanitizeBlocks(copy.blocks);
    // support legacy "subsections" key by mapping to children
    const childArray = Array.isArray(copy.children)
      ? copy.children
      : Array.isArray(copy.subsections)
      ? copy.subsections
      : undefined;
    if (childArray) {
      copy.children = sanitizeSections(childArray);
      delete copy.subsections;
    }
    // ensure order is numeric
    if (typeof copy.order !== "number") copy.order = idx;
    return copy;
  });
}

async function normalizeReferences(input: any[] | undefined) {
  if (!Array.isArray(input)) return undefined;

  const ids: Types.ObjectId[] = [];

  for (const ref of input) {
    // If it's already an ObjectId string, keep it
    if (typeof ref === "string" && isValidObjectId(ref)) {
      ids.push(new Types.ObjectId(ref));
      continue;
    }

    // If it looks like an object with _id
    if (ref && typeof ref === "object" && ref._id && isValidObjectId(ref._id)) {
      ids.push(new Types.ObjectId(ref._id));
      continue;
    }

    // If it's a full reference object, create (or reuse) a Reference document
    if (ref && typeof ref === "object" && ref.title) {
      const doc = await Reference.create({
        title: String(ref.title).trim(),
        authors: ref.authors ? String(ref.authors).trim() : undefined,
        publisher: ref.publisher ? String(ref.publisher).trim() : undefined,
        year: typeof ref.year === "number" ? ref.year : undefined,
        journal: ref.journal ? String(ref.journal).trim() : undefined,
        volume: ref.volume ? String(ref.volume).trim() : undefined,
        issue: ref.issue ? String(ref.issue).trim() : undefined,
        pages: ref.pages ? String(ref.pages).trim() : undefined,
        doi: ref.doi ? String(ref.doi).trim() : undefined,
        url: ref.url ? String(ref.url).trim() : undefined,
        accessedAt: ref.accessedAt ? new Date(ref.accessedAt) : undefined,
      });
      ids.push(doc._id);
      continue;
    }
  }

  return ids;
}

async function getArticle(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: true; article: ArticleWithPopulated } | ErrorResponse>> {
  try {
    const { slug } = await params;

    await connectDB();

    const article = await withDbTiming("articles-v1-get-by-slug", () =>
      Article.findOne({ slug })
        .populate("createdBy", "name email")
        .populate("category", "title description")
        .populate("references")
        .lean<ArticleWithPopulated>()
    );

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("❌ Error fetching article (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function putArticle(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: true; article: any } | ErrorResponse>> {
  try {
    const { slug } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = (await req.json()) as UpdateArticleRequest;

    await connectDB();

    const article = await Article.findOne({ slug });
    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    // Ownership / Admin check
    if (
      article.createdBy.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Build update object with proper $set and $push operators
    const setFields: any = {};

    if (typeof data.title === "string") {
      setFields.title = data.title.trim();
    }

    if (typeof data.abstract === "string") {
      setFields.abstract = data.abstract.trim();
    }

    if (Array.isArray(data.keywords)) {
      setFields.keywords = data.keywords.map((k) => k.trim());
    }

    if (
      data.status &&
      ["draft", "in-review", "published", "archived"].includes(data.status)
    ) {
      setFields.status = data.status;
    }

    if (typeof data.scratchPad === "string") {
      setFields.scratchPad = data.scratchPad;
    }

    if (typeof data.notes === "string") {
      setFields.notes = data.notes;
    }

    if (Array.isArray(data.sections)) {
      const sanitized = sanitizeSections(data.sections);
      if (sanitized) {
        setFields.sections = sanitized;
      }
    }

    if (Array.isArray(data.references)) {
      const refs = await normalizeReferences(data.references);
      if (refs && refs.length >= 0) {
        setFields.references = refs;
      }
    }

    if (Array.isArray(data.resources)) {
      // strip invalid _id on resources
      setFields.resources = data.resources.map((r: any) => {
        const copy = { ...r };
        if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
        return copy;
      });
    }

    const updateFields: any = { $set: setFields };

    // Add revision log entry
    updateFields.$push = {
      revisions: {
        editedBy: new Types.ObjectId(session.user.id),
        editedAt: new Date(),
        summary: "Updated article",
      }
    };
    
    const updated = await Article.findOneAndUpdate(
      { slug },
      updateFields,
      { new: true, lean: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, article: updated });
  } catch (error) {
    console.error("❌ Error updating article (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteArticle(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { slug } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const article = await Article.findOne({ slug });
    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    if (
      article.createdBy.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await article.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting article (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withApiTiming<RouteParams>("articles-v1-get", getArticle);
export const PUT = withApiTiming<RouteParams>("articles-v1-put", putArticle);
export const DELETE = withApiTiming<RouteParams>("articles-v1-delete", deleteArticle);
