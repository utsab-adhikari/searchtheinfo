"use client";

import React, { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface ImageData {
  url: string;
  publicId?: string;
  filename: string;
  title: string;
  description?: string;
  caption?: string;
  attribution?: string;
  width?: number;
  height?: number;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (image: ImageData) => void;
  title?: string;
  existingImage?: ImageData | null;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Image",
  existingImage,
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    existingImage?.url || null
  );
  const [formData, setFormData] = useState({
    file: null as File | null,
    filename: existingImage?.filename || "",
    title: existingImage?.title || "",
    description: existingImage?.description || "",
    caption: existingImage?.caption || "",
    attribution: existingImage?.attribution || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file, filename: file.name });
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file && !existingImage) {
      alert("Please select an image file");
      return;
    }

    setUploading(true);

    try {
      let imageData: ImageData;

      if (formData.file) {
        // Upload new image to Cloudinary
        const result = await uploadToCloudinary({
          file: formData.file,
          folder: "articles",
          filename: formData.filename,
        });

        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }

        imageData = {
          url: result.url!,
          publicId: result.publicId,
          filename: formData.filename,
          title: formData.title,
          description: formData.description,
          caption: formData.caption,
          attribution: formData.attribution,
          width: result.width,
          height: result.height,
        };
      } else {
        // Update existing image metadata
        imageData = {
          ...existingImage!,
          filename: formData.filename,
          title: formData.title,
          description: formData.description,
          caption: formData.caption,
          attribution: formData.attribution,
        };
      }

      onUpload(imageData);
      handleClose();
    } catch (error: any) {
      alert(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      file: null,
      filename: "",
      title: "",
      description: "",
      caption: "",
      attribution: "",
    });
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

  <form onSubmit={handleSubmit} className="space-y-3">
          {/* File Upload */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 tracking-wider">
              Image File
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded"
              />
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={formData.filename}
                onChange={(e) =>
                  setFormData({ ...formData, filename: e.target.value })
                }
                placeholder="research-image.jpg"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Main Image Title"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description for accessibility and SEO..."
              rows={3}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Caption
              </label>
              <input
                type="text"
                value={formData.caption}
                onChange={(e) =>
                  setFormData({ ...formData, caption: e.target.value })
                }
                placeholder="Display caption for the image"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attribution
              </label>
              <input
                type="text"
                value={formData.attribution}
                onChange={(e) =>
                  setFormData({ ...formData, attribution: e.target.value })
                }
                placeholder="Wikimedia Commons / Author"
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || (!formData.file && !existingImage)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {existingImage ? "Update" : "Upload"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
