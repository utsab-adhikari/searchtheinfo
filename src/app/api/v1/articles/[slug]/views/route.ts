import { NextResponse } from "next/server";
import Article from "@/models/v1/articleModelV1";
import connectDB from "@/database/connectDB";

export async function PATCH(
  req: Request,
  context: { params: { slug: string } }
) {
  try {
    const { slug } = await context.params;
    await connectDB();

    // Increment views
    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!article) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: article.views });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json({ message: "Failed to update views" }, { status: 500 });
  }
}