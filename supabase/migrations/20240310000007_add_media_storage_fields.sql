-- Add media storage fields to posts table
-- This allows us to generate fresh signed URLs at runtime instead of storing them

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_bucket TEXT,
ADD COLUMN IF NOT EXISTS media_path TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_media_bucket_path ON posts(media_bucket, media_path) WHERE media_bucket IS NOT NULL AND media_path IS NOT NULL;

-- Backfill existing posts with bucket and path from media_url
UPDATE posts 
SET 
  media_bucket = (
    CASE 
      WHEN media_url LIKE '%/storage/v1/object/sign/post-media/%' THEN 'post-media'
      WHEN media_url LIKE '%/storage/v1/object/public/post-media/%' THEN 'post-media'
      WHEN media_url LIKE '%/storage/v1/object/post-media/%' THEN 'post-media'
      ELSE NULL
    END
  ),
  media_path = (
    CASE 
      WHEN media_url LIKE '%/storage/v1/object/sign/post-media/%' THEN 
        regexp_replace(media_url, '.*/storage/v1/object/sign/post-media/([^?]+).*', '\1')
      WHEN media_url LIKE '%/storage/v1/object/public/post-media/%' THEN 
        regexp_replace(media_url, '.*/storage/v1/object/public/post-media/(.+)', '\1')
      WHEN media_url LIKE '%/storage/v1/object/post-media/%' THEN 
        regexp_replace(media_url, '.*/storage/v1/object/post-media/(.+)', '\1')
      ELSE NULL
    END
  )
WHERE media_url IS NOT NULL 
  AND media_url LIKE '%/storage/v1/object/%'
  AND (media_bucket IS NULL OR media_path IS NULL);

-- Log the backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count FROM posts WHERE media_bucket IS NOT NULL AND media_path IS NOT NULL;
  RAISE NOTICE 'Backfilled % posts with media storage fields', backfilled_count;
END $$;
