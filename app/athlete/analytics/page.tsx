import Navbar from "../../../components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AthleteAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/setup");
  }

  if (profile.role !== "athlete") {
    redirect("/feed");
  }

  const { data: player } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!player) {
    redirect("/athlete/profile");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("id, status")
    .eq("player_profile_id", player.id);

  const { data: invites } = await supabase
    .from("invites")
    .select("id, status")
    .eq("player_profile_id", player.id);

  const { data: saved } = await supabase
    .from("saved_opportunities")
    .select("id")
    .eq("athlete_profile_id", player.id);

  const totalApplications = applications?.length ?? 0;
  const pendingApplications =
    applications?.filter((a) => (a.status || "").toLowerCase() === "pending")
      .length ?? 0;
  const acceptedApplications =
    applications?.filter((a) => (a.status || "").toLowerCase() === "accepted")
      .length ?? 0;

  const totalInvites = invites?.length ?? 0;
  const pendingInvites =
    invites?.filter((i) => (i.status || "").toLowerCase() === "pending")
      .length ?? 0;

  const savedCount = saved?.length ?? 0;

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Athlete Analytics
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            {profile.full_name || "Your"} performance overview
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Track how clubs are interacting with your profile and applications.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Applications
            </p>
            <p className="mt-3 text-3xl font-bold text-white">
              {totalApplications}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {pendingApplications} pending · {acceptedApplications} accepted
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Invites
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{totalInvites}</p>
            <p className="mt-2 text-xs text-slate-400">
              {pendingInvites} waiting for your response
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Saved opportunities
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{savedCount}</p>
            <p className="mt-2 text-xs text-slate-400">
              Opportunities you&apos;ve bookmarked to follow up.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

