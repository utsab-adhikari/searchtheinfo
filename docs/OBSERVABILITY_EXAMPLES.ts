// Example: Measure a database query in an API route
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import { measureDb, withApiMetrics } from "@/lib/metrics/server";
import { Article } from "@/models/v2/articleModelV2";

export async function GET_EXAMPLE_1(req: NextRequest) {
  await connectDB();

  // Wrap your Mongoose query with measureDb
  const articles = await measureDb({
    name: "find-published-articles",
    collection: Article.collection.name,
    path: req.nextUrl.pathname,
    metadata: { limit: 20 },
    fn: () => Article.find({ status: "published" }).limit(20).lean(),
  });

  return NextResponse.json({ articles });
}

// Example: Wrap entire API route to measure execution time
async function handler(req: NextRequest) {
  // Your API logic here
  return NextResponse.json({ ok: true });
}

export const POST_EXAMPLE = withApiMetrics(handler);

// Example: Both together
async function complexHandler(req: NextRequest) {
  await connectDB();

  const users = await measureDb({
    name: "find-active-users",
    collection: "users",
    path: req.nextUrl.pathname,
    fn: async () => {
      const UserModel = (await import("@/models/userModel")).default;
      return UserModel.find({ active: true }).limit(50);
    },
  });

  const articles = await measureDb({
    name: "find-user-articles",
    collection: "articles",
    path: req.nextUrl.pathname,
    fn: () => Article.find({ authorId: { $in: (users as any[]).map((u: any) => u._id) } }),
  });

  return NextResponse.json({ users, articles });
}

export const GET_EXAMPLE_COMPLEX = withApiMetrics(complexHandler);
// This records:
// 1. API execution time (entire request)
// 2. DB query time for finding users
// 3. DB query time for finding articles
