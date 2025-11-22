import connectDB from "@/db/ConnectDB";
import Article from "@/models/articleModel";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { slug } = await params;
    const { viewerId, ipAddress } = await request.json();

    const article = await Article.findOne({ slug: slug });

    if (!article) {
      return NextResponse.json({
        success: false,
        status: 404,
        message: "Article not found",
      });
    }

    article.views.push({
      viewerId: viewerId || null,
      ipAddress: ipAddress || "unknown",
      viewedAt: new Date(),
    });

    await article.save();

    return NextResponse.json({
      success: true,
      status: 200,
      message: "View recorded successfully",
    });
  } catch (error) {
    console.error("View recording error:", error);
    return NextResponse.json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
}
