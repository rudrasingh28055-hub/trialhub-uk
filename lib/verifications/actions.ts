"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  ClubVerificationInput, 
  VerificationDocument,
  TrustReportInput,
  DocumentType
} from "./types";

/**
 * Get club verification status for a specific club
 */
export async function getClubVerification(clubProfileId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("club_verifications")
    .select(`
      *,
      club_verification_documents(*)
    `)
    .eq("club_profile_id", clubProfileId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching club verification:", error);
    return { verification: null, error: error.message };
  }
  
  return { verification: data, error: null };
}

/**
 * Get club trust score
 */
export async function getClubTrustScore(clubProfileId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("club_trust_scores")
    .select("*")
    .eq("club_profile_id", clubProfileId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching trust score:", error);
    return { trustScore: null, error: error.message };
  }
  
  return { trustScore: data, error: null };
}

/**
 * Get current user's club verification (if they own a club)
 */
export async function getMyClubVerification() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { verification: null, trustScore: null, error: "Not authenticated" };
  
  // Get the club profile for this user
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
    
  if (!clubProfile) return { verification: null, trustScore: null, error: "No club profile" };
  
  // Get verification
  const { data: verification } = await supabase
    .from("club_verifications")
    .select(`
      *,
      club_verification_documents(*)
    `)
    .eq("club_profile_id", clubProfile.id)
    .maybeSingle();
    
  // Get trust score
  const { data: trustScore } = await supabase
    .from("club_trust_scores")
    .select("*")
    .eq("club_profile_id", clubProfile.id)
    .maybeSingle();
    
  return { verification, trustScore, error: null, clubProfileId: clubProfile.id };
}

/**
 * Submit club verification application
 */
export async function submitClubVerification(
  clubProfileId: string,
  input: ClubVerificationInput
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify ownership
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id")
    .eq("id", clubProfileId)
    .eq("profile_id", user.id)
    .maybeSingle();
    
  if (!clubProfile) return { success: false, error: "Not authorized" };
  
  // Check if already has pending verification
  const { data: existing } = await supabase
    .from("club_verifications")
    .select("id, verification_status")
    .eq("club_profile_id", clubProfileId)
    .maybeSingle();
    
  if (existing && existing.verification_status === 'pending') {
    return { success: false, error: "Already have a pending verification" };
  }
  
  if (existing && existing.verification_status === 'verified') {
    return { success: false, error: "Already verified" };
  }
  
  // Submit verification
  const { data, error } = await supabase
    .from("club_verifications")
    .upsert({
      club_profile_id: clubProfileId,
      verification_status: 'pending',
      submitted_at: new Date().toISOString(),
      ...input,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'club_profile_id'
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error submitting verification:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/club/verification");
  revalidatePath("/club/dashboard");
  
  return { success: true, verification: data, error: null };
}

/**
 * Upload verification document
 */
export async function uploadVerificationDocument(
  clubVerificationId: string,
  documentType: DocumentType,
  fileUrl: string,
  fileName?: string,
  fileSize?: number,
  mimeType?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Verify ownership through verification -> club relationship
  const { data: verification } = await supabase
    .from("club_verifications")
    .select(`
      id,
      verification_status,
      club_profile_id,
      club_profiles!inner(profile_id)
    `)
    .eq("id", clubVerificationId)
    .maybeSingle();
    
  if (!verification) return { success: false, error: "Verification not found" };
  
  // Check if user owns this club - handle nested profile_id
  const clubProfile = verification.club_profiles as unknown as { profile_id: string };
  if (clubProfile?.profile_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  if (verification.verification_status !== 'pending') {
    return { success: false, error: "Can only upload to pending verifications" };
  }
  
  // Create document record
  const { data, error } = await supabase
    .from("club_verification_documents")
    .insert({
      club_verification_id: clubVerificationId,
      document_type: documentType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      uploaded_by: user.id,
      verification_status: 'pending',
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error uploading document:", error);
    return { success: false, error: error.message };
  }
  
  // Update verification's submitted_documents array
  const { data: existingDocs } = await supabase
    .from("club_verification_documents")
    .select("document_type, file_url, verification_status")
    .eq("club_verification_id", clubVerificationId);
    
  const submittedDocs = existingDocs?.map(doc => ({
    type: doc.document_type,
    url: doc.file_url,
    status: doc.verification_status
  })) || [];
  
  await supabase
    .from("club_verifications")
    .update({
      submitted_documents: submittedDocs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubVerificationId);
  
  revalidatePath("/club/verification");
  
  return { success: true, document: data, error: null };
}

/**
 * Delete verification document
 */
export async function deleteVerificationDocument(documentId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Get document with verification info
  const { data: document } = await supabase
    .from("club_verification_documents")
    .select(`
      id,
      club_verification_id,
      uploaded_by,
      club_verifications!inner(
        id,
        verification_status,
        club_profile_id,
        club_profiles!inner(profile_id)
      )
    `)
    .eq("id", documentId)
    .maybeSingle();
    
  if (!document) return { success: false, error: "Document not found" };
  
  // Check ownership - handle nested structure
  const verification = document.club_verifications as unknown as {
    verification_status: string;
    club_profiles: { profile_id: string };
  };
  
  if (verification?.club_profiles?.profile_id !== user.id && document.uploaded_by !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  if (verification?.verification_status !== 'pending') {
    return { success: false, error: "Can only delete from pending verifications" };
  }
  
  const { error } = await supabase
    .from("club_verification_documents")
    .delete()
    .eq("id", documentId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath("/club/verification");
  
  return { success: true, error: null };
}

/**
 * Submit a trust report
 */
export async function submitTrustReport(input: TrustReportInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("trust_reports")
    .insert({
      reporter_profile_id: user?.id,
      reporter_email: input.reporter_email || user?.email,
      reported_entity_type: input.reported_entity_type,
      reported_entity_id: input.reported_entity_id,
      report_type: input.report_type,
      description: input.description,
      evidence_urls: input.evidence_urls || [],
      status: 'submitted',
      priority: 'low',
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error submitting report:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true, report: data, error: null };
}

/**
 * Get verification statistics (for admin/insights)
 */
export async function getVerificationStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { stats: null, error: "Not authenticated" };
  
  // Get counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .rpc('get_verification_counts_by_status');
    
  if (statusError) {
    // Fallback to manual query if RPC doesn't exist
    const { data: allVerifications } = await supabase
      .from("club_verifications")
      .select("verification_status");
      
    const stats = {
      pending: allVerifications?.filter(v => v.verification_status === 'pending').length || 0,
      in_review: allVerifications?.filter(v => v.verification_status === 'in_review').length || 0,
      verified: allVerifications?.filter(v => v.verification_status === 'verified').length || 0,
      rejected: allVerifications?.filter(v => v.verification_status === 'rejected').length || 0,
      suspended: allVerifications?.filter(v => v.verification_status === 'suspended').length || 0,
    };
    
    return { stats, error: null };
  }
  
  return { stats: statusCounts, error: null };
}

/**
 * Calculate trust score for a club
 */
export async function recalculateTrustScore(clubProfileId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  
  // Only club owners or admins can trigger recalculation
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("profile_id")
    .eq("id", clubProfileId)
    .maybeSingle();
    
  if (!clubProfile || clubProfile.profile_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }
  
  const { data, error } = await supabase
    .rpc('calculate_club_trust_score', { p_club_profile_id: clubProfileId });
    
  if (error) {
    console.error("Error calculating trust score:", error);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/club/dashboard");
  revalidatePath(`/club/${clubProfileId}`);
  
  return { success: true, score: data, error: null };
}
