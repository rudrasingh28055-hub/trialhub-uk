export type VerificationStatus = 
  | 'pending' 
  | 'in_review' 
  | 'verified' 
  | 'rejected' 
  | 'suspended';

export type VerificationTier = 
  | 'unverified' 
  | 'bronze' 
  | 'silver' 
  | 'gold';

export type DocumentType = 
  | 'registration_certificate'
  | 'insurance_certificate'
  | 'safeguarding_policy'
  | 'facility_photos'
  | 'dbs_checks'
  | 'club_constitution'
  | 'fa_affiliation'
  | 'risk_assessment';

export type DocumentStatus = 
  | 'pending' 
  | 'verified' 
  | 'rejected' 
  | 'expired';

export type ReportType = 
  | 'fake_opportunity'
  | 'suspicious_agent'
  | 'inappropriate_behavior'
  | 'safeguarding_concern'
  | 'misrepresentation'
  | 'spam'
  | 'other';

export type ReportStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'investigating' 
  | 'resolved' 
  | 'rejected';

export type ReportPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

// Club Verification
export interface ClubVerification {
  id: string;
  club_profile_id: string;
  verification_status: VerificationStatus;
  submitted_at: string;
  reviewed_at?: string;
  verified_at?: string;
  badge_expires_at?: string;
  
  // Legal Entity
  legal_entity_name?: string;
  registration_number?: string;
  website?: string;
  year_established?: number;
  
  // Contact & Safeguarding
  primary_contact_name: string;
  contact_email: string;
  contact_phone?: string;
  safeguarding_officer_name?: string;
  safeguarding_officer_email?: string;
  safeguarding_officer_phone?: string;
  
  // Facilities
  facilities_address?: string;
  facilities_postcode?: string;
  facilities_verified: boolean;
  facilities_description?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  insurance_coverage_amount?: number;
  
  // Metadata
  submitted_documents: VerificationDocument[];
  reviewer_notes?: string;
  reviewed_by?: string;
  verification_badge_issued: boolean;
  verification_tier: VerificationTier;
  
  created_at: string;
  updated_at: string;
}

export interface ClubVerificationInput {
  legal_entity_name?: string;
  registration_number?: string;
  website?: string;
  year_established?: number;
  primary_contact_name: string;
  contact_email: string;
  contact_phone?: string;
  safeguarding_officer_name?: string;
  safeguarding_officer_email?: string;
  safeguarding_officer_phone?: string;
  facilities_address?: string;
  facilities_postcode?: string;
  facilities_description?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  insurance_coverage_amount?: number;
}

// Verification Documents
export interface VerificationDocument {
  id: string;
  club_verification_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by?: string;
  verification_status: DocumentStatus;
  reviewer_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  expires_at?: string;
}

// Club Trust Score
export interface ClubTrustScore {
  club_profile_id: string;
  overall_score: number;
  verification_score: number;
  response_rate_score: number;
  athlete_satisfaction_score: number;
  transparency_score: number;
  verification_tier: VerificationTier;
  fake_reports_count: number;
  resolved_reports_count: number;
  pending_reports_count: number;
  total_opportunities_posted: number;
  total_trials_hosted: number;
  total_applications_received: number;
  response_rate_percentage: number;
  avg_response_time_hours?: number;
  athlete_satisfaction_avg?: number;
  total_reviews_received: number;
  last_calculated_at?: string;
  updated_at: string;
}

// Trust Reports
export interface TrustReport {
  id: string;
  reporter_profile_id?: string;
  reporter_email?: string;
  reporter_ip_hash?: string;
  reported_entity_type: 'club' | 'opportunity' | 'profile' | 'message' | 'agent';
  reported_entity_id: string;
  report_type: ReportType;
  description: string;
  evidence_urls: string[];
  status: ReportStatus;
  priority: ReportPriority;
  assigned_reviewer?: string;
  resolution_notes?: string;
  action_taken?: string;
  created_at: string;
  reviewed_at?: string;
  resolved_at?: string;
  reporter_notified: boolean;
}

export interface TrustReportInput {
  reported_entity_type: TrustReport['reported_entity_type'];
  reported_entity_id: string;
  report_type: ReportType;
  description: string;
  evidence_urls?: string[];
  reporter_email?: string;
}

// Athlete Passport
export interface AthletePassport {
  profile_id: string;
  passport_status: 'draft' | 'active' | 'under_review' | 'suspended';
  identity_verified: boolean;
  id_verified_at?: string;
  id_verification_method?: string;
  age_band_verified: boolean;
  age_verified_at?: string;
  age_band?: 'u16' | 'u18' | 'u21' | 'senior';
  date_of_birth_verified?: string;
  current_club_verified: boolean;
  current_club_name?: string;
  current_club_verified_at?: string;
  previous_clubs: PreviousClub[];
  readiness_score: number;
  profile_completion_percentage: number;
  trust_score: number;
  evidence_checklist: EvidenceChecklist;
  privacy_settings: PrivacySettings;
  guardian_mode_enabled: boolean;
  guardian_consent_obtained: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreviousClub {
  name: string;
  verified: boolean;
  position?: string;
  period_from?: string;
  period_to?: string;
  verified_at?: string;
}

export interface EvidenceChecklist {
  identity_document: boolean;
  proof_of_age: boolean;
  current_club_letter: boolean;
  coach_endorsement: boolean;
  highlight_video: boolean;
  academic_records: boolean;
  medical_clearance: boolean;
}

export interface PrivacySettings {
  passport_visibility: 'public' | 'clubs_only' | 'passport_only' | 'private';
  show_full_name: boolean;
  show_contact_info: boolean;
  allow_club_messages: boolean;
  auto_share_with_verified_clubs: boolean;
}

// Verification Display Components
export interface VerificationBadgeProps {
  tier: VerificationTier;
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export interface TrustScoreDisplayProps {
  score: number;
  tier: VerificationTier;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface VerificationStatusCardProps {
  verification: ClubVerification | null;
  trustScore: ClubTrustScore | null;
  isOwner: boolean;
}
