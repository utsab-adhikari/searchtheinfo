import connectDB from "@/db/ConnectDB";
import Interested from "@/models/interestedModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const submissions = await Interested.find().sort({ createdAt: -1 });
    if (!submissions) {
      return NextResponse.json(
        { message: "No submissions found" },
        { status: 404 }
      );
    }
    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, projectType, researchTopics, timeline, budget, requirements } = await request.json();

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name & Email fields must be filled" },
        { status: 400 }
      );
    }

    // Check for existing submission from same email in last 24 hours
    const recentSubmission = await Interested.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentSubmission) {
      return NextResponse.json(
        { message: "You have already submitted a request recently. Please wait 24 hours." },
        { status: 409 }
      );
    }

    // Create new submission
    const newSubmission = new Interested({
      name,
      email,
      projectType,
      researchTopics,
      timeline,
      budget,
      requirements
    });

    await newSubmission.save();

    return NextResponse.json(
      { 
        message: "Thank you for your interest! We'll contact you within 24 hours.",
        submission: newSubmission 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Submission ID is required" },
        { status: 400 }
      );
    }

    const deletedSubmission = await Interested.findByIdAndDelete(id);
    if (!deletedSubmission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Submission deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const { id, status, notes } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Submission ID is required" },
        { status: 400 }
      );
    }

    const updatedSubmission = await Interested.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSubmission, { status: 200 });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}