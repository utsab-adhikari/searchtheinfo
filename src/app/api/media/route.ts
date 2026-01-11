import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import Image from "@/models/imageModel";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const limit = searchParams.get("limit") || "50";

    let query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    return NextResponse.json({ data: images, count: images.length });
  } catch (error: any) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json({ message: "Image ID required" }, { status: 400 });
    }

    await Image.findByIdAndDelete(imageId);

    return NextResponse.json({ message: "Image deleted" });
  } catch (error: any) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
