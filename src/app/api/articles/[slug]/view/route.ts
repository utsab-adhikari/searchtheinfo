import { NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { Article, View } from "@/models";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const body = await req.json().catch(() => ({} as any));

    const ipAddressRaw = body?.ipAddress;
    const ipAddress =
      typeof ipAddressRaw === "string" && ipAddressRaw.trim().length > 0
        ? ipAddressRaw.trim()
        : "unknown";

    const article = await Article.findOne({ slug }).select("_id");
    if (!article) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    await View.findOneAndUpdate(
      { article: article._id, ip: ipAddress },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    const viewStats = await View.aggregate([
      { $match: { article: article._id } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    const totalViews = viewStats[0]?.total ?? 0;

    return NextResponse.json({ message: "View recorded", totalViews });
  } catch (error: any) {
    console.error("Failed to record view", error);
    return NextResponse.json({ message: "Failed to record view" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;
    const article = await Article.findOne({ slug }).select("_id");
    if (!article) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    const viewStats = await View.aggregate([
      { $match: { article: article._id } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    return NextResponse.json({ totalViews: viewStats[0]?.total ?? 0 });
  } catch (error: any) {
    console.error("Failed to fetch views", error);
    return NextResponse.json({ message: "Failed to fetch views" }, { status: 500 });
  }
}
