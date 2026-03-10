import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { VerificationStatusCard } from "../../../components/verification/VerificationStatusCard";
import { getMyClubVerification } from "../../../lib/verifications/actions";

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClubDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, city")
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
    .select("id, club_name, website, contact_email, badge_text, verified")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, title, location_city, type, age_group, position_needed, created_at, deadline"
    )
    .eq("club_profile_id", clubProfile?.id)
    .order("created_at", { ascending: false });

  // Get new verification data
  const { verification, trustScore } = await getMyClubVerification();

  const totalOpportunities = opportunities?.length ?? 0;

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_35%),linear-gradient(135deg,rgba(8,15,30,0.96),rgba(17,24,39,0.94))] p-8 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                Club Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                {clubProfile?.club_name || "Your club"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
                Manage opportunities, review applicants, and run your recruitment
                workflow from one clean dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/club/create-opportunity"
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Create opportunity
              </Link>
              <Link
                href="/players"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Find players
              </Link>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        <VerificationStatusCard 
          verification={verification} 
          trustScore={trustScore}
          isOwner={true}
          clubProfileId={clubProfile?.id}
        />

        <div className="mb-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Opportunities posted
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{totalOpportunities}</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Trust Score
            </p>
            <p className="mt-3 text-3xl font-bold text-white">
              {trustScore?.overall_score ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {trustScore?.verification_tier === 'unverified' ? 'Not verified' : `${trustScore?.verification_tier} tier`}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contact
            </p>
            <p className="mt-3 text-sm text-white">
              {clubProfile?.contact_email || "Not set"}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {clubProfile?.website || "No website added"}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Quick links
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/club/verification" className="text-sky-300 hover:text-sky-200">
                Verification →
              </Link>
              <Link href="/club/invites" className="text-slate-200 hover:text-white">
                Sent invites
              </Link>
              <Link href="/messages" className="text-slate-200 hover:text-white">
                Messages
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your opportunities</h2>
              <p className="mt-1 text-sm text-slate-400">
                Review all current and previous listings.
              </p>
            </div>
          </div>

          {!opportunities || opportunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/30 p-8 text-center text-slate-400">
              No opportunities posted yet. Create your first listing to start attracting athletes.
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/30 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.title}</div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          {item.location_city || "Unknown city"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          {item.type || "Unknown type"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          Age group: {item.age_group || "Not set"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                          Position: {item.position_needed || "Not set"}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-400">
                        Posted {formatDate(item.created_at)} · Deadline{" "}
                        {item.deadline || "Not set"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/club/opportunities/${item.id}`}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                      >
                        View applicants
                      </Link>

                      <Link
                        href={`/opportunities/${item.id}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                      >
                        Open listing
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}