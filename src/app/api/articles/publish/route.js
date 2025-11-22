// app/api/articles/publish/route.js
import { NextResponse } from "next/server";
import connectDB from "@/db/ConnectDB";
import Article from "@/models/articleModel";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id, publishedBy } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.title || !article.blocks?.length) {
      return NextResponse.json(
        { error: "Incomplete article content" },
        { status: 400 }
      );
    }

    article.status = "published";
    article.publishedAt = new Date();
    article.publishedBy = session.user.id; // Use the logged-in user's ID

    // Ensure citation numbering refresh
    if (article.citations?.length) {
      article.citations.forEach((c, i) => (c.number = i + 1));
    }

    await article.save();
    const publicUrl = `/articles/${article.slug}`;

    return NextResponse.json({ success: true, article, url: publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}