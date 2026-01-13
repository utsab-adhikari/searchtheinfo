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
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const copy: any = { ...b };
    if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
    return copy;
  });
}

function sanitizeSections(sections: any[] | undefined) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s, idx) => {
    const copy: any = { ...s };
    if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
    // sanitize blocks
    copy.blocks = sanitizeBlocks(copy.blocks);
    // sanitize nested subsections recursively
    if (Array.isArray(copy.subsections)) {
      copy.subsections = sanitizeSections(copy.subsections);
    } else {
      copy.subsections = [];
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
      .populate("category", "title description")
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
): Promise<NextResponse<{ success: true } | ErrorResponse>> {
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



    if (typeof data.title === "string") {
      article.title = data.title.trim();
    }

    if (typeof data.abstract === "string") {
      article.abstract = data.abstract.trim();
    }

    if (Array.isArray(data.keywords)) {
      article.keywords = data.keywords.map((k) => k.trim());
    }

    if (
      data.status &&
      ["draft", "in-review", "published", "archived"].includes(data.status)
    ) {
      article.status = data.status;
    }

    if (typeof data.scratchPad === "string") {
      article.scratchPad = data.scratchPad;
    }

    if (typeof data.notes === "string") {
      article.notes = data.notes;
    }

    if (Array.isArray(data.sections)) {
      article.sections = sanitizeSections(data.sections);
    }

    if (Array.isArray(data.references)) {
      // strip invalid _id on references
      article.references = data.references.map((r: any) => {
        const copy = { ...r };
        if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
        return copy;
      });
    }

    if (Array.isArray(data.resources)) {
      // strip invalid _id on resources
      article.resources = data.resources.map((r: any) => {
        const copy = { ...r };
        if (copy._id && !isValidObjectId(copy._id)) delete copy._id;
        return copy;
      });
    }

    // Revision log
    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Updated article",
    });

    await article.save();

    // Return the updated article for client-side sync
    const updated = await Article.findById(article._id).lean();
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
