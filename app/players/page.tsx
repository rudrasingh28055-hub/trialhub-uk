import AppLayout from "@/components/AppLayout";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/layout/PageHeader";
import PlayerCard from "@/components/player/PlayerCard";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "@/lib/design/tokens";

type SearchParams = Promise<{
  q?: string;
  city?: string;
  position?: string;
  foot?: string;
  minAge?: string;
  maxAge?: string;
  minHeight?: string;
}>;

type AthleteCard = {
  profile_id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const {
    q = "",
    city = "",
    position = "",
    foot = "",
    minAge = "",
    maxAge = "",
    minHeight = "",
  } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: athleteProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, city, bio")
    .eq("role", "athlete")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading athletes: {profilesError.message}
          </div>
        </section>
      </main>
    );
  }

  const athleteIds = (athleteProfiles ?? []).map((p) => p.id);

  const { data: playerProfiles, error: playerProfilesError } =
    athleteIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("player_profiles")
          .select(
            "profile_id, age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url"
          )
          .in("profile_id", athleteIds);

  if (playerProfilesError) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading player details: {playerProfilesError.message}
          </div>
        </section>
      </main>
    );
  }

  const playerMap = new Map((playerProfiles ?? []).map((p) => [p.profile_id, p]));

  let athletes: AthleteCard[] = (athleteProfiles ?? []).map((profile) => {
    const player = playerMap.get(profile.id);

    return {
      profile_id: profile.id,
      full_name: profile.full_name,
      city: profile.city,
      bio: profile.bio,
      age: player?.age ?? null,
      primary_position: player?.primary_position ?? null,
      secondary_position: player?.secondary_position ?? null,
      dominant_foot: player?.dominant_foot ?? null,
      height_cm: player?.height_cm ?? null,
      previous_club: player?.previous_club ?? null,
      video_url: player?.video_url ?? null,
      instagram_url: player?.instagram_url ?? null,
    };
  });

  const qLower = q.trim().toLowerCase();
  const cityLower = city.trim().toLowerCase();
  const positionLower = position.trim().toLowerCase();
  const footLower = foot.trim().toLowerCase();
  const minAgeNum = minAge ? Number(minAge) : null;
  const maxAgeNum = maxAge ? Number(maxAge) : null;
  const minHeightNum = minHeight ? Number(minHeight) : null;

  athletes = athletes.filter((athlete) => {
    const matchesQ =
      !qLower ||
      [athlete.full_name, athlete.bio, athlete.previous_club]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(qLower));

    const matchesCity =
      !cityLower || (athlete.city || "").toLowerCase().includes(cityLower);

    const matchesPosition =
      !positionLower ||
      [athlete.primary_position, athlete.secondary_position]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(positionLower));

    const matchesFoot =
      !footLower || (athlete.dominant_foot || "").toLowerCase().includes(footLower);

    const matchesMinAge =
      minAgeNum === null || (athlete.age !== null && athlete.age >= minAgeNum);

    const matchesMaxAge =
      maxAgeNum === null || (athlete.age !== null && athlete.age <= maxAgeNum);

    const matchesMinHeight =
      minHeightNum === null ||
      (athlete.height_cm !== null && athlete.height_cm >= minHeightNum);

    return (
      matchesQ &&
      matchesCity &&
      matchesPosition &&
      matchesFoot &&
      matchesMinAge &&
      matchesMaxAge &&
      matchesMinHeight
    );
  });

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <PageHeader
          eyebrow="Athlete discovery"
          title="Find players faster"
          subtitle="Search and filter player profiles by role-specific scouting criteria."
        />

        <form className="mb-8 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-2 xl:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, bio, previous club"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="city"
            defaultValue={city}
            placeholder="City"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="position"
            defaultValue={position}
            placeholder="Position"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="foot"
            defaultValue={foot}
            placeholder="Dominant foot"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="minAge"
            defaultValue={minAge}
            placeholder="Minimum age"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="maxAge"
            defaultValue={maxAge}
            placeholder="Maximum age"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="minHeight"
            defaultValue={minHeight}
            placeholder="Minimum height (cm)"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
          />

          <button
            type="submit"
            className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Search athletes
          </button>
        </form>

        {athletes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No athletes found.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {athletes.map((athlete) => (
              <PlayerCard
                key={athlete.profile_id}
                profile_id={athlete.profile_id}
                full_name={athlete.full_name}
                city={athlete.city}
                bio={athlete.bio}
                age={athlete.age}
                primary_position={athlete.primary_position}
                secondary_position={athlete.secondary_position}
                dominant_foot={athlete.dominant_foot}
                height_cm={athlete.height_cm}
                previous_club={athlete.previous_club}
                video_url={athlete.video_url}
                instagram_url={athlete.instagram_url}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}