"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  AthletePassport, 
  PrivacySettings,
  EvidenceChecklist
} from "../verifications/types";

/**
 * Get athlete passport for current user
 */
export async function getMyPassport() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { passport: null, error: "Not authenticated" };
  
  const { data: passport, error } = await supabase
    .from("athlete_passports")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching passport:", error);
    return { passport: null, error: error.message };
  }
  
  // If no passport exists, create one
  if (!passport) {
    const { data: newPassport, error: createError } = await supabase
      .from("athlete_passports")
      .insert({ profile_id: user.id })
      .select()
      .single();
      
    if (createError) {
      return { passport: null, error: createError.message };
    }
    
    return { passport: newPassport, error: null };
  }
  
  return { passport, error: null };
}

/**
 * Get athlete passport by profile ID (for public viewing)
 */
export async function getPassportByProfileId(profileId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get passport
  const { data: passport, error } = await supabase
    .from("athlete_passports")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
    
  if (error || !passport) {
    return { passport: null, error: "Passport not found" };
  }
  
  // Check visibility permissions
  const visibility = passport.privacy_settings?.passport_visibility || 'clubs_only';
  
  // If public, allow
  if (visibility === 'public') {
    return { passport, error: null };
  }
  
  // If private and not owner, deny
  if (visibility === 'private' && user?.id !== profileId) {
    return { passport: null, error: "Passport is private" };
  }
  
  // If clubs_only, check if user is a verified club
  if (visibility === 'clubs_only' && user) {
    const { data: clubVerification } = await supabase
      .from("club_verifications")
      .select("id")
      .eq("club_profile_id", user.id)
      .eq("verification_status", 'verified')
      .maybeSingle();
      
    if (!clubVerification && user.id !== profileId) {
      return { passport: null, error: "Only verified clubs can view this passport" };
    }
  }
  
  // Passport-only visibility - allow if direct link accessed
  // (additional logic can be added here for link-based access)
  
  return { passport, error: null };
}

/**
 * Update passport privacy settings
 */
export async function updatePrivacySettings(settings: PrivacySettings) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  const { error } = await supabase
    .from("athlete_passports")
    .update({
      privacy_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/athlete/passport");
  revalidatePath(`/passport/${user.id}`);
  
  return { success: true, error: null };
}

/**
 * Update evidence checklist
 */
export async function updateEvidenceChecklist(checklist: Partial<EvidenceChecklist>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Get current passport to merge checklist
  const { data: passport } = await supabase
    .from("athlete_passports")
    .select("evidence_checklist, profile_completion_percentage")
    .eq("profile_id", user.id)
    .single();
    
  const currentChecklist = passport?.evidence_checklist || {};
  const updatedChecklist = { ...currentChecklist, ...checklist };
  
  // Calculate new completion percentage
  const totalItems = Object.keys(updatedChecklist).length;
  const completedItems = Object.values(updatedChecklist).filter(Boolean).length;
  const newCompletionPercentage = Math.round((completedItems / totalItems) * 100);
  
  const { error } = await supabase
    .from("athlete_passports")
    .update({
      evidence_checklist: updatedChecklist,
      profile_completion_percentage: newCompletionPercentage,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Recalculate readiness score
  await recalculateReadinessScore(user.id);
  
  revalidatePath("/athlete/passport");
  revalidatePath(`/passport/${user.id}`);
  
  return { success: true, completionPercentage: newCompletionPercentage, error: null };
}

/**
 * Request identity verification
 */
export async function requestIdentityVerification() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // In a real implementation, this would trigger a verification workflow
  // For now, we'll just update the status to "under_review"
  const { error } = await supabase
    .from("athlete_passports")
    .update({
      passport_status: 'under_review',
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/athlete/passport");
  
  return { success: true, error: null };
}

/**
 * Update club information
 */
export async function updateClubInfo(
  currentClubName: string,
  previousClubs?: { name: string; period_from?: string; period_to?: string }[]
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  const updateData: any = {
    current_club_name: currentClubName,
    current_club_verified: false, // Will need verification
    updated_at: new Date().toISOString(),
  };
  
  if (previousClubs) {
    updateData.previous_clubs = previousClubs;
  }
  
  const { error } = await supabase
    .from("athlete_passports")
    .update(updateData)
    .eq("profile_id", user.id);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/athlete/passport");
  
  return { success: true, error: null };
}

/**
 * Recalculate readiness score
 */
export async function recalculateReadinessScore(profileId: string) {
  const supabase = await createClient();
  
  const { data: passport } = await supabase
    .from("athlete_passports")
    .select("*")
    .eq("profile_id", profileId)
    .single();
    
  if (!passport) return { score: 0, error: "Passport not found" };
  
  let score = 0;
  
  // Identity verification (20 points)
  if (passport.identity_verified) score += 20;
  
  // Age verification (10 points)
  if (passport.age_band_verified) score += 10;
  
  // Club history (15 points)
  if (passport.current_club_verified) score += 15;
  
  // Profile completeness (25 points max)
  const completionPoints = Math.min(25, Math.round((passport.profile_completion_percentage / 100) * 25));
  score += completionPoints;
  
  // Engagement bonus (10 points)
  // Could be calculated from activity metrics
  score += 5; // Base engagement
  
  // Trust score bonus (20 points max)
  const trustBonus = Math.min(20, Math.round((passport.trust_score || 0) / 5));
  score += trustBonus;
  
  // Update score
  const { error } = await supabase
    .from("athlete_passports")
    .update({
      readiness_score: Math.min(100, score),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profileId);
    
  if (error) {
    return { score: 0, error: error.message };
  }
  
  revalidatePath("/athlete/passport");
  revalidatePath(`/passport/${profileId}`);
  
  return { score: Math.min(100, score), error: null };
}

/**
 * Activate passport (publish it)
 */
export async function activatePassport() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Check minimum requirements
  const { data: passport } = await supabase
    .from("athlete_passports")
    .select("profile_completion_percentage, identity_verified")
    .eq("profile_id", user.id)
    .single();
    
  if (!passport) {
    return { success: false, error: "Passport not found" };
  }
  
  // Require at least 40% completion and identity
  if (passport.profile_completion_percentage < 40) {
    return { 
      success: false, 
      error: `Profile completion must be at least 40% (currently ${passport.profile_completion_percentage}%)` 
    };
  }
  
  const { error } = await supabase
    .from("athlete_passports")
    .update({
      passport_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/athlete/passport");
  revalidatePath(`/passport/${user.id}`);
  
  return { success: true, error: null };
}
