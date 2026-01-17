import connectDB from "@/database/connectDB";
import { Article } from "@/models/v1/articleModelV1";
import Category from "@/models/categoryModel";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Types } from "mongoose";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";
import { withDbTiming } from "@/lib/monitoring/dbTimer";

interface CreateArticleRequest {
  title: string;
  slug: string;
  abstract: string;
  category: string;
  keywords?: string[];
}

interface ArticleListItem {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  status: string;
  createdAt: Date;
  category?: {
    _id: Types.ObjectId;
    title: string;
  };
}

interface CreateArticleResponse {
  success: true;
  articleId: Types.ObjectId;
}

interface ArticlesListResponse {
  success: true;
  articles: ArticleListItem[];
}

interface ErrorResponse {
  success: false;
  message: string;
}

async function handlePost(
  req: NextRequest
): Promise<NextResponse<CreateArticleResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Partial<CreateArticleRequest>;
    const { title, slug, abstract, category, keywords } = body;

    if (!title || !slug || !abstract || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await withDbTiming("articles-v1-find-by-slug", () =>
      Article.findOne({ slug }).lean()
    );
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Slug already exists" },
        { status: 409 }
      );
    }

    const article = await Article.create({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      abstract: abstract.trim(),
      category: new Types.ObjectId(category),
      keywords: keywords || [],

      authors: [
        {
          name: session.user.name || "Unknown",
          email: session.user.email || undefined,
        },
      ],

      sections: [],
      references: [],
      resources: [],

      status: "draft",
      createdBy: new Types.ObjectId(session.user.id),
    });

    return NextResponse.json(
      { success: true, articleId: article._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating article (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleGet(): Promise<
  NextResponse<ArticlesListResponse | ErrorResponse>
> {
  try {
    await connectDB();

    const articles = await withDbTiming("articles-v1-list", () =>
      Article.find()
        .select("title slug status createdAt category")
        .sort({ createdAt: -1 })
        .lean<ArticleListItem[]>()
    );

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error("❌ Error fetching articles (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withApiTimingSimple("articles-v1-create", handlePost);
export const GET = withApiTimingSimple("articles-v1-list", handleGet);
