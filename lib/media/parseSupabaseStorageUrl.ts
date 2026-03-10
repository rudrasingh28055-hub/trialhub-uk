/**
 * Parse Supabase Storage URL to extract bucket and path
 * Supports both signed and public URLs
 */
export function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    // Handle signed URLs: /storage/v1/object/sign/<bucket>/<path>?token=...
    const signedMatch = url.match(/\/storage\/v1\/object\/sign\/([^\/]+)\/(.+?)(?:\?|$)/);
    if (signedMatch) {
      return {
        bucket: decodeURIComponent(signedMatch[1]),
        path: decodeURIComponent(signedMatch[2])
      };
    }

    // Handle public URLs: /storage/v1/object/public/<bucket>/<path>
    const publicMatch = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
    if (publicMatch) {
      return {
        bucket: decodeURIComponent(publicMatch[1]),
        path: decodeURIComponent(publicMatch[2])
      };
    }

    // Handle legacy format: /storage/v1/object/<bucket>/<path>
    const legacyMatch = url.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)/);
    if (legacyMatch) {
      return {
        bucket: decodeURIComponent(legacyMatch[1]),
        path: decodeURIComponent(legacyMatch[2])
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse Supabase Storage URL:', error);
    return null;
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/');
}
