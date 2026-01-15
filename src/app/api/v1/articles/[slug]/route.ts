import { NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import Article, { IArticle } from "@/models/v1/articleModelV1";
import Category from "@/models/categoryModel";
import User from "@/models/userModel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Types } from "mongoose";

interface RouteParams {
  params: { slug: string };
}

interface ArticleWithPopulated extends Omit<IArticle, 'category' | 'createdBy'> {
  category: {
    _id: Types.ObjectId;
    title: string;
    description?: string;
  };
  createdBy: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
}

interface ArticleResponse {
  article: ArticleWithPopulated;
}

interface SuccessResponse {
  success: boolean;
  article?: IArticle;
}

interface ErrorResponse {
  message: string;
}

interface UpdateArticleRequest extends Partial<IArticle> {
  title?: string;
  abstract?: string;
  keywords?: string[];
}

function isValidObjectIdString(id: any): id is string {
  return typeof id === "string" && Types.ObjectId.isValid(id);
}

function sanitizeCitations(citations: any): Types.ObjectId[] | undefined {
  if (!Array.isArray(citations)) return undefined;
  const filtered = citations
    .filter((c) => isValidObjectIdString(c))
    .map((c) => new Types.ObjectId(c));
  return filtered;
}

function sanitizeBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const bb = { ...b };

    // If subdoc _id is invalid or client-generated, remove it to let Mongoose assign a fresh ObjectId
    if (!isValidObjectIdString(bb._id)) delete bb._id;

    // Citations must be valid ObjectIds only
    const cleanCitations = sanitizeCitations(bb.citations);
    if (cleanCitations) bb.citations = cleanCitations;

    return bb;
  });
}

function sanitizeSections(sections: any[]): any[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => {
    const sec = { ...s };
    if (!isValidObjectIdString(sec._id)) delete sec._id;

    // Ensure blocks are sanitized
    if (Array.isArray(sec.blocks)) {
      sec.blocks = sanitizeBlocks(sec.blocks);
    } else {
      sec.blocks = [];
    }
    return sec;
  });
}

function sanitizeSimpleSubdocs(arr: any[]): any[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    const copy = { ...item };
    if (!isValidObjectIdString(copy._id)) delete copy._id;
    return copy;
  });
}

export async function PUT(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const data = (await req.json()) as UpdateArticleRequest;

    await connectDB();

    const article = await Article.findOne({ slug });
    if (!article)
      return NextResponse.json({ message: "Article not found" }, { status: 404 });

    // Ownership check
    if (
      article.createdBy.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Assign only allowed fields, with sanitization for nested arrays
    if (typeof data.title === "string") article.title = data.title;
    if (typeof data.abstract === "string") article.abstract = data.abstract;
    if (Array.isArray(data.keywords)) article.keywords = data.keywords;

    if (Array.isArray(data.sections)) {
      article.sections = sanitizeSections(data.sections);
    }

    if (Array.isArray(data.references)) {
      article.references = sanitizeSimpleSubdocs(data.references);
    }

    if (Array.isArray(data.resources)) {
      article.resources = sanitizeSimpleSubdocs(data.resources);
    }

    if (typeof data.scratchPad === "string") article.scratchPad = data.scratchPad;
    if (typeof data.notes === "string") article.notes = data.notes;

    if (data.status && ["draft", "in-review", "published", "archived"].includes(data.status)) {
      article.status = data.status;
    }

    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Updated article content",
    });

    await article.save();

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ message: "Error updating article" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<ArticleResponse | ErrorResponse>> {
  try {
    const {slug} = await params;
    await connectDB();

    const article = await Article.findOne({ slug: slug })
      .populate("category", "title description")
      .lean();

    if (!article)
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );

    return NextResponse.json({ article: article as unknown as ArticleWithPopulated });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { message: "Error fetching article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const article = await Article.findOne({ slug: params.slug });
    if (!article)
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );

    if (
      article.createdBy.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await article.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { message: "Error deleting article" },
      { status: 500 }
    );
  }
}
