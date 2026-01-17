import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/database/connectDB";
import User from "@/models/userModel";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";
import { withDbTiming } from "@/lib/monitoring/dbTimer";

async function handleGetUsers(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    let query: Record<string, unknown> = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await withDbTiming("users-find", () =>
      User.find(query)
        .select("-password -forgetPasswordToken -forgetPasswordTokenExpireesAt")
        .sort({ createdAt: -1 })
        .lean()
    );

    return NextResponse.json({ data: users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

async function handlePutUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { userId, role, isVerified } = await req.json();

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated", data: user });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

async function handleDeleteUser(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export const GET = withApiTimingSimple("users-get", handleGetUsers);
export const PUT = withApiTimingSimple("users-put", handlePutUser);
export const DELETE = withApiTimingSimple("users-delete", handleDeleteUser);
