/**
 * Cloudinary Upload Utility
 * Handles image uploads to Cloudinary with proper error handling
 */

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  error?: string;
}

export interface ImageUploadOptions {
  file: File;
  folder?: string;
  transformation?: string;
  filename?: string;
}

/**
 * Upload image to Cloudinary
 * @param options Upload configuration
 * @returns Upload result with URL and metadata
 */
export async function uploadToCloudinary(
  options: ImageUploadOptions
): Promise<CloudinaryUploadResult> {
  const { file, folder = "articles", filename } = options;

  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Call our API endpoint
    const response = await fetch("/api/upload/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64,
        folder,
        filename: filename || file.name,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      success: true,
      url: data.url,
      publicId: data.publicId,
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get optimized Cloudinary URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
  } = {}
): string {
  const { width, height, quality = 80, format = "auto" } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";

  let transformations = `q_${quality},f_${format}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  transformations += ",c_limit";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/upload/v1", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Delete failed");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}
