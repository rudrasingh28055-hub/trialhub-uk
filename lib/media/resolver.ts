import { getAdminSupabase } from "../adapters/supabase/admin";
import { POST_MEDIA_BUCKET } from "../storage/constants";

// Shared media resolver for posts
export async function getPostMediaUrl(post: {
  media_url: string | null;
  media_bucket?: string | null;
  media_path?: string | null;
  media_mime_type?: string | null;
  media_type: string;
}): Promise<string | null> {
  // If media_url is available (images), use it directly
  if (post.media_url) {
    return post.media_url;
  }

  // For videos, resolve signed URL from bucket/path
  if (post.media_type === "video" && post.media_bucket && post.media_path) {
    try {
      const adminSupabase = getAdminSupabase();
      const { data, error } = await adminSupabase.storage
        .from(post.media_bucket)
        .createSignedUrl(post.media_path, 3600); // 1 hour expiry

      if (error) {
        console.error("Failed to create signed URL for video:", error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error resolving video URL:", error);
      return null;
    }
  }

  // Fallback: try to use media_url if available
  return post.media_url;
}

// Client-side version for immediate rendering (without async)
export function getPostMediaUrlSync(post: {
  media_url: string | null;
  media_bucket?: string | null;
  media_path?: string | null;
  media_mime_type?: string | null;
  media_type: string;
}): string | null {
  // For images, return direct URL
  if (post.media_url) {
    return post.media_url;
  }

  // For videos, we can't generate signed URLs on client-side
  // Return null and let the component handle async resolution
  if (post.media_type === "video") {
    return null;
  }

  return post.media_url;
}

// Helper to check if post needs async URL resolution
export function needsAsyncUrlResolution(post: {
  media_url: string | null;
  media_type: string;
}): boolean {
  return post.media_type === "video" && !post.media_url;
}
