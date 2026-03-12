import Navbar from "@/components/Navbar"
import PageHeader from "@/components/layout/PageHeader"
import { createClient } from "../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

function getEmbedUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.searchParams.get("v")
    ) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invited?: string }>;
}) {
  const { id } = await params;
  const { invited } = await searchParams;
  const supabase = await createClient();

  console.log("Player profile page - ID:", id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow viewing without authentication, but some features will be limited
  const viewerProfile = user ? await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()
    .then(({ data }) => data) : null;

  // Try to get the base profile first
  let { data: baseProfile, error: baseProfileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, city, bio")
    .eq("id", id)
    .maybeSingle();

  console.log("=== DEBUG ===");
  console.log("ID:", id);
  console.log("Base profile:", baseProfile);
  console.log("Base profile error:", baseProfileError);
  console.log("=============");

  let playerProfile: any = null;

  if (baseProfileError || !baseProfile) {
    console.log("Base profile not found, trying player profile directly...");
    
    // Try to find player profile by ID directly
    const { data: playerProfileDirect, error: playerProfileDirectError } = await supabase
      .from("player_profiles")
      .select(
        "id, profile_id, age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url"
      )
      .eq("id", id)
      .maybeSingle();

    if (playerProfileDirectError || !playerProfileDirect) {
      console.log("Player profile not found either");
      // Return not found component instead of calling notFound()
      return <ProfileNotFound />;
    }

    // Get the base profile from the player profile
    const { data: baseProfileFromPlayer } = await supabase
      .from("profiles")
      .select("id, role, full_name, city, bio")
      .eq("id", playerProfileDirect.profile_id)
      .single();

    playerProfile = playerProfileDirect;
    baseProfile = baseProfileFromPlayer;
  } else {
    // Check if the profile has an associated player profile
    const { data: playerProfileData } = await supabase
      .from("player_profiles")
      .select(
        "id, profile_id, age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url"
      )
      .eq("profile_id", id)
      .maybeSingle();

    console.log("Player profile:", playerProfileData);

    if (!playerProfileData) {
      console.log("No player profile found for profile ID:", id);
      // Don't call notFound() here - let the fallback code handle it
    } else {
      playerProfile = playerProfileData;
    }
  }

  // If we have a base profile but no player profile, we can still show the page
  if (!playerProfile && baseProfile) {
    // Create a minimal player profile object
    playerProfile = {
      id: null,
      profile_id: id,
      age: null,
      primary_position: null,
      secondary_position: null,
      dominant_foot: null,
      height_cm: null,
      previous_club: null,
      video_url: null,
      instagram_url: null,
    };
  }

  // If still no player profile and no base profile, show 404
  if (!playerProfile && !baseProfile) {
    notFound();
  }

  const embedUrl = getEmbedUrl(playerProfile?.video_url || null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        <PageHeader
          eyebrow="Player profile"
          title={baseProfile?.full_name || "Unnamed athlete"}
          subtitle={baseProfile?.city || "Unknown city"}
          actions={
            viewerProfile?.role === "club" && (
              <div className="flex flex-wrap gap-4">
                <form action={async () => {
                  "use server";

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
                    .select("id")
                    .eq("profile_id", user.id)
                    .maybeSingle();

                  if (!clubProfile || !playerProfile) {
                    redirect(`/players/${id}`);
                  }

                  const { data: existingInvite } = await supabase
                    .from("invites")
                    .select("id")
                    .eq("club_profile_id", clubProfile.id)
                    .eq("player_profile_id", playerProfile.id)
                    .eq("status", "pending")
                    .maybeSingle();

                  if (!existingInvite) {
                    await supabase.from("invites").insert([
                      {
                        club_profile_id: clubProfile.id,
                        player_profile_id: playerProfile.id,
                        status: "pending",
                        message: "We would like to invite you to connect with our club.",
                      },
                    ]);
                  }

                  revalidatePath(`/players/${id}`);
                  redirect(`/players/${id}?invited=1`);
                }}>
                  <button
                    type="submit"
                    className="group rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Invite player
                    </span>
                  </button>
                </form>

                <form action={async () => {
                  "use server";

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
                    .select("id")
                    .eq("profile_id", user.id)
                    .maybeSingle();

                  if (!clubProfile || !playerProfile) {
                    redirect(`/players/${id}`);
                  }

                  const { data: existingConversation } = await supabase
                    .from("conversations")
                    .select("id")
                    .eq("club_id", clubProfile.id)
                    .eq("athlete_id", playerProfile.id)
                    .maybeSingle();

                  if (existingConversation) {
                    redirect(`/messages/${existingConversation.id}`);
                  }

                  const { data: newConversation, error } = await supabase
                    .from("conversations")
                    .insert([
                      {
                        club_id: clubProfile.id,
                        athlete_id: playerProfile.id,
                      },
                    ])
                    .select("id")
                    .single();

                  if (error || !newConversation) {
                    redirect(`/players/${id}`);
                  }

                  await supabase.from("messages").insert([
                    {
                      conversation_id: newConversation.id,
                      sender_id: user.id,
                      content: `Hello ${baseProfile?.full_name || "there"}, we would like to connect with you.`,
                    },
                  ]);

                  redirect(`/messages/${newConversation.id}`);
                }}>
                  <button
                    type="submit"
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-0.5"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message player
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </button>
                </form>
              </div>
            )
          }
        />

        {invited === "1" && (
          <div className="relative mb-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-green-500/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-emerald-300">Invite sent successfully.</span>
            </div>
          </div>
        )}

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl font-black text-white shadow-lg">
                    {baseProfile?.full_name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl font-black tracking-[-0.03em] text-white">
                    {baseProfile?.full_name || "Unnamed athlete"}
                  </h2>
                  <p className="mt-2 text-slate-300">
                    {baseProfile?.city || "Unknown city"}
                  </p>
                  {baseProfile?.bio && (
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {baseProfile?.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Player Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Age</div>
                  <div className="mt-1 text-sm font-medium text-white">{playerProfile?.age ?? "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Primary Position</div>
                  <div className="mt-1 text-sm font-medium text-white">{playerProfile?.primary_position || "Not set"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Height</div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {playerProfile?.height_cm ? `${playerProfile.height_cm} cm` : "Not set"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Previous Club</div>
                  <div className="mt-1 text-sm font-medium text-white">{playerProfile?.previous_club || "Not set"}</div>
                </div>
              </div>
            </div>

            {/* Feed + Create Post Section */}
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Activity & Posts</h3>
              
              <div className="space-y-6">
                {/* Create Post (only if profile owner) */}
                {user && baseProfile?.id === user.id && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <Link
                      href="/post/create"
                      className="flex items-center justify-between group transition-all"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-sky-300">
                          Share an update
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Post about your progress, achievements, or opportunities
                        </p>
                      </div>
                      <div className="rounded-2xl bg-sky-500/20 border border-sky-500/30 p-3 group-hover:bg-sky-500/30 transition-colors">
                        <svg className="h-5 w-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Feed Section */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white">Recent Activity</h4>
                    <Link
                      href={`/feed?user=${baseProfile?.id}`}
                      className="text-xs text-sky-300 hover:text-sky-200 transition-colors"
                    >
                      View All →
                    </Link>
                  </div>
                  
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">No recent posts yet</p>
                    {user && baseProfile?.id === user.id && (
                      <Link
                        href="/post/create"
                        className="inline-flex items-center gap-2 text-xs text-sky-300 hover:text-sky-200 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create your first post
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {embedUrl && (
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6">Highlight Video</h3>
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6">
            {playerProfile?.instagram_url && (
              <a
                href={playerProfile.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:bg-pink-500/20 hover:border-pink-400/30"
              >
                <svg className="h-5 w-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-medium text-white group-hover:text-pink-100">View Instagram Profile</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Component shown when profile is not found
function ProfileNotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-white mb-4">Player Not Found</h1>
          <p className="text-slate-400 mb-8">This player profile doesn&apos;t exist or has been removed.</p>
          <Link
            href="/players"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-400 transition-colors"
          >
            ← Back to Players
          </Link>
        </div>
      </section>
    </main>
  );
}
