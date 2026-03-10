-- Migration: Verified Club System & Trust Infrastructure
-- Creates the foundation for club verification, trust scoring, and safeguarding

-- ============================================
-- 1. CLUB VERIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS club_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_profile_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  
  -- Verification Status
  verification_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'in_review', 'verified', 'rejected', 'suspended')),
  
  -- Timeline
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  badge_expires_at TIMESTAMPTZ,
  
  -- Legal Entity Information
  legal_entity_name TEXT,
  registration_number TEXT,
  website TEXT,
  year_established INTEGER,
  
  -- Contact & Safeguarding
  primary_contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  safeguarding_officer_name TEXT,
  safeguarding_officer_email TEXT,
  safeguarding_officer_phone TEXT,
  
  -- Facilities
  facilities_address TEXT,
  facilities_postcode TEXT,
  facilities_verified BOOLEAN DEFAULT FALSE,
  facilities_description TEXT,
  
  -- Insurance
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  insurance_coverage_amount INTEGER, -- in GBP
  
  -- Verification Metadata
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  verification_badge_issued BOOLEAN DEFAULT FALSE,
  
  -- Trust Tiers
  verification_tier TEXT DEFAULT 'unverified' 
    CHECK (verification_tier IN ('unverified', 'bronze', 'silver', 'gold')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(club_profile_id)
);

-- ============================================
-- 2. CLUB VERIFICATION DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS club_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_verification_id UUID NOT NULL REFERENCES club_verifications(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL 
    CHECK (document_type IN (
      'registration_certificate',
      'insurance_certificate',
      'safeguarding_policy',
      'facility_photos',
      'dbs_checks',
      'club_constitution',
      'fa_affiliation',
      'risk_assessment'
    )),
  
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id),
  
  -- Review Status
  verification_status TEXT DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CLUB TRUST SCORES
-- ============================================
CREATE TABLE IF NOT EXISTS club_trust_scores (
  club_profile_id UUID PRIMARY KEY REFERENCES club_profiles(id) ON DELETE CASCADE,
  
  -- Overall Score (0-100)
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Component Scores
  verification_score INTEGER DEFAULT 0,
  response_rate_score INTEGER DEFAULT 0,
  athlete_satisfaction_score INTEGER DEFAULT 0,
  transparency_score INTEGER DEFAULT 0,
  
  -- Verification Tier
  verification_tier TEXT DEFAULT 'unverified' 
    CHECK (verification_tier IN ('unverified', 'bronze', 'silver', 'gold')),
  
  -- Metrics
  fake_reports_count INTEGER DEFAULT 0,
  resolved_reports_count INTEGER DEFAULT 0,
  pending_reports_count INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  total_opportunities_posted INTEGER DEFAULT 0,
  total_trials_hosted INTEGER DEFAULT 0,
  total_applications_received INTEGER DEFAULT 0,
  response_rate_percentage INTEGER DEFAULT 0,
  avg_response_time_hours INTEGER,
  
  -- Athlete Feedback
  athlete_satisfaction_avg DECIMAL(3,2),
  total_reviews_received INTEGER DEFAULT 0,
  
  -- Calculation Metadata
  last_calculated_at TIMESTAMPTZ,
  calculation_version INTEGER DEFAULT 1,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ATHLETE PASSPORTS (Foundation Table)
-- ============================================
CREATE TABLE IF NOT EXISTS athlete_passports (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Passport Status
  passport_status TEXT DEFAULT 'draft' 
    CHECK (passport_status IN ('draft', 'active', 'under_review', 'suspended')),
  
  -- Identity Verification
  identity_verified BOOLEAN DEFAULT FALSE,
  id_verified_at TIMESTAMPTZ,
  id_verification_method TEXT,
  
  -- Age Verification
  age_band_verified BOOLEAN DEFAULT FALSE,
  age_verified_at TIMESTAMPTZ,
  age_band TEXT CHECK (age_band IN ('u16', 'u18', 'u21', 'senior')),
  date_of_birth_verified DATE,
  
  -- Club History
  current_club_verified BOOLEAN DEFAULT FALSE,
  current_club_name TEXT,
  current_club_verified_at TIMESTAMPTZ,
  previous_clubs JSONB DEFAULT '[]'::jsonb,
  
  -- Scores
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Evidence Checklist
  evidence_checklist JSONB DEFAULT '{
    "identity_document": false,
    "proof_of_age": false,
    "current_club_letter": false,
    "coach_endorsement": false,
    "highlight_video": false,
    "academic_records": false,
    "medical_clearance": false
  }'::jsonb,
  
  -- Privacy Settings
  privacy_settings JSONB DEFAULT '{
    "passport_visibility": "clubs_only",
    "show_full_name": true,
    "show_contact_info": false,
    "allow_club_messages": true,
    "auto_share_with_verified_clubs": true
  }'::jsonb,
  
  -- Guardian Mode (for minors)
  guardian_mode_enabled BOOLEAN DEFAULT FALSE,
  guardian_consent_obtained BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TRUST REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS trust_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  reporter_profile_id UUID REFERENCES profiles(id),
  -- Allow anonymous reports with email
  reporter_email TEXT,
  reporter_ip_hash TEXT, -- hashed for privacy
  
  -- Report Target
  reported_entity_type TEXT NOT NULL 
    CHECK (reported_entity_type IN ('club', 'opportunity', 'profile', 'message', 'agent')),
  reported_entity_id UUID NOT NULL,
  
  -- Report Details
  report_type TEXT NOT NULL 
    CHECK (report_type IN (
      'fake_opportunity',
      'suspicious_agent',
      'inappropriate_behavior',
      'safeguarding_concern',
      'misrepresentation',
      'spam',
      'other'
    )),
  
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Status & Priority
  status TEXT DEFAULT 'submitted' 
    CHECK (status IN ('submitted', 'under_review', 'investigating', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'low' 
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Review Process
  assigned_reviewer UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  action_taken TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Reporter Feedback
  reporter_notified BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 6. VERIFICATION AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  entity_type TEXT NOT NULL 
    CHECK (entity_type IN ('club_verification', 'athlete_passport', 'document', 'trust_report')),
  entity_id UUID NOT NULL,
  
  action TEXT NOT NULL 
    CHECK (action IN (
      'submitted', 'review_started', 'approved', 'rejected', 'suspended', 
      'document_uploaded', 'document_verified', 'document_rejected',
      'tier_changed', 'badge_issued', 'badge_revoked'
    )),
  
  performed_by UUID REFERENCES profiles(id),
  performed_by_role TEXT,
  
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_club_verifications_status ON club_verifications(verification_status);
CREATE INDEX idx_club_verifications_tier ON club_verifications(verification_tier);
CREATE INDEX idx_club_verifications_submitted ON club_verifications(submitted_at);

CREATE INDEX idx_verification_documents_status ON club_verification_documents(verification_status);
CREATE INDEX idx_verification_documents_type ON club_verification_documents(document_type);
CREATE INDEX idx_verification_documents_expires ON club_verification_documents(expires_at);

CREATE INDEX idx_trust_reports_status ON trust_reports(status);
CREATE INDEX idx_trust_reports_priority ON trust_reports(priority);
CREATE INDEX idx_trust_reports_entity ON trust_reports(reported_entity_type, reported_entity_id);
CREATE INDEX idx_trust_reports_created ON trust_reports(created_at);

CREATE INDEX idx_audit_log_entity ON verification_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON verification_audit_log(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Club Verifications
ALTER TABLE club_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club verifications viewable by all authenticated users"
  ON club_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clubs can create their own verification"
  ON club_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_profiles cp
      JOIN profiles p ON p.id = auth.uid()
      WHERE cp.id = club_profile_id 
      AND cp.profile_id = auth.uid()
    )
  );

CREATE POLICY "Clubs can update their own pending verification"
  ON club_verifications FOR UPDATE
  TO authenticated
  USING (
    verification_status = 'pending' AND
    EXISTS (
      SELECT 1 FROM club_profiles cp
      WHERE cp.id = club_profile_id 
      AND cp.profile_id = auth.uid()
    )
  );

-- Verification Documents
ALTER TABLE club_verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents viewable by all authenticated users"
  ON club_verification_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clubs can upload their own documents"
  ON club_verification_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_verifications cv
      JOIN club_profiles cp ON cp.id = cv.club_profile_id
      WHERE cv.id = club_verification_id
      AND cp.profile_id = auth.uid()
    )
  );

-- Club Trust Scores
ALTER TABLE club_trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trust scores viewable by all authenticated users"
  ON club_trust_scores FOR SELECT
  TO authenticated
  USING (true);

-- Athlete Passports
ALTER TABLE athlete_passports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view and manage their own passport"
  ON athlete_passports FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Verified clubs can view athlete passports"
  ON athlete_passports FOR SELECT
  TO authenticated
  USING (
    privacy_settings->>'passport_visibility' = 'public' OR
    (
      privacy_settings->>'passport_visibility' = 'clubs_only' AND
      EXISTS (
        SELECT 1 FROM club_profiles cp
        JOIN club_verifications cv ON cv.club_profile_id = cp.id
        WHERE cp.profile_id = auth.uid()
        AND cv.verification_status = 'verified'
      )
    )
  );

-- Trust Reports
ALTER TABLE trust_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON trust_reports FOR SELECT
  TO authenticated
  USING (reporter_profile_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON trust_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_profile_id = auth.uid());

-- Audit Log
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit log viewable by admins and involved parties"
  ON verification_audit_log FOR SELECT
  TO authenticated
  USING (
    performed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_club_verifications_updated_at
  BEFORE UPDATE ON club_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_trust_scores_updated_at
  BEFORE UPDATE ON club_trust_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_passports_updated_at
  BEFORE UPDATE ON athlete_passports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION log_verification_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO verification_audit_log (
    entity_type,
    entity_id,
    action,
    performed_by,
    performed_by_role,
    old_value,
    new_value
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'submitted'
      WHEN TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status THEN
        CASE NEW.verification_status
          WHEN 'verified' THEN 'approved'
          WHEN 'rejected' THEN 'rejected'
          WHEN 'in_review' THEN 'review_started'
          ELSE 'tier_changed'
        END
      ELSE 'updated'
    END,
    COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
    COALESCE(current_setting('app.current_user_role', true), 'system'),
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply audit triggers
CREATE TRIGGER audit_club_verifications
  AFTER INSERT OR UPDATE ON club_verifications
  FOR EACH ROW EXECUTE FUNCTION log_verification_audit();

-- Calculate trust score function
CREATE OR REPLACE FUNCTION calculate_club_trust_score(p_club_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_verification RECORD;
  v_reports INTEGER;
  v_opportunities INTEGER;
  v_response_rate INTEGER;
BEGIN
  -- Get verification data
  SELECT * INTO v_verification 
  FROM club_verifications 
  WHERE club_profile_id = p_club_profile_id;
  
  -- Base verification score (0-40)
  IF v_verification.verification_status = 'verified' THEN
    v_score := v_score + CASE v_verification.verification_tier
      WHEN 'gold' THEN 40
      WHEN 'silver' THEN 30
      WHEN 'bronze' THEN 20
      ELSE 10
    END;
  END IF;
  
  -- Documents score (0-20)
  SELECT COUNT(*) * 4 INTO v_score 
  FROM club_verification_documents 
  WHERE club_verification_id = v_verification.id 
  AND verification_status = 'verified';
  v_score := LEAST(v_score, 20);
  
  -- Penalize for reports (0 to -20)
  SELECT fake_reports_count INTO v_reports
  FROM club_trust_scores 
  WHERE club_profile_id = p_club_profile_id;
  
  v_score := v_score - LEAST(COALESCE(v_reports, 0) * 5, 20);
  
  -- Activity bonus (0-20)
  SELECT COUNT(*) INTO v_opportunities
  FROM opportunities 
  WHERE club_profile_id = p_club_profile_id
  AND status = 'active';
  
  v_score := v_score + LEAST(v_opportunities * 2, 20);
  
  -- Ensure score is within bounds
  v_score := GREATEST(0, LEAST(100, v_score));
  
  -- Update the trust score
  UPDATE club_trust_scores
  SET 
    overall_score = v_score,
    verification_score = CASE WHEN v_verification.verification_status = 'verified' THEN 40 ELSE 0 END,
    last_calculated_at = NOW()
  WHERE club_profile_id = p_club_profile_id;
  
  RETURN v_score;
END;
$$ language 'plpgsql';

-- Trigger to auto-create trust score record
CREATE OR REPLACE FUNCTION create_trust_score_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_trust_scores (club_profile_id)
  VALUES (NEW.club_profile_id)
  ON CONFLICT (club_profile_id) DO NOTHING;
  
  -- Calculate initial score
  PERFORM calculate_club_trust_score(NEW.club_profile_id);
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_trust_score_after_verification
  AFTER INSERT ON club_verifications
  FOR EACH ROW EXECUTE FUNCTION create_trust_score_on_verification();

-- Auto-create athlete passport on profile creation
CREATE OR REPLACE FUNCTION create_athlete_passport()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'athlete' THEN
    INSERT INTO athlete_passports (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_passport_on_athlete_signup
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_athlete_passport();
