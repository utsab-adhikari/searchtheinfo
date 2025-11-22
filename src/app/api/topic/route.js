import connectDB from "@/db/ConnectDB";
import Topic from "@/models/topicModel";
import Category from "@/models/categoryModel";
import { NextResponse } from "next/server";

// 🟢 GET - Fetch all topics (populates category)
export async function GET() {
  try {
    await connectDB();
    const topics = await Topic.find()
      .populate("category")
      .sort({ createdAt: -1 });

    if (!topics || topics.length === 0) {
      return NextResponse.json({ message: "No topics found" }, { status: 404 });
    }

    return NextResponse.json(topics, { status: 200 });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 🟡 POST - Create a new topic
export async function POST(request) {
  try {
    await connectDB();
    const { topic, description, category } = await request.json();

    if (!topic || !category) {
      return NextResponse.json(
        { message: "Topic name and category are required" },
        { status: 400 }
      );
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const existingTopic = await Topic.findOne({ topic });
    if (existingTopic) {
      return NextResponse.json(
        { message: "Topic already exists" },
        { status: 409 }
      );
    }

    const newTopic = new Topic({ topic, description, category });
    await newTopic.save();

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 🔵 PUT - Update an existing topic
export async function PUT(request) {
  try {
    await connectDB();
    const { id, topic, description, isResearched, category } =
      await request.json();

    if (!id || !topic) {
      return NextResponse.json(
        { message: "Topic ID and name are required" },
        { status: 400 }
      );
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      id,
      { topic, description, isResearched, category },
      { new: true }
    );

    if (!updatedTopic) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTopic, { status: 200 });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE - Remove a topic
export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Topic ID is required" },
        { status: 400 }
      );
    }

    const deletedTopic = await Topic.findByIdAndDelete(id);
    if (!deletedTopic) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Topic deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
