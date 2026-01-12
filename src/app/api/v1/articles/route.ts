import connectDB from "@/database/connectDB";
import Article, { IArticle } from "@/models/v1/articleModelV1";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Types } from "mongoose";

interface CreateArticleRequest {
  title: string;
  slug: string;
  abstract: string;
  category: string;
  keywords?: string[];
}

interface ArticleResponse {
  success: boolean;
  article: IArticle;
}

interface ArticlesListResponse {
  articles: Array<{
    _id: Types.ObjectId;
    title: string;
    slug: string;
    status: string;
    createdAt: Date;
    category?: {
      _id: Types.ObjectId;
      title: string;
    };
  }>;
}

interface ErrorResponse {
  message: string;
}

export async function POST(req: Request): Promise<NextResponse<ArticleResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Partial<CreateArticleRequest>;
    const { title, slug, abstract, category, keywords } = body;

    if (!title || !slug || !abstract || !category)
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    await connectDB();

    const existing = await Article.findOne({ slug });
    if (existing)
      return NextResponse.json({ message: "Slug already exists" }, { status: 400 });

    const article = await Article.create({
      title,
      slug,
      abstract,
      category,
      keywords: keywords || [],
      createdBy: session.user.id,
      authors: [
        {
          name: session.user.name || "Unknown",
          email: session.user.email || undefined,
        },
      ],
      status: "draft",
    });

    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ message: "Error creating article" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse<ArticlesListResponse | ErrorResponse>> {
  try {
    await connectDB();
    const articles = await Article.find()
      .populate("category", "title")
      .select("title slug status createdAt")
      .lean();

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ message: "Error fetching articles" }, { status: 500 });
  }
}

