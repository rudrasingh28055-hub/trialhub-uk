-- Migration: Add football-specific metadata to posts table
-- Supports Quick Post and Highlight Builder flows
-- BACKWARD COMPATIBLE: Keeps media_url as plain URL string

-- Add composer_mode field to track Quick Post vs Highlight Builder
ALTER TABLE posts ADD COLUMN IF NOT EXISTS composer_mode TEXT 
  CHECK (composer_mode IN ('quick', 'highlight'));

-- Add media storage fields for video URL resolution
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_bucket TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_path TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_mime_type TEXT;

-- Add Quick Post specific fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT 
  CHECK (post_type IN ('daily_post', 'training_update', 'achievement', 'general'));

-- Add Highlight Builder specific fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS action_type TEXT 
  CHECK (action_type IN ('goal', 'assist', 'shot', 'save', 'tackle', 'interception', 'dribble', 'key_pass', 'cross', 'buildup', 'training_drill', 'recovery_run', 'other'));

ALTER TABLE posts ADD COLUMN IF NOT EXISTS opponent TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS minute INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS competition TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS foot_used TEXT CHECK (foot_used IN ('left', 'right', 'both'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS match_date DATE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS session_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS clip_type TEXT CHECK (clip_type IN ('match_highlight', 'match_video', 'training_clip'));

-- Add video editing metadata
ALTER TABLE posts ADD COLUMN IF NOT EXISTS trim_start REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS trim_end REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_frame_time REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_time REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_label TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_x REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_y REAL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_duration INTEGER DEFAULT 2;

-- Add visibility field (override existing default if needed)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
  CHECK (visibility IN ('public', 'followers'));

-- PRESERVE existing content_type values - DO NOT MIGRATE
-- Keep original values: highlight, training, achievement, match_moment, general

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_posts_composer_mode ON posts(composer_mode);
CREATE INDEX IF NOT EXISTS idx_posts_media_bucket ON posts(media_bucket);
CREATE INDEX IF NOT EXISTS idx_posts_action_type ON posts(action_type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_clip_type ON posts(clip_type);
CREATE INDEX IF NOT EXISTS idx_posts_match_date ON posts(match_date);

-- Add RLS policy for new visibility field
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts regardless of visibility" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (
    is_published = TRUE AND 
    (
      -- Public posts: everyone can see
      visibility = 'public' OR
      -- Followers posts: author and approved followers can see
      (
        visibility = 'followers' AND 
        (
          auth.uid() = author_id OR
          auth.uid() IN (
            SELECT follower_user_id 
            FROM follow_edges 
            WHERE followed_user_id = author_id 
            AND status = 'approved'
          )
        )
      )
    )
  );

CREATE POLICY "Users can view their own posts regardless of visibility"
  ON posts FOR SELECT TO authenticated
  USING (auth.uid() = author_id);

-- Update other policies to handle new fields
CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    (content_type IN ('highlight', 'training', 'achievement', 'match_moment', 'general')) AND
    (composer_mode IN ('quick', 'highlight') OR composer_mode IS NULL) AND
    (visibility IN ('public', 'followers')) AND
    (media_type IN ('video', 'image'))
  );

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Add comments for documentation
COMMENT ON COLUMN posts.composer_mode IS 'Composer mode: quick, highlight - tracks which flow created the post';
COMMENT ON COLUMN posts.media_bucket IS 'Storage bucket for media files';
COMMENT ON COLUMN posts.media_path IS 'Storage path for media files';
COMMENT ON COLUMN posts.media_mime_type IS 'MIME type of media file';
COMMENT ON COLUMN posts.post_type IS 'Quick Post categorization: daily_post, training_update, achievement, general';
COMMENT ON COLUMN posts.action_type IS 'Football action type: goal, assist, shot, save, tackle, etc.';
COMMENT ON COLUMN posts.opponent IS 'Opponent team name for match-related posts';
COMMENT ON COLUMN posts.minute IS 'Minute of the match when the action occurred';
COMMENT ON COLUMN posts.competition IS 'Competition name (league, cup, tournament)';
COMMENT ON COLUMN posts.result IS 'Match result (W/L/D and score)';
COMMENT ON COLUMN posts.foot_used IS 'Foot used for the action: left, right, both';
COMMENT ON COLUMN posts.match_date IS 'Date of the match';
COMMENT ON COLUMN posts.session_name IS 'Training session name';
COMMENT ON COLUMN posts.location IS 'Location of the action (venue, facility)';
COMMENT ON COLUMN posts.clip_type IS 'Highlight categorization: match_highlight, match_video, training_clip';
COMMENT ON COLUMN posts.trim_start IS 'Video trim start time in seconds';
COMMENT ON COLUMN posts.trim_end IS 'Video trim end time in seconds';
COMMENT ON COLUMN posts.cover_frame_time IS 'Cover frame timestamp in seconds';
COMMENT ON COLUMN posts.spotlight_time IS 'Spotlight marker timestamp in seconds';
COMMENT ON COLUMN posts.spotlight_label IS 'Spotlight marker label text';
COMMENT ON COLUMN posts.visibility IS 'Post visibility: public, followers';
COMMENT ON COLUMN posts.media_url IS 'Backward compatible: public URL for images, null for videos (resolved from bucket/path)';
