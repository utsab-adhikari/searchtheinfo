import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withApiTimingSimple } from "@/lib/monitoring/apiTimer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function handlePost(req: NextRequest) {
  try {
    const { file, folder = "articles", filename } = await req.json();

    if (!file || typeof file !== "string") {
      return NextResponse.json({ error: "Invalid file payload" }, { status: 400 });
    }

    // Optional: add auth checks here for your app (e.g., session verification)

    const uploadRes = await cloudinary.uploader.upload(file, {
      folder,
      public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
      resource_type: "image",
      overwrite: true,
    });

    return NextResponse.json({
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      width: uploadRes.width,
      height: uploadRes.height,
      format: uploadRes.format,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cloudinary upload error:", message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

async function handleDelete(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    // Optional: add auth checks here for your app (e.g., session verification)

    const res = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    if (res.result !== "ok" && res.result !== "not found") {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cloudinary delete error:", message);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export const POST = withApiTimingSimple("upload-v1-post", handlePost);
export const DELETE = withApiTimingSimple("upload-v1-delete", handleDelete);