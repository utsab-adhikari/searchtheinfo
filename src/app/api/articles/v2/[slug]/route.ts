import { NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";


interface RouteParams {
  params: { slug: string };
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

export async function GET(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<{ success: true; article: ArticleWithPopulated } | ErrorResponse>> {
  try {
    const { slug } = await params;

    await connectDB();

    const article = await Article.findOne({ slug })
      .populate("createdBy", "name email")
      .populate("references") 
      .lean<ArticleWithPopulated>();

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

export async function PUT(
  req: Request,
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
      // strip invalid _id on references
      setFields.references = data.references.map((r: any) => {
        const copy = { ...r };
        if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
        return copy;
      });
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

export async function DELETE(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { slug } = params;

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
