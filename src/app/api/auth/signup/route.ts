import connectDB from "@/database/connectDB";
import User from "@/models/userModel";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";

async function handlePost(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing)
      return NextResponse.json({ message: "User already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role: "user" });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating user";
    console.error("Error creating user:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export const POST = withApiTimingSimple("auth-signup-post", handlePost);
