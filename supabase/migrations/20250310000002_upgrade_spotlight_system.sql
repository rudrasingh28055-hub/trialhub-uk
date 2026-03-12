-- Migration: Upgrade spotlight system for advanced keyframe animation
-- Adds support for multiple keyframes, styles, and premium visual effects
-- BACKWARD COMPATIBLE: Keeps legacy single-point spotlight fields

-- Add new advanced spotlight fields
ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_style TEXT 
  CHECK (spotlight_style IN ('soft_white', 'dark_focus', 'ring_glow'));

ALTER TABLE posts ADD COLUMN IF NOT EXISTS spotlight_keyframes JSONB;

-- Add indexes for new spotlight fields
CREATE INDEX IF NOT EXISTS idx_posts_spotlight_style ON posts(spotlight_style);
CREATE INDEX IF NOT EXISTS idx_posts_spotlight_keyframes ON posts USING GIN(spotlight_keyframes);

-- Keep existing legacy fields for backward compatibility:
-- - spotlight_time REAL
-- - spotlight_label TEXT  
-- - spotlight_x REAL
-- - spotlight_y REAL
-- - spotlight_duration INTEGER

-- Comments for documentation
COMMENT ON COLUMN posts.spotlight_style IS 'Visual style for spotlight effect: soft_white, dark_focus, ring_glow';
COMMENT ON COLUMN posts.spotlight_keyframes IS 'JSON array of spotlight keyframes with id, progress, x, y for animated follow effects';
