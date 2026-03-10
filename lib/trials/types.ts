export type TrialStatus = 
  | 'draft' 
  | 'published' 
  | 'closed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type TrialType = 'open' | 'invite_only' | 'academy';

export type RegistrationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'attended' 
  | 'no_show' 
  | 'cancelled';

export type OutcomeStatus = 
  | 'pending' 
  | 'offered_contract' 
  | 'rejected' 
  | 'waitlist' 
  | 'academy_invite';

export type EvaluationRecommendation = 
  | 'offer_contract' 
  | 'invite_academy' 
  | 'reject' 
  | 'watch_list' 
  | 're_trial';

// Trial Event
export interface TrialEvent {
  id: string;
  club_profile_id: string;
  
  // Basic Info
  title: string;
  description?: string;
  type: TrialType;
  
  // Schedule
  date: string;
  start_time: string;
  end_time: string;
  
  // Location
  location_address?: string;
  location_coordinates?: { lat: number; lng: number };
  
  // Eligibility
  age_eligibility?: { min?: number; max?: number };
  positions_needed?: string[];
  
  // Capacity
  capacity_total: number;
  capacity_remaining: number;
  
  // Registration Window
  registration_opens_at?: string;
  registration_closes_at?: string;
  
  // Requirements
  requires_passport: boolean;
  requires_verified_identity: boolean;
  
  // Status
  status: TrialStatus;
  
  // Relations
  evaluation_template_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Counts (from joins)
  trial_registrations?: { count: number }[];
}

export interface TrialEventInput {
  title: string;
  description?: string;
  type: TrialType;
  date: string;
  start_time: string;
  end_time: string;
  location_address?: string;
  location_coordinates?: { lat: number; lng: number };
  age_eligibility?: { min?: number; max?: number };
  positions_needed?: string[];
  capacity_total: number;
  registration_opens_at?: string;
  registration_closes_at?: string;
  requires_passport?: boolean;
  requires_verified_identity?: boolean;
  evaluation_template_id?: string;
}

// Trial Registration
export interface TrialRegistration {
  id: string;
  trial_event_id: string;
  athlete_profile_id: string;
  
  status: RegistrationStatus;
  registered_at: string;
  confirmed_at?: string;
  checked_in_at?: string;
  
  guardian_consent: boolean;
  special_requirements?: string;
  notes?: string;
  
  outcome_status: OutcomeStatus;
  
  // Joins
  trial_events?: TrialEvent;
  athlete_passports?: {
    profile_id: string;
    identity_verified: boolean;
    age_band?: string;
    current_club_name?: string;
  };
  profiles?: {
    full_name: string;
    city?: string;
  };
}

// Evaluation Template
export interface EvaluationTemplate {
  id: string;
  club_profile_id: string;
  
  name: string;
  description?: string;
  
  categories: string[];
  criteria: EvaluationCriterion[];
  
  max_score_per_category: Record<string, number>;
  total_max_score: number;
  
  is_default: boolean;
  is_active: boolean;
  
  created_at: string;
}

export interface EvaluationCriterion {
  category: string;
  name: string;
  description?: string;
  max_score: number;
}

// Trial Evaluation
export interface TrialEvaluation {
  id: string;
  trial_event_id: string;
  athlete_profile_id: string;
  evaluator_profile_id: string;
  
  evaluation_data: Record<string, number>;
  total_score: number;
  percentage_score: number;
  
  strengths?: string[];
  development_areas?: string[];
  
  recommendation: EvaluationRecommendation;
  notes?: string;
  
  evaluated_at: string;
  athlete_viewable: boolean;
  
  // Joins
  trial_events?: TrialEvent;
  profiles?: {
    full_name: string;
  };
}

// UI Component Types
export interface TrialCardProps {
  trial: TrialEvent;
  isClubView?: boolean;
  onRegister?: () => void;
}

export interface RegistrationListProps {
  registrations: TrialRegistration[];
  isClubView: boolean;
  onCheckIn?: (id: string) => void;
  onEvaluate?: (id: string) => void;
}

export interface EvaluationFormProps {
  template: EvaluationTemplate;
  athleteName: string;
  onSubmit: (data: {
    scores: Record<string, number>;
    strengths: string[];
    developmentAreas: string[];
    recommendation: EvaluationRecommendation;
    notes: string;
  }) => void;
}
