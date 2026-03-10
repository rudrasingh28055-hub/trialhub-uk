import Navbar from "../../../components/Navbar";
import PageHeader from "../../../components/layout/PageHeader";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getClubTrialEvents } from "../../../lib/trials/actions";
import { TrialCard } from "../../../components/trials/TrialCard";
import type { TrialEvent } from "../../../lib/trials/types";

export default async function ClubTrialsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  
  // Verify user is a club
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "club") {
    redirect("/feed");
  }
  
  // Get club profile
  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id, club_name")
    .eq("profile_id", user.id)
    .single();
    
  if (!clubProfile) {
    redirect("/setup");
  }
  
  // Get trials
  const { trials, error } = await getClubTrialEvents(clubProfile.id);

  // Separate into upcoming and past
  const now = new Date();
  const upcomingTrials = trials?.filter((t: TrialEvent) => new Date(t.date) >= now) || [];
  const pastTrials = trials?.filter((t: TrialEvent) => new Date(t.date) < now) || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
              Trial Management
            </p>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              Your Trials
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Create and manage trial events for your club. Track registrations, 
              attendance, and evaluations all in one place.
            </p>
          </div>
          
          <Link
            href="/club/trials/create"
            className="rounded-full bg-gradient-to-r from-sky-500 to-blue-500 
              px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 
              transition-all hover:shadow-xl"
          >
            Create Trial
          </Link>
        </div>
        
        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard 
            value={trials?.length || 0} 
            label="Total Trials" 
            icon="📅" 
          />
          <StatCard 
            value={upcomingTrials.length} 
            label="Upcoming" 
            icon="🚀" 
          />
          <StatCard 
            value={trials?.reduce((sum: number, t: TrialEvent) => sum + (t.trial_registrations?.[0]?.count || 0), 0) || 0} 
            label="Total Registrations" 
            icon="👥" 
          />
          <StatCard 
            value={trials?.filter((t: TrialEvent) => t.status === 'published').length || 0} 
            label="Open for Registration" 
            icon="🟢" 
          />
        </div>
        
        {/* Upcoming Trials */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Upcoming Trials</h2>
          
          {upcomingTrials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">No upcoming trials</h3>
              <p className="text-slate-400 mb-6">
                Create your first trial event to start attracting talented athletes.
              </p>
              <Link
                href="/club/trials/create"
                className="inline-block rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 
                  px-6 py-3 text-sm font-bold text-white"
              >
                Create Trial Event
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTrials.map((trial: TrialEvent) => (
                <TrialCard 
                  key={trial.id} 
                  trial={trial} 
                  isClubView={true}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Past Trials */}
        {pastTrials.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Past Trials</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastTrials.slice(0, 3).map((trial: TrialEvent) => (
                <TrialCard 
                  key={trial.id} 
                  trial={trial} 
                  isClubView={true}
                />
              ))}
            </div>
            {pastTrials.length > 3 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-slate-400 hover:text-white transition-colors">
                  View all {pastTrials.length} past trials
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
