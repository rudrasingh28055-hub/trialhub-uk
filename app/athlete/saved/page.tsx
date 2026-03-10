import Navbar from "../../../components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

type SavedRow = {
  id: string;
  opportunity_id: string;
};

type OpportunityRow = {
  id: string;
  title: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

export default async function SavedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/setup");
  if (profile.role !== "athlete") redirect("/club/dashboard");

  const { data: player } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!player) redirect("/athlete/profile");

  const { data: savedRaw, error: savedError } = await supabase
    .from("saved_opportunities")
    .select("id, opportunity_id")
    .eq("athlete_profile_id", player.id)
    .order("created_at", { ascending: false });

  if (savedError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading saved opportunities: {savedError.message}
          </div>
        </section>
      </main>
    );
  }

  const saved = (savedRaw ?? []) as SavedRow[];
  const opportunityIds = saved.map((row) => row.opportunity_id);

  const { data: opportunitiesRaw, error: opportunitiesError } =
    opportunityIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("opportunities")
          .select("id, title, location_city, type, created_at")
          .in("id", opportunityIds);

  if (opportunitiesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading opportunities: {opportunitiesError.message}
          </div>
        </section>
      </main>
    );
  }

  const opportunities = (opportunitiesRaw ?? []) as OpportunityRow[];
  const opportunityMap = new Map(opportunities.map((opp) => [opp.id, opp]));

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Saved Opportunities
          </p>
          <h1 className="mt-2 text-4xl font-bold">Your saved opportunities</h1>
        </div>

        {saved.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No saved opportunities yet.
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((row) => {
              const opp = opportunityMap.get(row.opportunity_id);

              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="font-semibold text-lg text-white">
                    {opp?.title || "Unknown opportunity"}
                  </div>

                  <div className="mt-2 text-sm text-slate-400">
                    {opp?.location_city || "Unknown city"} • {opp?.type || "Unknown type"}
                  </div>

                  {opp?.id && (
                    <a
                      href={`/opportunities/${opp.id}`}
                      className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                      View opportunity
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
