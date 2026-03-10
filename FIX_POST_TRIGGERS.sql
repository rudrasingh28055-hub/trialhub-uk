-- Fix post likes and comments triggers to work with RLS
-- The triggers need to be SECURITY DEFINER to bypass RLS policies

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_update_post_likes ON post_likes;
DROP TRIGGER IF EXISTS trg_update_post_comments ON post_comments;

-- Update functions to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER trg_update_post_likes
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trg_update_post_comments
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Also ensure posts table has default values for counts
ALTER TABLE posts 
ALTER COLUMN likes_count SET DEFAULT 0,
ALTER COLUMN comments_count SET DEFAULT 0;

-- Update any NULL values to 0
UPDATE posts 
SET likes_count = COALESCE(likes_count, 0),
    comments_count = COALESCE(comments_count, 0)
WHERE likes_count IS NULL OR comments_count IS NULL;
