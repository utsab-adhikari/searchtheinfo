import { NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2"; 

interface RouteParams {
  params: { slug: string };
}

interface SuccessResponse {
  success: true;
  views: number;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export async function PATCH(
  req: Request,
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
  } catch (error) {
    console.error("❌ Error incrementing views (v2):", error);
    return NextResponse.json(
      { success: false, message: "Failed to update views" },
      { status: 500 }
    );
  }
}
