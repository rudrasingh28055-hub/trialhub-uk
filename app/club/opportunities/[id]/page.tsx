import Navbar from "../../../../components/Navbar";
import { createClient } from "../../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

type ApplicantRow = {
  id: string;
  status: string | null;
  note: string | null;
  created_at: string | null;
  player_profile_id: string;
};

type PlayerProfileRow = {
  id: string;
  profile_id: string;
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
};

type BaseProfileRow = {
  id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
};

function getStatusStyle(status: string | null) {
  switch ((status || "").toLowerCase()) {
    case "shortlisted":
      return "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "rejected":
      return "border border-red-400/20 bg-red-500/10 text-red-300";
    default:
      return "border border-blue-400/20 bg-blue-500/10 text-blue-300";
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClubOpportunityApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "club") {
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

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select(
      "id, title, description, location_city, type, age_group, position_needed, trial_date, deadline, club_profile_id, created_at"
    )
    .eq("id", id)
    .single();

  if (!opportunity) {
    notFound();
  }

  if (opportunity.club_profile_id !== clubProfile.id) {
    redirect("/club/dashboard");
  }

  async function updateApplicationStatus(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const applicationId = String(formData.get("application_id") || "");
    const status = String(formData.get("status") || "");

    if (!applicationId || !status) {
      return;
    }

    await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    revalidatePath(`/club/opportunities/${id}`);
  }

  const { data: applicationsRaw, error: applicationsError } = await supabase
    .from("applications")
    .select("id, status, note, created_at, player_profile_id")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading applicants: {applicationsError.message}
          </div>
        </section>
      </main>
    );
  }

  const applications = (applicationsRaw ?? []) as ApplicantRow[];
  const playerProfileIds = applications.map((a) => a.player_profile_id);

  const { data: playerProfilesRaw, error: playerProfilesError } =
    playerProfileIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("player_profiles")
          .select(
            "id, profile_id, age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url"
          )
          .in("id", playerProfileIds);

  if (playerProfilesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading player profiles: {playerProfilesError.message}
          </div>
        </section>
      </main>
    );
  }

  const playerProfiles = (playerProfilesRaw ?? []) as PlayerProfileRow[];
  const playerProfileMap = new Map(playerProfiles.map((p) => [p.id, p]));

  const baseProfileIds = playerProfiles.map((p) => p.profile_id);

  const { data: baseProfilesRaw, error: baseProfilesError } =
    baseProfileIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("profiles")
          .select("id, full_name, city, bio")
          .in("id", baseProfileIds);

  if (baseProfilesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading profile details: {baseProfilesError.message}
          </div>
        </section>
      </main>
    );
  }

  const baseProfiles = (baseProfilesRaw ?? []) as BaseProfileRow[];
  const baseProfileMap = new Map(baseProfiles.map((p) => [p.id, p]));

  const totalApplicants = applications.length;
  const shortlistedCount = applications.filter(
    (a) => (a.status || "").toLowerCase() === "shortlisted"
  ).length;
  const rejectedCount = applications.filter(
    (a) => (a.status || "").toLowerCase() === "rejected"
  ).length;
  const pendingCount = applications.filter(
    (a) => !a.status || (a.status || "").toLowerCase() === "pending"
  ).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <div className="relative mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-300 shadow-lg backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Applicant Management
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-2 text-xs font-bold text-emerald-300 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-[-0.03em] text-white md:text-5xl mb-4">
            <span className="bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent">
              {opportunity.title || "Untitled opportunity"}
            </span>
          </h1>
          
          <p className="max-w-3xl text-lg leading-8 text-slate-300 font-light">
            Review applicants, update statuses, and move talent through your recruitment pipeline.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { label: opportunity.location_city || "Unknown city", icon: "location" },
              { label: opportunity.type || "Unknown type", icon: "type" },
              { label: `Age group: ${opportunity.age_group || "Not set"}`, icon: "age" },
              { label: `Position: ${opportunity.position_needed || "Not set"}`, icon: "position" },
              { label: `Trial: ${opportunity.trial_date || "Not set"}`, icon: "date" },
              { label: `Deadline: ${opportunity.deadline || "Not set"}`, icon: "deadline" }
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-slate-200 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  {item.icon === "location" && (
                    <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {item.icon === "type" && (
                    <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  )}
                  {item.icon === "age" && (
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.icon === "position" && (
                    <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {item.icon === "date" && (
                    <svg className="h-4 w-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {item.icon === "deadline" && (
                    <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {opportunity.description && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Opportunity Details</h3>
            <p className="text-sm leading-7 text-slate-300">{opportunity.description}</p>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-300 transition-colors">
                Total applicants
              </p>
            </div>
            <p className="text-3xl font-black text-white group-hover:text-blue-100 transition-colors">{totalApplicants}</p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-amber-300 transition-colors">
                Pending
              </p>
            </div>
            <p className="text-3xl font-black text-white group-hover:text-amber-100 transition-colors">{pendingCount}</p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-emerald-300 transition-colors">
                Shortlisted
              </p>
            </div>
            <p className="text-3xl font-black text-white group-hover:text-emerald-100 transition-colors">{shortlistedCount}</p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-red-300 transition-colors">
                Rejected
              </p>
            </div>
            <p className="text-3xl font-black text-white group-hover:text-red-100 transition-colors">{rejectedCount}</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No applicants yet</h3>
            <p className="text-slate-400">Once athletes apply, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((application) => {
              const playerProfile = playerProfileMap.get(application.player_profile_id);
              const athlete = playerProfile
                ? baseProfileMap.get(playerProfile.profile_id)
                : null;

              return (
                <div
                  key={application.id}
                  className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-7 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 hover:shadow-2xl"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-black text-white shadow-lg">
                              {athlete?.full_name?.charAt(0)?.toUpperCase() || "A"}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                          </div>
                          <h2 className="text-2xl font-black tracking-[-0.03em] text-white group-hover:text-sky-100 transition-colors duration-300">
                            {athlete?.full_name || "Unknown athlete"}
                          </h2>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${getStatusStyle(
                            application.status
                          )}`}
                        >
                          {(application.status || "pending").toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{athlete?.city || "Unknown city"}</span>
                        <span className="text-slate-600">•</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Applied on {formatDate(application.created_at)}</span>
                      </div>

                      {athlete?.bio && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm leading-7 text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                            {athlete.bio}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 transition-all duration-300 hover:border-sky-400/30 hover:bg-gradient-to-br hover:from-sky-950/30 hover:to-blue-950/30">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 group-hover:text-sky-400 transition-colors">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Age
                          </div>
                          <div className="mt-2 text-sm font-medium text-white group-hover:text-sky-100 transition-colors">
                            {playerProfile?.age ?? "Not set"}
                          </div>
                        </div>

                        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 transition-all duration-300 hover:border-emerald-400/30 hover:bg-gradient-to-br hover:from-emerald-950/30 hover:to-green-950/30">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 group-hover:text-emerald-400 transition-colors">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Primary position
                          </div>
                          <div className="mt-2 text-sm font-medium text-white group-hover:text-emerald-100 transition-colors">
                            {playerProfile?.primary_position || "Not set"}
                          </div>
                        </div>

                        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 transition-all duration-300 hover:border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-950/30 hover:to-indigo-950/30">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 group-hover:text-purple-400 transition-colors">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Height
                          </div>
                          <div className="mt-2 text-sm font-medium text-white group-hover:text-purple-100 transition-colors">
                            {playerProfile?.height_cm
                              ? `${playerProfile.height_cm} cm`
                              : "Not set"}
                          </div>
                        </div>

                        <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 transition-all duration-300 hover:border-orange-400/30 hover:bg-gradient-to-br hover:from-orange-950/30 hover:to-amber-950/30">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 group-hover:text-orange-400 transition-colors">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Previous club
                          </div>
                          <div className="mt-2 text-sm font-medium text-white group-hover:text-orange-100 transition-colors">
                            {playerProfile?.previous_club || "Not set"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {playerProfile?.video_url && (
                          <a
                            href={playerProfile.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-500/20 hover:border-red-400/30 hover:-translate-y-0.5 hover:shadow-lg"
                          >
                            <svg className="h-4 w-4 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Highlights
                          </a>
                        )}

                        {playerProfile?.instagram_url && (
                          <a
                            href={playerProfile.instagram_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-pink-500/20 hover:border-pink-400/30 hover:-translate-y-0.5 hover:shadow-lg"
                          >
                            <svg className="h-4 w-4 text-pink-400 group-hover:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Instagram
                          </a>
                        )}

                        {playerProfile?.profile_id && (
                          <Link
                            href={`/players/${playerProfile.profile_id}`}
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-slate-100 px-5 py-2.5 text-sm font-bold text-slate-950 transition-all duration-300 hover:shadow-lg hover:shadow-white/25 hover:-translate-y-0.5"
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              View player
                              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </Link>
                        )}
                      </div>

                      {application.note && (
                        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
                          <div className="flex items-start gap-2">
                            <svg className="h-4 w-4 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <div>
                              <p className="text-xs font-semibold text-amber-300 mb-1">Note</p>
                              <p className="text-sm text-slate-300">{application.note}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-auto">
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/50 to-slate-900/50 backdrop-blur-sm p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                          Actions
                        </p>

                        <form action={updateApplicationStatus} className="space-y-3">
                          <input type="hidden" name="application_id" value={application.id} />

                          <button
                            type="submit"
                            name="status"
                            value="shortlisted"
                            className="group w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 text-sm font-bold text-white transition-all duration-300 hover:from-emerald-400 hover:to-green-400 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Shortlist
                            </span>
                          </button>

                          <button
                            type="submit"
                            name="status"
                            value="rejected"
                            className="group w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-500/20 hover:border-red-400/30 hover:-translate-y-0.5 hover:shadow-lg"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </span>
                          </button>

                          <button
                            type="submit"
                            name="status"
                            value="pending"
                            className="group w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-400/30 hover:-translate-y-0.5 hover:shadow-lg"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4 text-amber-400 group-hover:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reset to pending
                            </span>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
} 