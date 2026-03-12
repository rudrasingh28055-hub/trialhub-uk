import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateTrialForm } from "./CreateTrialForm";

export default async function CreateTrialPage() {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <section className="relative mx-auto max-w-4xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <PageHeader
          eyebrow="Trial Management"
          title="Create Trial Event"
          subtitle="Set up a new trial event for athletes to register and attend"
          centered
        />
        
        <div className="relative mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-sm shadow-xl">
          <CreateTrialForm clubProfileId={clubProfile.id} />
        </div>
      </section>
    </main>
  );
}
