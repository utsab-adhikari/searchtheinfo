import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import InterestedModel from "@/models/interestedModel";
import { withDbTiming } from "@/lib/monitoring/dbTimer";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";

async function handleGetInterested(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
    const skip = Number(searchParams.get("skip") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const interestedList = await withDbTiming("interested-find", () =>
      InterestedModel.find()
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip)
    );

    const total = await withDbTiming("interested-count", () =>
      InterestedModel.countDocuments()
    );

    return NextResponse.json({
      data: interestedList,
      total,
      limit,
      skip,
    });
  } catch (error: any) {
    console.error("Failed to fetch interested submissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch interested submissions" },
      { status: 500 }
    );
  }
}

async function handlePostInterested(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, projectType, researchTopics, timeline, budget, requirements } = body;

    if (!name || !email || !projectType || !researchTopics || !timeline || !budget) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const interested = await withDbTiming("interested-create", () =>
      InterestedModel.create({
      name,
      email,
      type: projectType,
      description: `Research Topics: ${researchTopics}\n\nRequirements: ${requirements}`,
      timeline,
      budget,
      })
    );

    return NextResponse.json(
      {
        data: interested,
        message: "Interest submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to save interested submission:", error);
    return NextResponse.json(
      { message: error.message || "Failed to save submission" },
      { status: 500 }
    );
  }
}

async function handleDeleteInterested(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Missing submission ID" },
        { status: 400 }
      );
    }

    const result = await withDbTiming("interested-delete", () =>
      InterestedModel.findByIdAndDelete(id)
    );

    if (!result) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Submission deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete interested submission:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete submission" },
      { status: 500 }
    );
  }
}

export const GET = withApiTimingSimple("interested-get", handleGetInterested);
export const POST = withApiTimingSimple("interested-post", handlePostInterested);
export const DELETE = withApiTimingSimple("interested-delete", handleDeleteInterested);
