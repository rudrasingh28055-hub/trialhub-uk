import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { VerificationStatusCard } from "../../../components/verification/VerificationStatusCard";
import { DocumentUploadWrapper } from "./DocumentUploadWrapper";
import { VerificationFormWrapper } from "./VerificationFormWrapper";
import { getMyClubVerification } from "../../../lib/verifications/actions";

export default async function ClubVerificationPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  
  // Verify user is a club
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "club") {
    redirect("/feed");
  }
  
  // Get club verification data
  const { verification, trustScore, error, clubProfileId } = await getMyClubVerification();
  
  const hasExistingVerification = !!verification;
  const isPending = verification?.verification_status === 'pending';
  const isVerified = verification?.verification_status === 'verified';
  const canEdit = !hasExistingVerification || isPending;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <PageHeader
          eyebrow="Trust & Safety"
          title="Club Verification"
          subtitle="Complete verification to build trust with athletes and unlock premium features"
          centered
        />
        
        <div className="relative mt-12 grid gap-8 lg:grid-cols-[1fr,1.5fr]">
          {/* Left Column - Status & Trust Score */}
          <div className="space-y-6">
            <VerificationStatusCard 
              verification={verification} 
              trustScore={trustScore}
              isOwner={true}
              clubProfileId={clubProfileId}
            />
            
            {/* Benefits Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-white mb-4">Verification Benefits</h3>
              <ul className="space-y-3">
                <BenefitItem 
                  icon="✓" 
                  text="Verified badge on your club profile"
                  active={isVerified}
                />
                <BenefitItem 
                  icon="✓" 
                  text="Higher ranking in athlete search"
                  active={isVerified}
                />
                <BenefitItem 
                  icon="✓" 
                  text="Access to premium athlete passports"
                  active={isVerified}
                />
                <BenefitItem 
                  icon="✓" 
                  text="Host verified trial events"
                  active={isVerified}
                />
                <BenefitItem 
                  icon="✓" 
                  text="Enhanced trust score multiplier"
                  active={isVerified}
                />
                <BenefitItem 
                  icon="✓" 
                  text="Priority support from AthLink team"
                  active={isVerified && trustScore?.verification_tier === 'gold'}
                  tier="gold"
                />
              </ul>
            </div>
            
            {/* Trust Info */}
            <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-xl">
                  🛡️
                </div>
                <div>
                  <h4 className="font-semibold text-white">Why Verification Matters</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Athletes need to trust that clubs are legitimate, insured, and committed to 
                    their safety. Verification helps us maintain a safe environment for everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Forms */}
          <div className="space-y-6">
            {/* Verification Form */}
            {canEdit && clubProfileId && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm shadow-xl">
                <h3 className="text-xl font-bold text-white mb-2">
                  {hasExistingVerification ? "Complete Your Application" : "Apply for Verification"}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Provide accurate information about your club. All data is securely stored 
                  and only used for verification purposes.
                </p>
                
                <VerificationFormWrapper 
                  clubProfileId={clubProfileId}
                  existingVerification={verification}
                />
              </div>
            )}
            
            {/* Document Upload Section */}
            {canEdit && verification?.id && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm shadow-xl">
                <h3 className="text-xl font-bold text-white mb-2">Upload Documents</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Upload the required documents to support your verification application. 
                  All documents are securely stored and reviewed by our team.
                </p>
                
                <DocumentUploadWrapper 
                  verificationId={verification.id}
                  existingDocuments={verification.club_verification_documents || []}
                />
              </div>
            )}
            
            {/* Under Review Message */}
            {isPending && (
              <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                    <svg className="h-6 w-6 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Under Review</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Your verification application is being reviewed by our trust team. 
                      This typically takes 2-3 business days. You'll receive an email notification 
                      once the review is complete.
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <span className="text-slate-500">
                        Submitted: {new Date(verification?.submitted_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Verified Message */}
            {isVerified && (
              <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl">
                    🎉
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Verification Active</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Your club is verified and trusted by the AthLink community. 
                      Keep your information up to date to maintain your verified status.
                    </p>
                    {verification?.badge_expires_at && (
                      <p className="mt-3 text-sm text-amber-300">
                        Expires: {new Date(verification.badge_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function BenefitItem({ 
  icon, 
  text, 
  active = false,
  tier 
}: { 
  icon: string; 
  text: string; 
  active?: boolean;
  tier?: string;
}) {
  return (
    <li className={`flex items-center gap-3 ${active ? 'text-slate-300' : 'text-slate-500'}`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
        active 
          ? tier === 'gold' 
            ? 'bg-gradient-to-br from-yellow-500 to-amber-400 text-slate-900'
            : 'bg-emerald-500/20 text-emerald-400'
          : 'bg-slate-700 text-slate-500'
      }`}>
        {icon}
      </span>
      <span className="text-sm">{text}</span>
      {tier === 'gold' && active && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 
          text-slate-900 font-semibold">
          GOLD
        </span>
      )}
    </li>
  );
}
