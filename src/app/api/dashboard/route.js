import connectDB from "@/db/ConnectDB";
import { authOptions } from "../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import Article from "@/models/articleModel";
import { NextResponse } from "next/server";
import Category from "@/models/categoryModel";

export async function GET(req) {
  try {
    await connectDB();
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json(
    //     { error: "Unauthorized. Please log in." },
    //     { status: 401 }
    //   );
    // }

    const publishedArticles = await Article.find({ status: "published" })
      .populate("category", "name")
      .lean();
    const draftArticles = await Article.find({ status: "draft" })
      .populate("category", "name")
      .lean();

    return NextResponse.json(
      {
        publishedCount: publishedArticles.length,
        draftCount: draftArticles.length,
        publishedArticles,
        draftArticles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
