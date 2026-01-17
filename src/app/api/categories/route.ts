import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import Category from "@/models/categoryModel";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";
import { withDbTiming } from "@/lib/monitoring/dbTimer";

async function handleGetCategories() {
  await connectDB();
  const categories = await withDbTiming("categories-find", () =>
    Category.find()
      .sort({ title: 1 })
      .populate("createdBy", "name email")
  );
  return NextResponse.json({ data: categories });
}

async function handlePostCategory(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user?.isVerified === false) {
    return NextResponse.json(
      { message: "Verification required" },
      { status: 403 }
    );
  }

  const { title, description } = await req.json();
  if (!title) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  await connectDB();
  const category = await Category.create({
    title,
    description,
    createdBy: user.id,
  });
  return NextResponse.json({ data: category }, { status: 201 });
}

async function handlePutCategory(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user?.isVerified === false) {
    return NextResponse.json(
      { message: "Verification required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Category ID is required" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { title, description } = body as {
    title?: string;
    description?: string;
  };

  await connectDB();
  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json(
      { message: "Category not found" },
      { status: 404 }
    );
  }

  const isOwner = category.createdBy?.toString() === user.id;
  const isAdmin = (user.role || "") === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (title !== undefined) category.title = title;
  if (description !== undefined) category.description = description;
  await category.save();

  return NextResponse.json({ data: category });
}

async function handleDeleteCategory(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user?.isVerified === false) {
    return NextResponse.json(
      { message: "Verification required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { message: "Category ID is required" },
      { status: 400 }
    );
  }

  await connectDB();
  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json(
      { message: "Category not found" },
      { status: 404 }
    );
  }

  const isOwner = category.createdBy?.toString() === user.id;
  const isAdmin = (user.role || "") === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await category.deleteOne();
  return NextResponse.json({ message: "Category deleted" }, { status: 200 });
}

export const GET = withApiTimingSimple("categories-get", handleGetCategories);
export const POST = withApiTimingSimple("categories-post", handlePostCategory);
export const PUT = withApiTimingSimple("categories-put", handlePutCategory);
export const DELETE = withApiTimingSimple("categories-delete", handleDeleteCategory);
