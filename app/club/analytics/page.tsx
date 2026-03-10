import Navbar from "../../../components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClubAnalyticsPage() {
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

  if (profile.role !== "club") {
    redirect("/feed");
  }

  const { data: clubProfile } = await supabase
    .from("club_profiles")
    .select("id, club_name")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!clubProfile) {
    redirect("/club/dashboard");
  }

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id")
    .eq("club_profile_id", clubProfile.id);

  const opportunityIds = (opportunities ?? []).map((o) => o.id);

  const { data: applications } =
    opportunityIds.length === 0
      ? await supabase.from("applications").select("id, status").limit(0)
      : await supabase
          .from("applications")
          .select("id, status, opportunity_id")
          .in("opportunity_id", opportunityIds);

  const totalOpportunities = opportunities?.length ?? 0;
  const totalApplications = applications?.length ?? 0;
  const pendingApplications =
    applications?.filter((a) => (a.status || "").toLowerCase() === "pending")
      .length ?? 0;
  const acceptedApplications =
    applications?.filter((a) => (a.status || "").toLowerCase() === "accepted")
      .length ?? 0;

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Club Analytics
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            {clubProfile.club_name || "Your club"} insights
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Understand how athletes are engaging with your opportunities.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Opportunities posted
            </p>
            <p className="mt-3 text-3xl font-bold text-white">
              {totalOpportunities}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Total opportunities you&apos;ve published.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Applications received
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
              Conversion snapshot
            </p>
            <p className="mt-3 text-3xl font-bold text-white">
              {totalApplications && totalOpportunities
                ? (totalApplications / totalOpportunities).toFixed(1)
                : "0.0"}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Avg applications per opportunity.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

