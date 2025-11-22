import connectDB from "@/db/ConnectDB";
import Article from "@/models/articleModel";
import { NextResponse } from "next/server";
import Category from "@/models/categoryModel"

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 6;
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    // Build query
    const query = { status: "published" };

    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (page - 1) * limit;

    const articles = await Article.find(query)
      .populate("category", "name slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Article.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Transform articles for minimal frontend
    const minimalArticles = articles.map((article) => ({
      _id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      tags: article.tags || [],
      publishedAt: article.publishedAt?.toISOString(),
      category: article.category
        ? { _id: article.category._id.toString(), name: article.category.name }
        : null,
    }));

    return NextResponse.json(
      {
        articles: minimalArticles,
        pagination: { page, limit, total, totalPages },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
