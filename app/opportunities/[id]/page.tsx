import Navbar from "@/components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
}) {
  const { id } = await params;
  const { applied, error } = await searchParams;

  const supabase = await createClient();

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, title, description, location_city, type, created_at")
    .eq("id", id)
    .single();

  if (opportunityError || !opportunity) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyApplied = false;

  if (user) {
    const { data: playerProfile } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (playerProfile) {
      const { data: applicationForThisOpportunity } = await supabase
        .from("applications")
        .select("id")
        .eq("opportunity_id", id)
        .eq("player_profile_id", playerProfile.id)
        .limit(1)
        .maybeSingle();

      alreadyApplied = !!applicationForThisOpportunity;
    }
  }

  async function applyToOpportunity() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: playerProfile } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!playerProfile) {
      redirect("/setup");
    }

    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("opportunity_id", id)
      .eq("player_profile_id", playerProfile.id)
      .limit(1)
      .maybeSingle();

    if (existingApplication) {
      redirect(`/opportunities/${id}?applied=1`);
    }

    const { error: insertError } = await supabase.from("applications").insert([
      {
        opportunity_id: id,
        player_profile_id: playerProfile.id,
        status: "pending",
      },
    ]);

    if (insertError) {
      redirect(`/opportunities/${id}?error=${encodeURIComponent(insertError.message)}`);
    }

    redirect(`/opportunities/${id}?applied=1`);
  }

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Opportunity
          </p>

          <h1 className="mt-3 text-4xl font-bold">{opportunity.title}</h1>

          <div className="mt-4 text-sm text-slate-400">
            {opportunity.location_city || "Unknown city"} · {opportunity.type || "Unknown type"}
          </div>

          {applied === "1" && (
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              You have already applied to this opportunity.
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {decodeURIComponent(error)}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
            {opportunity.description || "No description provided."}
          </div>

          <div className="mt-6">
            {alreadyApplied ? (
              <button
                type="button"
                disabled
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-400"
              >
                Applied
              </button>
            ) : (
              <form action={applyToOpportunity}>
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Apply now
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}