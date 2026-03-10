import Navbar from "../../components/Navbar";
import PageHeader from "../../components/layout/PageHeader";
import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type ConversationRow = {
  id: string;
  athlete_id: string;
  club_id: string;
  created_at: string | null;
};

type PlayerProfileRow = {
  id: string;
  profile_id: string;
};

type ClubProfileRow = {
  id: string;
  profile_id: string;
  club_name: string | null;
};

type BaseProfileRow = {
  id: string;
  full_name: string | null;
  city: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!viewerProfile) {
    redirect("/setup");
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, athlete_id, club_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Error loading conversations: {error.message}
          </div>
        </section>
      </main>
    );
  }

  const conversationRows = (conversations ?? []) as ConversationRow[];

  const athleteIds = [...new Set(conversationRows.map((c) => c.athlete_id))];
  const clubIds = [...new Set(conversationRows.map((c) => c.club_id))];

  const { data: playerProfilesRaw } =
    athleteIds.length === 0
      ? { data: [] }
      : await supabase
          .from("player_profiles")
          .select("id, profile_id")
          .in("id", athleteIds);

  const { data: clubProfilesRaw } =
    clubIds.length === 0
      ? { data: [] }
      : await supabase
          .from("club_profiles")
          .select("id, profile_id, club_name")
          .in("id", clubIds);

  const playerProfiles = (playerProfilesRaw ?? []) as PlayerProfileRow[];
  const clubProfiles = (clubProfilesRaw ?? []) as ClubProfileRow[];

  const playerProfileMap = new Map(playerProfiles.map((p) => [p.id, p]));
  const clubProfileMap = new Map(clubProfiles.map((c) => [c.id, c]));

  const otherProfileIds = [
    ...new Set([
      ...playerProfiles.map((p) => p.profile_id),
      ...clubProfiles.map((c) => c.profile_id),
    ]),
  ];

  const { data: baseProfilesRaw } =
    otherProfileIds.length === 0
      ? { data: [] }
      : await supabase
          .from("profiles")
          .select("id, full_name, city")
          .in("id", otherProfileIds);

  const baseProfiles = (baseProfilesRaw ?? []) as BaseProfileRow[];
  const baseProfileMap = new Map(baseProfiles.map((p) => [p.id, p]));

  const { data: latestMessagesRaw } =
    conversationRows.length === 0
      ? { data: [] }
      : await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .in(
            "conversation_id",
            conversationRows.map((c) => c.id)
          )
          .order("created_at", { ascending: false });

  const latestMessages = (latestMessagesRaw ?? []) as MessageRow[];
  const latestMessageMap = new Map<string, MessageRow>();

  for (const msg of latestMessages) {
    if (!latestMessageMap.has(msg.conversation_id)) {
      latestMessageMap.set(msg.conversation_id, msg);
    }
  }

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <PageHeader
          eyebrow="Inbox"
          title="Messages"
          subtitle="Conversations between clubs and athletes.\nKeep everything in one clean thread."
        />

        {!conversationRows || conversationRows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
            You don&apos;t have any conversations yet.
            <br />
            When a club or athlete reaches out, you&apos;ll see the thread here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Threads
            </div>

            <ul className="divide-y divide-white/5">
              {conversationRows.map((conversation) => {
                const athleteProfile = playerProfileMap.get(conversation.athlete_id);
                const clubProfile = clubProfileMap.get(conversation.club_id);

                const athleteBase = athleteProfile
                  ? baseProfileMap.get(athleteProfile.profile_id)
                  : null;

                const clubBase = clubProfile
                  ? baseProfileMap.get(clubProfile.profile_id)
                  : null;

                const latestMessage = latestMessageMap.get(conversation.id);

                const isAthleteViewer = viewerProfile.role === "athlete";

                const title = isAthleteViewer
                  ? clubProfile?.club_name || clubBase?.full_name || "Club"
                  : athleteBase?.full_name || "Athlete";

                const subtitle = isAthleteViewer
                  ? clubBase?.city || "Unknown city"
                  : athleteBase?.city || "Unknown city";

                const preview = latestMessage?.content || "No messages yet.";

                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/messages/${conversation.id}`}
                      className="flex gap-3 px-4 py-4 transition hover:bg-white/5"
                    >
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
                        {title.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {subtitle}
                            </p>
                          </div>

                          <span className="flex-none rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                            {viewerProfile.role === "athlete" ? "Club" : "Athlete"}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-1 text-xs text-slate-300">
                          {preview}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}