import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { uploadMediaFile } from "../../lib/feed/upload";
import { POST_MEDIA_BUCKET } from "../../lib/storage/constants";

interface MediaUploaderProps {
  onUploadComplete: (url: string, type: "image" | "video", bucket?: string, path?: string, file?: File) => void;
  currentUrl?: string;
  currentType?: "image" | "video";
}

export function MediaUploader({ onUploadComplete, currentUrl, currentType }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Set initial values after mount to avoid hydration mismatch
  useEffect(() => {
    if (currentUrl && currentType) {
      setPreviewUrl(currentUrl);
      setMediaType(currentType);
    }
  }, [currentUrl, currentType]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[MediaUploader] Starting upload:", {
      name: file.name,
      type: file.type,
      size: file.size,
      bucket: POST_MEDIA_BUCKET
    });

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    // Store the selected file for parent to manage
    setSelectedFile(file);
    setMediaType(file.type.startsWith("video") ? "video" : "image");

    // Create temporary preview URL only for display in uploader
    const tempPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(tempPreviewUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("[MediaUploader] Sending to API:", "/api/upload-media");

      // Use API route with proper error handling
      const response = await fetch("/api/upload-media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("[MediaUploader] Upload response:", {
        status: response.status,
        ok: response.ok,
        result
      });

      if (!response.ok) {
        const errorMessage = result.error || result.details || `Upload failed with status ${response.status}`;
        console.error("[MediaUploader] Upload failed:", errorMessage);
        throw new Error(errorMessage);
      }

      if (result.error) {
        console.error("[MediaUploader] API returned error:", result.error);
        throw new Error(result.error);
      }

      console.log("[MediaUploader] Upload success:", result);
      
      console.log("[MediaUploader] Upload response", result);
      console.log("[MediaUploader] Passing to parent", {
        url: result.url,
        bucket: result.bucket,
        path: result.path,
        mediaType: file.type.startsWith("video") ? "video" : "image",
      });
      
      // Pass file to parent for blob URL management
      if (file.type.startsWith("video")) {
        console.log("[MediaUploader] Passing video upload result to parent");
        onUploadComplete(result.url || "", "video", result.bucket, result.path, file);
        // Keep video preview for uploader display
      } else {
        // For images, use Supabase URL if available
        const imageUrl = result.url || "";
        onUploadComplete(imageUrl, "image", result.bucket, result.path, file);
        setPreviewUrl(imageUrl);
        // Clean up temporary preview URL
        URL.revokeObjectURL(tempPreviewUrl);
      }

    } catch (err) {
      console.error("[MediaUploader] Upload exception:", err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      
      // Show error in UI (you could also use a toast here)
      alert(`Upload failed: ${errorMessage}`);
      
      // Clean up on error
      setPreviewUrl(null);
      setMediaType(null);
      setSelectedFile(null);
      // Clean up temporary preview URL if it exists
      if (tempPreviewUrl) {
        URL.revokeObjectURL(tempPreviewUrl);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isUploading
            ? "border-sky-400 bg-sky-500/10"
            : "border-white/20 hover:border-white/40 hover:bg-white/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="text-4xl">📤</div>
            <p className="text-sky-400 font-medium">Uploading...</p>
            <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-video max-h-48 rounded-xl overflow-hidden bg-slate-900">
              {mediaType === "video" ? (
                <video src={previewUrl} className="h-full w-full object-cover" controls />
              ) : (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="text-sm text-slate-400">Click to change media</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📸</div>
            <p className="text-white font-medium">Drop media here or click to upload</p>
            <p className="text-sm text-slate-400">JPG, PNG, GIF, MP4, WEBM (max 50MB)</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Or URL Input */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-2 text-sm text-slate-400">or paste URL</span>
        </div>
      </div>
    </div>
  );
}
