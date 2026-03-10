import Navbar from "../../../components/Navbar";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type InviteRow = {
  id: string;
  status: string | null;
  message: string | null;
  created_at: string | null;
  club_profiles: {
    id: string;
    club_name: string | null;
    contact_email: string | null;
    website: string | null;
    badge_text: string | null;
    verified: boolean | null;
  } | null;
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

export default async function AthleteInvitesPage() {
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
    redirect("/club/dashboard");
  }

  const { data: playerProfile } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!playerProfile) {
    redirect("/athlete/profile");
  }

  async function updateInviteStatus(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const inviteId = String(formData.get("invite_id") || "");
    const status = String(formData.get("status") || "");

    if (!inviteId || !status) return;

    await supabase
      .from("invites")
      .update({ status })
      .eq("id", inviteId);

    revalidatePath("/athlete/invites");
  }

  const { data: invitesRaw, error } = await supabase
    .from("invites")
    .select(
      `
      id,
      status,
      message,
      created_at,
      club_profiles (
        id,
        club_name,
        contact_email,
        website,
        badge_text,
        verified
      )
    `
    )
    .eq("player_profile_id", playerProfile.id)
    .order("created_at", { ascending: false });

  const invites = (invitesRaw ?? []) as unknown as InviteRow[];

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            My Invites
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            {profile.full_name ? `${profile.full_name}'s invites` : "Your invites"}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Review club invitations and respond directly.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            Error loading invites: {error.message}
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            You have no invites yet.
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {invite.club_profiles?.club_name || "Unknown club"}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          invite.status
                        )}`}
                      >
                        {(invite.status || "pending").toUpperCase()}
                      </span>

                      {invite.club_profiles?.verified && (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                          Verified club
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-slate-400">
                      {invite.club_profiles?.contact_email || "No contact email"}
                    </div>

                    {invite.message && (
                      <p className="mt-4 text-sm leading-7 text-slate-300">
                        {invite.message}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {invite.club_profiles?.website && (
                        <a
                          href={invite.club_profiles.website}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Visit website
                        </a>
                      )}
                    </div>
                  </div>

                  {(invite.status || "pending") === "pending" && (
                    <form action={updateInviteStatus} className="flex flex-col gap-3">
                      <input type="hidden" name="invite_id" value={invite.id} />

                      <button
                        type="submit"
                        name="status"
                        value="accepted"
                        className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Accept
                      </button>

                      <button
                        type="submit"
                        name="status"
                        value="declined"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Decline
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
