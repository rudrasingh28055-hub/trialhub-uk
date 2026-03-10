-- Create verification_documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- identity, education, employment, skill_certificate, etc.
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, expired
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  expiry_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create trust_scores table
CREATE TABLE IF NOT EXISTS trust_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  identity_verification_score INTEGER CHECK (identity_verification_score >= 0 AND identity_verification_score <= 100),
  experience_verification_score INTEGER CHECK (experience_verification_score >= 0 AND experience_verification_score <= 100),
  skill_verification_score INTEGER CHECK (skill_verification_score >= 0 AND skill_verification_score <= 100),
  review_score INTEGER CHECK (review_score >= 0 AND review_score <= 100),
  activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
  calculation_factors JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_type VARCHAR(50) NOT NULL, -- club_to_player, player_to_club, club_to_club
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create review_categories table
CREATE TABLE IF NOT EXISTS review_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL, -- communication, professionalism, skills, punctuality, etc.
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL, -- identity, background_check, skill_assessment
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blockchain_credentials table for verified credentials
CREATE TABLE IF NOT EXISTS blockchain_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL, -- achievement, certificate, badge
  credential_name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  blockchain_hash VARCHAR(255) NOT NULL,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create verification_badges table
CREATE TABLE IF NOT EXISTS verification_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_icon VARCHAR(255),
  badge_color VARCHAR(50),
  requirements JSONB NOT NULL, -- JSON defining what criteria must be met
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES verification_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  awarded_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_docs_user ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_status ON verification_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_overall ON trust_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_categories_review ON review_categories(review_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_credentials_user ON blockchain_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- Enable RLS
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Verification documents: Users can view their own, public can view verified
CREATE POLICY "Users can view their own documents" 
  ON verification_documents FOR SELECT 
  USING (user_id = auth.uid() OR verification_status = 'verified');

CREATE POLICY "Users can manage their own documents" 
  ON verification_documents FOR ALL 
  USING (user_id = auth.uid());

-- Trust scores: Public can view
CREATE POLICY "Trust scores are publicly viewable" 
  ON trust_scores FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Reviews: Public can view verified reviews
CREATE POLICY "Verified reviews are publicly viewable" 
  ON reviews FOR SELECT 
  TO authenticated, anon 
  USING (is_verified = true);

CREATE POLICY "Reviewers can manage their own reviews" 
  ON reviews FOR ALL 
  USING (reviewer_id = auth.uid());

-- Review categories
CREATE POLICY "Review categories are publicly viewable" 
  ON review_categories FOR SELECT 
  TO authenticated, anon 
  USING (
    EXISTS (
      SELECT 1 FROM reviews r 
      WHERE r.id = review_categories.review_id AND r.is_verified = true
    )
  );

-- Verification requests
CREATE POLICY "Users can view their own requests" 
  ON verification_requests FOR SELECT 
  USING (user_id = auth.uid());

-- Blockchain credentials: Public can view
CREATE POLICY "Blockchain credentials are publicly viewable" 
  ON blockchain_credentials FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Verification badges: Public can view
CREATE POLICY "Verification badges are publicly viewable" 
  ON verification_badges FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "User badges are publicly viewable" 
  ON user_badges FOR SELECT 
  TO authenticated, anon 
  USING (true);

-- Functions

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_identity_score INTEGER;
  v_experience_score INTEGER;
  v_skill_score INTEGER;
  v_review_score INTEGER;
  v_activity_score INTEGER;
  v_overall_score INTEGER;
BEGIN
  -- Identity verification score (0-25 points)
  SELECT COALESCE(
    CASE 
      WHEN COUNT(*) FILTER (WHERE verification_status = 'verified') >= 3 THEN 25
      WHEN COUNT(*) FILTER (WHERE verification_status = 'verified') >= 2 THEN 20
      WHEN COUNT(*) FILTER (WHERE verification_status = 'verified') >= 1 THEN 15
      ELSE 5
    END, 0
  ) INTO v_identity_score
  FROM verification_documents
  WHERE user_id = p_user_id;

  -- Experience verification score (0-25 points)
  SELECT COALESCE(
    LEAST(25, (COUNT(*) FILTER (WHERE verification_status = 'verified') * 5)), 0
  ) INTO v_experience_score
  FROM verification_documents
  WHERE user_id = p_user_id AND document_type IN ('employment', 'previous_club', 'contract');

  -- Skill verification score (0-20 points)
  SELECT COALESCE(
    LEAST(20, (COUNT(*) FILTER (WHERE verification_status = 'verified') * 4)), 0
  ) INTO v_skill_score
  FROM verification_documents
  WHERE user_id = p_user_id AND document_type IN ('skill_certificate', 'achievement', 'award');

  -- Review score (0-20 points)
  SELECT COALESCE(
    CASE 
      WHEN COUNT(*) > 0 THEN LEAST(20, (AVG(rating) / 5.0 * 20))
      ELSE 0
    END, 0
  ) INTO v_review_score
  FROM reviews
  WHERE reviewed_id = p_user_id AND is_verified = true;

  -- Activity score (0-10 points)
  SELECT COALESCE(
    LEAST(10, (
      (SELECT COUNT(*) FROM applications WHERE player_profile_id IN (
        SELECT id FROM player_profiles WHERE profile_id = p_user_id
      )) +
      (SELECT COUNT(*) FROM invites WHERE player_profile_id IN (
        SELECT id FROM player_profiles WHERE profile_id = p_user_id
      )) +
      (SELECT COUNT(*) FROM messages WHERE sender_id = p_user_id)
    ) / 10), 0
  ) INTO v_activity_score;

  -- Calculate overall score
  v_overall_score := v_identity_score + v_experience_score + v_skill_score + v_review_score + v_activity_score;

  -- Update or insert trust score
  INSERT INTO trust_scores (
    user_id, overall_score, identity_verification_score, experience_verification_score,
    skill_verification_score, review_score, activity_score, last_calculated_at
  ) VALUES (
    p_user_id, v_overall_score, v_identity_score, v_experience_score,
    v_skill_score, v_review_score, v_activity_score, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    identity_verification_score = EXCLUDED.identity_verification_score,
    experience_verification_score = EXCLUDED.experience_verification_score,
    skill_verification_score = EXCLUDED.skill_verification_score,
    review_score = EXCLUDED.review_score,
    activity_score = EXCLUDED.activity_score,
    last_calculated_at = EXCLUDED.last_calculated_at;

  RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to verify a review
CREATE OR REPLACE FUNCTION verify_review(p_review_id UUID, p_verifier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews 
  SET is_verified = true, updated_at = now()
  WHERE id = p_review_id;

  -- Recalculate trust score for the reviewed user
  PERFORM calculate_trust_score((SELECT reviewed_id FROM reviews WHERE id = p_review_id));
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-recalculate trust scores
CREATE OR REPLACE FUNCTION trigger_recalculate_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'verification_documents' THEN
    PERFORM calculate_trust_score(NEW.user_id);
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    PERFORM calculate_trust_score(NEW.reviewed_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_verified
  AFTER UPDATE ON verification_documents
  FOR EACH ROW
  WHEN (NEW.verification_status = 'verified' AND OLD.verification_status != 'verified')
  EXECUTE FUNCTION trigger_recalculate_trust_score();

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trust_score();
