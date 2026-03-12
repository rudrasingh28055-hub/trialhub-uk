import Navbar from "@/components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import { getPassportByProfileId } from "../../../lib/passport/actions";
import { AthletePassportCard } from "../../../components/passport/AthletePassportCard";
import { VerificationBadge } from "../../../components/verification/VerificationBadge";
import Link from "next/link";

interface PublicPassportPageProps {
  params: Promise<{ profileId: string }>;
}

export default async function PublicPassportPage({ params }: PublicPassportPageProps) {
  const { profileId } = await params;
  const supabase = await createClient();
  
  // Get profile information
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, city, bio, role")
    .eq("id", profileId)
    .maybeSingle();
    
  if (!profile || profile.role !== "athlete") {
    notFound();
  }
  
  // Get player profile
  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("age, primary_position, secondary_position, height_cm, dominant_foot, previous_club, video_url, instagram_url")
    .eq("profile_id", profileId)
    .maybeSingle();
  
  // Get passport (with privacy checks)
  const { passport, error } = await getPassportByProfileId(profileId);
  
  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white">Private Passport</h1>
            <p className="mt-2 text-slate-400">{error}</p>
            <Link 
              href="/players"
              className="mt-6 inline-block rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Browse Players
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const showVideo = passport?.privacy_settings?.show_full_name !== false && playerProfile?.video_url;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <section className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Trust Banner */}
        <div className="mb-8 flex items-center justify-center gap-2 rounded-full border border-emerald-400/20 
          bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Verified AthLink Passport</span>
        </div>
        
        {/* Passport Card */}
        <AthletePassportCard 
          passport={passport}
          profile={profile}
          playerProfile={playerProfile}
          isOwner={false}
        />
        
        {/* Additional Info */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Bio */}
          {profile.bio && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">About</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}
          
          {/* Video */}
          {showVideo && playerProfile?.video_url && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Highlights</h3>
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                <iframe
                  src={getEmbedUrl(playerProfile.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Club CTA */}
        <div className="mt-8 rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-8 text-center">
          <h3 className="text-xl font-bold text-white">Interested in this player?</h3>
          <p className="mt-2 text-slate-400">
            Verified clubs can connect directly with athletes through AthLink
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href={`/players/${profileId}`}
              className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3 
                text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all 
                hover:shadow-xl"
            >
              View Full Profile
            </Link>
            <Link
              href="/club/verification"
              className="text-sm text-sky-300 hover:text-sky-200 transition-colors"
            >
              Get Verified →
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            This passport is verified and maintained by AthLink. 
            Information is accurate as of the last verification date.
          </p>
        </div>
      </section>
    </main>
  );
}

function getEmbedUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  
  try {
    const parsed = new URL(url);
    
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  } catch {
    return undefined;
  }
}
