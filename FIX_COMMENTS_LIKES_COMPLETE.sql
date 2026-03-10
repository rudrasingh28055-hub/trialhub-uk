-- Comprehensive fix for post likes and comments issues

-- 1. Fix triggers to work with RLS (SECURITY DEFINER)
DROP TRIGGER IF EXISTS trg_update_post_likes ON post_likes;
DROP TRIGGER IF EXISTS trg_update_post_comments ON post_comments;

DROP FUNCTION IF EXISTS update_post_likes_count();
DROP FUNCTION IF EXISTS update_post_comments_count();

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

CREATE TRIGGER trg_update_post_likes
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trg_update_post_comments
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- 2. Add comment likes functionality
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Enable RLS on comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can create comment likes"
  ON comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes"
  ON comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add likes_count to post_comments table
ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create trigger for comment likes
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_comment_likes
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- 3. Ensure posts table has proper defaults
ALTER TABLE posts 
ALTER COLUMN likes_count SET DEFAULT 0,
ALTER COLUMN comments_count SET DEFAULT 0;

-- Update any NULL values to 0
UPDATE posts 
SET likes_count = COALESCE(likes_count, 0),
    comments_count = COALESCE(comments_count, 0)
WHERE likes_count IS NULL OR comments_count IS NULL;

-- 4. Update post_comments to ensure likes_count has a default
UPDATE post_comments 
SET likes_count = COALESCE(likes_count, 0)
WHERE likes_count IS NULL;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_post_likes_count TO authenticated;
GRANT EXECUTE ON FUNCTION update_post_comments_count TO authenticated;
GRANT EXECUTE ON FUNCTION update_comment_likes_count TO authenticated;
