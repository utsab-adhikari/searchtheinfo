import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "@/db/ConnectDB";
import cloudinary from "@/config/cloudinary";
import Image from "@/models/imageModel";

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const {
      data,
      url,
      title,
      description,
      filename: fileNameInput,
      articleId,
    } = body;

    const idSuffix = crypto.randomBytes(6).toString("hex");
    let filename = fileNameInput || `img_${Date.now()}_${idSuffix}.jpg`;
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    let uploadResult = null;

    // --- Upload from Base64 ---
    if (data) {
      uploadResult = await cloudinary.uploader.upload(data, {
        folder: "searchtheinfo/articles",
        public_id: filename.replace(/\.[^/.]+$/, ""), // remove extension
        overwrite: true,
        resource_type: "image",
      });
    }

    // --- Upload from URL ---
    else if (url) {
      uploadResult = await cloudinary.uploader.upload(url, {
        folder: "searchtheinfo/articles",
        public_id: filename.replace(/\.[^/.]+$/, ""),
        overwrite: true,
        resource_type: "image",
      });
    } else {
      return NextResponse.json(
        { error: "No image data or URL provided" },
        { status: 400 }
      );
    }

    const imageId = new mongoose.Types.ObjectId();

    const newImage = new Image({
      url: uploadResult.secure_url,
      article: articleId || null,
      filename: filename,
      title: title || "",
      description: description || "",
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    });

    await newImage.save();

    return NextResponse.json({
      success: true,
      image: {
        _id: imageId,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        filename,
        title: title || "",
        description: description || "",
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      },
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: err.message || "Image upload failed" },
      { status: 500 }
    );
  }
}
