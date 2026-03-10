"use server";

import { createClient } from "../supabase/server";

export async function uploadMediaFile(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { url: null, error: "Not authenticated" };
  }
  
  const file = formData.get("file") as File;
  if (!file) {
    return { url: null, error: "No file provided" };
  }
  
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: "Invalid file type. Allowed: JPG, PNG, GIF, MP4, WEBM" };
  }
  
  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { url: null, error: "File too large. Max 50MB" };
  }
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  
  console.log("[uploadMediaFile] Uploading:", fileName, "Size:", file.size);
  
  const { data, error } = await supabase.storage
    .from("post-media")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });
  
  if (error) {
    console.error("[uploadMediaFile] Error:", error);
    return { url: null, error: error.message };
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("post-media")
    .getPublicUrl(fileName);
  
  console.log("[uploadMediaFile] Success:", publicUrl);
  
  return { url: publicUrl, error: null };
}
