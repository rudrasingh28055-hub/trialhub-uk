-- Migration: Social Discovery + Scouting Platform
-- Creates feed system, follows, verification tiers, and enhanced player profiles

-- ============================================
-- 1. VERIFICATION TIERS (Player Credibility)
-- ============================================

-- Add verification_level to existing player_profiles
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS verification_level INTEGER DEFAULT 0 
  CHECK (verification_level >= 0 AND verification_level <= 4);

-- Add verification metadata
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT 
  CHECK (verification_badge IN ('basic', 'verified', 'academy', 'pro', 'elite'));
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Update existing profiles to have verification_level = 0
UPDATE player_profiles SET verification_level = 0 WHERE verification_level IS NULL;

-- ============================================
-- 2. POSTS (Feed System)
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Post Content
  content_type TEXT NOT NULL DEFAULT 'highlight'
    CHECK (content_type IN ('highlight', 'training', 'achievement', 'match_moment', 'general')),
  caption TEXT,
  
  -- Media
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'video'
    CHECK (media_type IN ('video', 'image')),
  
  -- Metadata
  position_tag TEXT,
  club_history_tag TEXT,
  match_tag TEXT,
  training_tag TEXT,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);

-- ============================================
-- 3. POST LIKES
-- ============================================

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ============================================
-- 4. POST COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  likes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

-- ============================================
-- 5. FOLLOWS (Follow System)
-- ============================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  follow_type TEXT NOT NULL DEFAULT 'player'
    CHECK (follow_type IN ('player', 'club')),
  
  notification_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- ============================================
-- 6. CLUB WATCHLIST (Scouting Tool)
-- ============================================

CREATE TABLE IF NOT EXISTS club_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Scouting Notes
  notes TEXT,
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Status
  status TEXT DEFAULT 'watching'
    CHECK (status IN ('watching', 'contacted', 'trialed', 'signed', 'passed')),
  
  -- Metadata
  added_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_club_id ON club_watchlist(club_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_player_id ON club_watchlist(player_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_priority ON club_watchlist(priority);

-- ============================================
-- 7. TRIAL INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS trial_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  
  -- Invitation Details
  message TEXT,
  trial_date DATE,
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  
  -- Response
  player_response TEXT,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_invitations_club_id ON trial_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_trial_invitations_player_id ON trial_invitations(player_id);
CREATE INDEX IF NOT EXISTS idx_trial_invitations_status ON trial_invitations(status);

-- ============================================
-- 8. SAVED PLAYERS
-- ============================================

CREATE TABLE IF NOT EXISTS saved_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Categorization
  folder_name TEXT DEFAULT 'General',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_players_club_id ON saved_players(club_id);

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_players ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Users can create their own posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Post likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "Users can create likes"
  ON post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- Club watchlist policies
CREATE POLICY "Clubs can view their own watchlist"
  ON club_watchlist FOR SELECT TO authenticated
  USING (auth.uid() = club_id);

CREATE POLICY "Clubs can add to their watchlist"
  ON club_watchlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Clubs can update their watchlist"
  ON club_watchlist FOR UPDATE TO authenticated
  USING (auth.uid() = club_id);

CREATE POLICY "Clubs can remove from watchlist"
  ON club_watchlist FOR DELETE TO authenticated
  USING (auth.uid() = club_id);

-- Trial invitations policies
CREATE POLICY "Users can view their own invitations"
  ON trial_invitations FOR SELECT TO authenticated
  USING (auth.uid() = club_id OR auth.uid() = player_id);

CREATE POLICY "Clubs can create invitations"
  ON trial_invitations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Players can update their responses"
  ON trial_invitations FOR UPDATE TO authenticated
  USING (auth.uid() = player_id OR auth.uid() = club_id);

-- Saved players policies
CREATE POLICY "Clubs can view their saved players"
  ON saved_players FOR SELECT TO authenticated
  USING (auth.uid() = club_id);

CREATE POLICY "Clubs can save players"
  ON saved_players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Clubs can unsave players"
  ON saved_players FOR DELETE TO authenticated
  USING (auth.uid() = club_id);

-- ============================================
-- 10. TRIGGERS FOR COUNTERS
-- ============================================

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE player_profiles 
    SET follower_count = follower_count + 1 
    WHERE profile_id = NEW.following_id;
    
    UPDATE player_profiles 
    SET following_count = following_count + 1 
    WHERE profile_id = NEW.follower_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE player_profiles 
    SET follower_count = GREATEST(0, follower_count - 1) 
    WHERE profile_id = OLD.following_id;
    
    UPDATE player_profiles 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE profile_id = OLD.follower_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_follower_counts ON follows;

-- Create trigger
CREATE TRIGGER trg_update_follower_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_likes ON post_likes;

CREATE TRIGGER trg_update_post_likes
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_post_comments ON post_comments;

CREATE TRIGGER trg_update_post_comments
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();
