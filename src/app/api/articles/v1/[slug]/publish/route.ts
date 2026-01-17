import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v1/articleModelV1";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { withApiTiming } from "@/lib/monitoring/apiTimer";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface SuccessResponse {
  success: true;
}

interface ErrorResponse {
  success: false;
  message: string;
}

async function patchPublish(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { slug } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const article = await Article.findOne({ slug });
    if (!article) {
      return NextResponse.json(
        { success: false, message: "Article not found" },
        { status: 404 }
      );
    }

    if (
      article.createdBy.toString() !== session.user.id &&
      (session.user as any).role !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    if (article.status === "published") {
      return NextResponse.json({ success: true });
    }

    article.status = "published";

    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Published article",
    });

    await article.save();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error publishing article (v2):", message);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withApiTiming<RouteParams>(
  "articles-v1-publish-patch",
  patchPublish
);
