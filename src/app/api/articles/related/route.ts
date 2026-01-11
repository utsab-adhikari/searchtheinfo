import { NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article } from "@/models";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const tagsParam = searchParams.get("tags");
    const excludeSlug = searchParams.get("exclude");
    const limitParam = searchParams.get("limit");

    const limit = Math.min(Number(limitParam) || 4, 10);
    const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (tags.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const query: Record<string, any> = {
      status: "published",
      tags: { $in: tags },
    };

    if (excludeSlug) {
      query.slug = { $ne: excludeSlug };
    }

    const articles = await Article.find(query)
      .populate("category", "name title")
      .populate("researchedBy", "name")
      .select("title slug excerpt description readingTime tags publishedAt createdAt")
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ articles });
  } catch (error: any) {
    console.error("Error fetching related articles:", error);
    return NextResponse.json(
      { message: "Failed to fetch related articles", articles: [] },
      { status: 500 }
    );
  }
}
