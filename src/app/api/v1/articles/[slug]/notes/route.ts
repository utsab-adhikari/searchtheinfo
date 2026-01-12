import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import Article from "@/models/v1/articleModelV1";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface RouteParams {
  params: { slug: string };
}

interface UpdateNotesRequest {
  notes: string;
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

    const body = await req.json() as Partial<UpdateNotesRequest>;
    const { notes } = body;

    if (typeof notes !== "string")
      return NextResponse.json({ message: "Invalid notes data" }, { status: 400 });

    await connectDB();

    const article = await Article.findOne({ slug: params.slug });
    if (!article)
      return NextResponse.json({ message: "Article not found" }, { status: 404 });

    if (
      article.createdBy.toString() !== session.user.id &&
      session.user.role !== "admin"
    )
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    article.notes = notes;
    await article.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notes:", error);
    return NextResponse.json({ message: "Error updating notes" }, { status: 500 });
  }
}
