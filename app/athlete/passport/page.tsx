import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyPassport } from "../../../lib/passport/actions";
import { AthletePassportCard } from "../../../components/passport/AthletePassportCard";
import { EvidenceChecklistView } from "../../../components/passport/EvidenceChecklist";
import { PrivacySettingsPanel } from "../../../components/passport/PrivacySettings";
import Link from "next/link";

export default async function AthletePassportPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  
  // Verify user is an athlete
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, city, bio")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "athlete") {
    redirect("/feed");
  }
  
  // Get player profile data
  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("age, primary_position, height_cm")
    .eq("profile_id", user.id)
    .maybeSingle();
  
  // Get passport
  const { passport, error } = await getMyPassport();
  
  const isActive = passport?.passport_status === 'active';
  const canActivate = passport?.profile_completion_percentage && passport.profile_completion_percentage >= 40;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <PageHeader
          eyebrow="Athlete Identity"
          title="Your Passport"
          subtitle="Your verified athletic identity and pathway to opportunities"
          centered
        />
        
        <div className="relative grid gap-8 lg:grid-cols-[1fr,1.5fr]">
          {/* Left Column - Passport Card */}
          <div className="space-y-6">
            <AthletePassportCard 
              passport={passport}
              profile={profile}
              playerProfile={playerProfile}
              isOwner={true}
            />
            
            {/* Activation Card */}
            {!isActive && (
              <div className={`rounded-2xl border p-6 backdrop-blur-sm ${
                canActivate 
                  ? 'border-emerald-400/20 bg-emerald-500/10' 
                  : 'border-amber-400/20 bg-amber-500/10'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    canActivate ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                  }`}>
                    {canActivate ? '🚀' : '📝'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${canActivate ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {canActivate ? 'Ready to Activate' : 'Complete Your Profile'}
                    </h4>
                    <p className="mt-1 text-sm text-slate-400">
                      {canActivate 
                        ? 'Your passport meets the minimum requirements. Activate it to start sharing with clubs.'
                        : `Complete at least 40% of your profile to activate your passport. You're currently at ${passport?.profile_completion_percentage || 0}%.`
                      }
                    </p>
                    {canActivate && (
                      <form action={async () => {
                        "use server";
                        const { activatePassport } = await import("../../../lib/passport/actions");
                        await activatePassport();
                      }}>
                        <button
                          type="submit"
                          className="mt-4 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 
                            px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 
                            transition-all hover:shadow-xl"
                        >
                          Activate Passport
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Share Card */}
            {isActive && (
              <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-sky-300 mb-2">Share Your Passport</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Share your passport link with clubs and scouts
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://athlink.uk'}/passport/${profile.id}`}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 
                      text-sm text-slate-400"
                  />
                  <Link
                    href={`/passport/${profile.id}`}
                    target="_blank"
                    className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-medium 
                      text-sky-300 hover:bg-sky-500/30 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Evidence & Privacy */}
          <div className="space-y-6">
            {/* Evidence Checklist */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">Evidence Checklist</h3>
              <p className="text-sm text-slate-400 mb-6">
                Complete your evidence to strengthen your passport and increase trust with clubs.
              </p>
              
              <EvidenceChecklistView 
                checklist={passport?.evidence_checklist || {
                  identity_document: false,
                  proof_of_age: false,
                  current_club_letter: false,
                  coach_endorsement: false,
                  highlight_video: false,
                  academic_records: false,
                  medical_clearance: false,
                }}
              />
            </div>
            
            {/* Privacy Settings */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">Privacy Settings</h3>
              <p className="text-sm text-slate-400 mb-6">
                Control who can see your passport and what information is shared.
              </p>
              
              <PrivacySettingsPanel 
                settings={passport?.privacy_settings || {
                  passport_visibility: 'clubs_only',
                  show_full_name: true,
                  show_contact_info: false,
                  allow_club_messages: true,
                  auto_share_with_verified_clubs: true,
                }}
              />
            </div>
            
            {/* Next Steps */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h4 className="font-semibold text-white mb-4">Next Steps</h4>
              <ul className="space-y-3">
                <NextStepItem 
                  completed={passport?.identity_verified || false}
                  text="Verify your identity"
                  href="/athlete/passport/verify"
                />
                <NextStepItem 
                  completed={(passport?.profile_completion_percentage || 0) >= 60}
                  text="Complete your profile to 60%"
                  href="/athlete/profile"
                />
                <NextStepItem 
                  completed={passport?.current_club_verified || false}
                  text="Verify your current club"
                  href="/athlete/passport/club"
                />
                <NextStepItem 
                  completed={isActive}
                  text="Activate your passport"
                  href="#"
                  onClick={!isActive ? undefined : () => {}}
                />
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function NextStepItem({ 
  completed, 
  text, 
  href,
  onClick 
}: { 
  completed: boolean; 
  text: string; 
  href: string;
  onClick?: () => void;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
        completed ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'
      }`}>
        {completed ? '✓' : '○'}
      </div>
      {completed ? (
        <span className="text-sm text-slate-400 line-through">{text}</span>
      ) : (
        <Link 
          href={href} 
          onClick={onClick}
          className="text-sm text-sky-300 hover:text-sky-200 transition-colors"
        >
          {text} →
        </Link>
      )}
    </li>
  );
}
