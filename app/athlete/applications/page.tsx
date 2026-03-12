import Navbar from "@/components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AthleteApplicationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/setup");
  }

  if (profile.role !== "athlete") {
    redirect("/feed");
  }

  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, opportunity_id")
    .eq("player_profile_id", playerProfile?.id || "");

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">My Applications</h1>

        {!applications || applications.length === 0 ? (
          <div className="text-slate-400">
            You have not applied to any opportunities yet.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>Application ID: {application.id}</div>
                <div>Status: {application.status}</div>
                <div>Opportunity: {application.opportunity_id}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
