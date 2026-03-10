export const POST_MEDIA_BUCKET = "post-media";

export const SIGNED_URL_EXPIRY = {
  SHORT: 600,    // 10 minutes for immediate use
  MEDIUM: 3600,  // 1 hour for editing sessions
  LONG: 86400    // 24 hours for feed caching
} as const;
