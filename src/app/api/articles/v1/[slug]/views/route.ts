import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v1/articleModelV1"; 
import { withApiTiming } from "@/lib/monitoring/apiTimer";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface SuccessResponse {
  success: true;
  views: number;
}

interface ErrorResponse {
  success: false;
  message: string;
}

async function patchViews(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { slug } = await params;

    await connectDB();

    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true, select: "views" }
    ).lean<{ views: number }>();

    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      views: article.views,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error incrementing views (v2):", message);
    return NextResponse.json(
      { success: false, message: "Failed to update views" },
      { status: 500 }
    );
  }
}

export const PATCH = withApiTiming<RouteParams>(
  "articles-v1-views-patch",
  patchViews
);
