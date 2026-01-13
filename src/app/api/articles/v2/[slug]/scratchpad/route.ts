import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

interface RouteParams {
  params: { slug: string };
}

interface UpdateScratchpadRequest {
  scratchPad: string;
}

interface SuccessResponse {
  success: true;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export async function PATCH(
  req: Request,
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

    const body = (await req.json()) as Partial<UpdateScratchpadRequest>;
    const { scratchPad } = body;

    if (typeof scratchPad !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid scratchpad data" },
        { status: 400 }
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

    article.scratchPad = scratchPad;
    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Updated scratchpad",
    });

    await article.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating scratchpad (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
