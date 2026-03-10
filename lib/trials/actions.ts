import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  TrialEvent,
  TrialRegistration,
  EvaluationTemplate,
  TrialEvaluation
} from "./types";

// ==================== TRIAL EVENTS ====================

/**
 * Create a new trial event
 */
export async function createTrialEvent(
  clubProfileId: string,
  data: {
    title: string;
    description?: string;
    type: 'open' | 'invite_only' | 'academy';
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
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify club ownership
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("id", clubProfileId)
    .eq("profile_id", user.id)
    .maybeSingle();
    
  if (!clubProfile) return { success: false, error: "Not authorized" };
  
  const { data: trial, error } = await supabase
    .from("trial_events")
    .insert({
      club_profile_id: clubProfileId,
      ...data,
      capacity_remaining: data.capacity_total,
      status: 'draft',
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating trial:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/club/trials");
  
  return { success: true, trial, error: null };
}

/**
 * Get trial events for a club
 */
export async function getClubTrialEvents(clubProfileId: string) {
  const supabase = await createClient();
  
  const { data: trials, error } = await supabase
    .from("trial_events")
    .select(`
      *,
      trial_registrations(count)
    `)
    .eq("club_profile_id", clubProfileId)
    .order("date", { ascending: true });
    
  if (error) {
    return { trials: [], error: error.message };
  }
  
  return { trials, error: null };
}

/**
 * Get a specific trial event with details
 */
export async function getTrialEvent(trialEventId: string) {
  const supabase = await createClient();
  
  const { data: trial, error } = await supabase
    .from("trial_events")
    .select(`
      *,
      club_profiles(
        id,
        club_name,
        club_verifications(verification_status, verification_tier)
      ),
      trial_registrations(
        *,
        athlete_passports(
          profile_id,
          identity_verified,
          age_band,
          current_club_name
        ),
        profiles:athlete_profile_id(full_name, city)
      )
    `)
    .eq("id", trialEventId)
    .single();
    
  if (error) {
    return { trial: null, error: error.message };
  }
  
  return { trial, error: null };
}

/**
 * Publish a trial event
 */
export async function publishTrialEvent(trialEventId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify ownership
  const { data: trial } = await supabase
    .from("trial_events")
    .select("club_profile_id, club_profiles!inner(profile_id)")
    .eq("id", trialEventId)
    .single();
    
  if (!trial || (trial.club_profiles as any).profile_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  const { error } = await supabase
    .from("trial_events")
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq("id", trialEventId);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/club/trials");
  
  return { success: true, error: null };
}

// ==================== REGISTRATIONS ====================

/**
 * Register for a trial event
 */
export async function registerForTrial(
  trialEventId: string,
  data: {
    special_requirements?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Get user's athlete profile
  const { data: athletePassport } = await supabase
    .from("athlete_passports")
    .select("profile_id, age_band, guardian_mode_enabled")
    .eq("profile_id", user.id)
    .single();
    
  if (!athletePassport) {
    return { success: false, error: "Athlete passport required" };
  }
  
  // Get trial details
  const { data: trial } = await supabase
    .from("trial_events")
    .select("*, trial_registrations(count)")
    .eq("id", trialEventId)
    .single();
    
  if (!trial) return { success: false, error: "Trial not found" };
  
  // Check eligibility
  if (trial.status !== 'published') {
    return { success: false, error: "Registration not open" };
  }
  
  if (trial.capacity_remaining <= 0) {
    return { success: false, error: "Trial is full" };
  }
  
  // Check age eligibility
  if (trial.age_eligibility && athletePassport.age_band) {
    const ageMap: Record<string, number> = { u16: 16, u18: 18, u21: 21, senior: 25 };
    const athleteAge = ageMap[athletePassport.age_band] || 18;
    
    if (trial.age_eligibility.min && athleteAge < trial.age_eligibility.min) {
      return { success: false, error: `Minimum age requirement: ${trial.age_eligibility.min}` };
    }
    if (trial.age_eligibility.max && athleteAge > trial.age_eligibility.max) {
      return { success: false, error: `Maximum age requirement: ${trial.age_eligibility.max}` };
    }
  }
  
  // Check if already registered
  const { data: existing } = await supabase
    .from("trial_registrations")
    .select("id")
    .eq("trial_event_id", trialEventId)
    .eq("athlete_profile_id", user.id)
    .maybeSingle();
    
  if (existing) {
    return { success: false, error: "Already registered for this trial" };
  }
  
  // Create registration
  const { data: registration, error } = await supabase
    .from("trial_registrations")
    .insert({
      trial_event_id: trialEventId,
      athlete_profile_id: user.id,
      status: 'pending',
      guardian_consent: !athletePassport.guardian_mode_enabled,
      special_requirements: data.special_requirements,
      notes: data.notes,
      outcome_status: 'pending',
    })
    .select()
    .single();
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Update remaining capacity
  await supabase
    .from("trial_events")
    .update({
      capacity_remaining: trial.capacity_remaining - 1,
    })
    .eq("id", trialEventId);
  
  revalidatePath("/trials");
  revalidatePath(`/club/trials/${trialEventId}`);
  
  return { success: true, registration, error: null };
}

/**
 * Get my trial registrations
 */
export async function getMyTrialRegistrations() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { registrations: [], error: "Not authenticated" };
  
  const { data: registrations, error } = await supabase
    .from("trial_registrations")
    .select(`
      *,
      trial_events(
        *,
        club_profiles(club_name, city)
      )
    `)
    .eq("athlete_profile_id", user.id)
    .order("created_at", { ascending: false });
    
  if (error) {
    return { registrations: [], error: error.message };
  }
  
  return { registrations, error: null };
}

/**
 * Confirm attendance at trial
 */
export async function confirmTrialAttendance(registrationId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  const { error } = await supabase
    .from("trial_registrations")
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
    .eq("athlete_profile_id", user.id);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/athlete/trials");
  
  return { success: true, error: null };
}

/**
 * Club: Check in athlete at trial
 */
export async function checkInAthlete(registrationId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify club ownership
  const { data: registration } = await supabase
    .from("trial_registrations")
    .select(`
      trial_event_id,
      trial_events!inner(
        club_profile_id,
        club_profiles!inner(profile_id)
      )
    `)
    .eq("id", registrationId)
    .single();
    
  if (!registration || (registration.trial_events as any).club_profiles.profile_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  const { error } = await supabase
    .from("trial_registrations")
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", registrationId);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/club/trials/${(registration.trial_events as any).id}`);
  
  return { success: true, error: null };
}

// ==================== EVALUATION TEMPLATES ====================

/**
 * Create evaluation template
 */
export async function createEvaluationTemplate(
  clubProfileId: string,
  data: {
    name: string;
    description?: string;
    categories: string[];
    criteria: {
      category: string;
      name: string;
      description?: string;
      max_score: number;
    }[];
    is_default?: boolean;
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify club ownership
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("id", clubProfileId)
    .eq("profile_id", user.id)
    .maybeSingle();
    
  if (!clubProfile) return { success: false, error: "Not authorized" };
  
  const maxScorePerCategory = data.criteria.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.max_score;
    return acc;
  }, {} as Record<string, number>);
  
  const totalMaxScore = Object.values(maxScorePerCategory).reduce((a, b) => a + b, 0);
  
  const { data: template, error } = await supabase
    .from("evaluation_templates")
    .insert({
      club_profile_id: clubProfileId,
      name: data.name,
      description: data.description,
      categories: data.categories,
      criteria: data.criteria,
      max_score_per_category: maxScorePerCategory,
      total_max_score: totalMaxScore,
      is_default: data.is_default || false,
      is_active: true,
    })
    .select()
    .single();
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/club/trials/templates");
  
  return { success: true, template, error: null };
}

/**
 * Get evaluation templates for a club
 */
export async function getEvaluationTemplates(clubProfileId: string) {
  const supabase = await createClient();
  
  const { data: templates, error } = await supabase
    .from("evaluation_templates")
    .select("*")
    .eq("club_profile_id", clubProfileId)
    .eq("is_active", true)
    .order("is_default", { ascending: false });
    
  if (error) {
    return { templates: [], error: error.message };
  }
  
  return { templates, error: null };
}
