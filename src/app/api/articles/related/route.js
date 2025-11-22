import connectDB from "@/db/ConnectDB";
import { NextResponse } from "next/server";
import Article from "@/models/articleModel";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const tags = searchParams.get("tags")?.split(",") || [];
    const exclude = searchParams.get("exclude");

    if (tags.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const articles = await Article.find({
      status: "published",
      slug: { $ne: exclude },
      tags: { $in: tags },
    })
      .select("title slug excerpt readingTime publishedAt featuredImage")
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();

    const transformedArticles = articles.map((article) => ({
      ...article,
      _id: article._id.toString(),
      publishedAt: article.publishedAt?.toISOString(),
    }));

    return NextResponse.json({ articles: transformedArticles });
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return NextResponse.json({ articles: [] });
  }
}
