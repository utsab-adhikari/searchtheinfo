import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/connectDB";
import Metric from "@/models/metricModel";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(200, Number(searchParams.get("limit")) || 50);
  const type = searchParams.get("type");
  const name = searchParams.get("name");
  const path = searchParams.get("path");

  const query: Record<string, any> = {};
  if (type) query.type = type;
  if (name) query.name = { $regex: name, $options: "i" };
  if (path) query.path = { $regex: path, $options: "i" };

  await connectDB();
  const [metrics, total] = await Promise.all([
    Metric.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Metric.countDocuments(query),
  ]);

  return NextResponse.json({
    metrics,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
