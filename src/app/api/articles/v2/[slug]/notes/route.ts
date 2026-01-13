import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2"; 
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

interface RouteParams {
  params: { slug: string };
}

interface UpdateNotesRequest {
  notes: string;
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

    const body = (await req.json()) as Partial<UpdateNotesRequest>;
    const { notes } = body;

    if (typeof notes !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid notes data" },
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

    article.notes = notes;
    
    article.revisions.push({
      editedBy: new Types.ObjectId(session.user.id),
      editedAt: new Date(),
      summary: "Updated notes",
    });

    await article.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating notes (v2):", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
