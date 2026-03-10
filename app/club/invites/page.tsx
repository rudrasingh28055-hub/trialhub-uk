import Navbar from "../../../components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

type InviteRow = {
  id: string;
  status: string | null;
  message: string | null;
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
};

type BaseProfileRow = {
  id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
};

function getStatusStyle(status: string | null) {
  switch ((status || "").toLowerCase()) {
    case "accepted":
      return "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "declined":
      return "border border-red-400/20 bg-red-500/10 text-red-300";
    default:
      return "border border-blue-400/20 bg-blue-500/10 text-blue-300";
  }
}

export default async function ClubInvitesPage() {
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

  const { data: invitesRaw, error: invitesError } = await supabase
    .from("invites")
    .select("id, status, message, created_at, player_profile_id")
    .eq("club_profile_id", clubProfile.id)
    .order("created_at", { ascending: false });

  if (invitesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading invites: {invitesError.message}
          </div>
        </section>
      </main>
    );
  }

  const invites = (invitesRaw ?? []) as InviteRow[];
  const playerProfileIds = invites.map((invite) => invite.player_profile_id);

  const { data: playerProfilesRaw, error: playerProfilesError } =
    playerProfileIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("player_profiles")
          .select(
            "id, profile_id, age, primary_position, secondary_position, dominant_foot, height_cm, previous_club"
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
            Error loading athlete details: {baseProfilesError.message}
          </div>
        </section>
      </main>
    );
  }

  const baseProfiles = (baseProfilesRaw ?? []) as BaseProfileRow[];
  const baseProfileMap = new Map(baseProfiles.map((p) => [p.id, p]));

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Club Invites
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            {clubProfile.club_name || "Your club"} — sent invites
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Track every player invite your club has sent.
          </p>
        </div>

        {invites.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No invites sent yet.
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => {
              const playerProfile = playerProfileMap.get(invite.player_profile_id);
              const athlete = playerProfile
                ? baseProfileMap.get(playerProfile.profile_id)
                : null;

              return (
                <div
                  key={invite.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">
                          {athlete?.full_name || "Unknown athlete"}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            invite.status
                          )}`}
                        >
                          {(invite.status || "pending").toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-400">
                        {athlete?.city || "Unknown city"}
                      </div>

                      {athlete?.bio && (
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          {athlete.bio}
                        </p>
                      )}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Age
                          </div>
                          <div className="mt-1 text-sm font-medium text-white">
                            {playerProfile?.age ?? "Not set"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Primary position
                          </div>
                          <div className="mt-1 text-sm font-medium text-white">
                            {playerProfile?.primary_position || "Not set"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Height
                          </div>
                          <div className="mt-1 text-sm font-medium text-white">
                            {playerProfile?.height_cm
                              ? `${playerProfile.height_cm} cm`
                              : "Not set"}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Previous club
                          </div>
                          <div className="mt-1 text-sm font-medium text-white">
                            {playerProfile?.previous_club || "Not set"}
                          </div>
                        </div>
                      </div>

                      {invite.message && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                          Message sent: {invite.message}
                        </div>
                      )}
                    </div>

                    {playerProfile && (
                      <a
                        href={`/players/${playerProfile.profile_id}`}
                        className="inline-block rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                      >
                        View player
                      </a>
                    )}
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
