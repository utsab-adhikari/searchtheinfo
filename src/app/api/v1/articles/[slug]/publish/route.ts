import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import Article from "@/models/v1/articleModelV1";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

interface RouteParams {
  params: { slug: string };
}

interface SuccessResponse {
  success: boolean;
}

interface ErrorResponse {
  message: string;
}

export async function PATCH(
  req: Request,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const article = await Article.findOne({ slug: params.slug });
    if (!article)
      return NextResponse.json({ message: "Article not found" }, { status: 404 });

    if (
      article.createdBy.toString() !== session.user.id &&
      session.user.role !== "admin"
    )
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    article.status = "published";
    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Published article",
    });

    await article.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing article:", error);
    return NextResponse.json({ message: "Error publishing article" }, { status: 500 });
  }
}
