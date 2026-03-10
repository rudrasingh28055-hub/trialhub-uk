-- Create matching_scores table to store compatibility calculations
CREATE TABLE IF NOT EXISTS matching_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_profile_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  position_match_score INTEGER CHECK (position_match_score >= 0 AND position_match_score <= 100),
  age_match_score INTEGER CHECK (age_match_score >= 0 AND age_match_score <= 100),
  location_match_score INTEGER CHECK (location_match_score >= 0 AND location_match_score <= 100),
  experience_match_score INTEGER CHECK (experience_match_score >= 0 AND experience_match_score <= 100),
  skill_match_score INTEGER CHECK (skill_match_score >= 0 AND skill_match_score <= 100),
  matching_factors JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_profile_id, opportunity_id)
);

-- Create player_skills table for detailed skill tracking
CREATE TABLE IF NOT EXISTS player_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_profile_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  skill_category VARCHAR(50) NOT NULL, -- technical, physical, mental, tactical
  skill_level INTEGER CHECK (skill_level >= 1 AND skill_level <= 10),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_profile_id, skill_name)
);

-- Create opportunity_requirements table for detailed club needs
CREATE TABLE IF NOT EXISTS opportunity_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  requirement_type VARCHAR(50) NOT NULL, -- skill, experience, physical, etc.
  requirement_name VARCHAR(100) NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1 = must have, 5 = nice to have
  min_value VARCHAR(100), -- e.g., "3 years", "180cm"
  max_value VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create matching_recommendations table for AI suggestions
CREATE TABLE IF NOT EXISTS matching_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'player_for_club' or 'opportunity_for_player'
  target_id UUID NOT NULL, -- either player_profile_id or opportunity_id
  source_id UUID NOT NULL, -- the matching item
  match_score INTEGER NOT NULL,
  reason JSONB DEFAULT '[]', -- Array of matching factors
  is_viewed BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matching_scores_player ON matching_scores(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_matching_scores_opportunity ON matching_scores(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_matching_scores_overall ON matching_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_skills_profile ON player_skills(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_requirements_opportunity ON opportunity_requirements(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON matching_recommendations(user_id, created_at DESC);

-- Add RLS policies
ALTER TABLE matching_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for matching_scores (readable by both parties)
CREATE POLICY "Users can view matching scores for their profiles" 
  ON matching_scores FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles pp 
      JOIN profiles p ON pp.profile_id = p.id 
      WHERE pp.id = matching_scores.player_profile_id AND p.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM opportunities o 
      JOIN club_profiles cp ON o.club_profile_id = cp.id 
      JOIN profiles p ON cp.profile_id = p.id 
      WHERE o.id = matching_scores.opportunity_id AND p.id = auth.uid()
    )
  );

-- Policies for player_skills
CREATE POLICY "Users can manage their own skills" 
  ON player_skills FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles pp 
      JOIN profiles p ON pp.profile_id = p.id 
      WHERE pp.id = player_skills.player_profile_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Skills are viewable by everyone" 
  ON player_skills FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Policies for opportunity_requirements
CREATE POLICY "Clubs can manage their opportunity requirements" 
  ON opportunity_requirements FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o 
      JOIN club_profiles cp ON o.club_profile_id = cp.id 
      JOIN profiles p ON cp.profile_id = p.id 
      WHERE o.id = opportunity_requirements.opportunity_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Requirements are viewable by everyone" 
  ON opportunity_requirements FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
  ON matching_recommendations FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their recommendations" 
  ON matching_recommendations FOR UPDATE 
  USING (user_id = auth.uid());
