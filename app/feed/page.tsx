"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import OpportunityCard from "../../components/OpportunityCard";
import { getMockUser } from "../../lib/mockAuth";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

const filters = ["All", "Trials", "Academies", "Leagues", "London", "Manchester", "U21", "Verified"];

export default function FeedPage() {
  const [userEmail, setUserEmail] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const router = useRouter();

  useEffect(() => {
    const user = getMockUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserEmail(user.email);

    async function loadOpportunities() {
      const { data } = await supabase
        .from("opportunities")
        .select("id,title,description,location_city,type,created_at")
        .order("created_at", { ascending: false });

      setOpportunities(data || []);
      setLoading(false);
    }

    loadOpportunities();
  }, [router]);

  const visibleOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((item) =>
        [item.title, item.description, item.location_city, item.type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q))
      );
    }

    if (activeFilter !== "All") {
      const f = activeFilter.toLowerCase();

      filtered = filtered.filter((item) => {
        if (f === "trials") return (item.type || "").toLowerCase() === "trial";
        if (f === "academies") return (item.type || "").toLowerCase() === "academy";
        if (f === "leagues") return (item.type || "").toLowerCase() === "league";
        if (f === "verified") return true;
        return (item.location_city || "").toLowerCase().includes(f);
      });
    }

    return filtered;
  }, [opportunities, search, activeFilter]);

  const featured = visibleOpportunities.slice(0, 3);
  const latest = visibleOpportunities.slice(3);

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="glass sticky top-24 rounded-3xl p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Navigation
              </p>

              <div className="space-y-2">
                {[
                  "For You",
                  "Saved",
                  "Applications",
                  "Trending Clubs",
                  "Messages",
                  "Profile",
                ].map((item) => (
                  <button
                    key={item}
                    className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/10"
                  >
                    <span>{item}</span>
                    <span className="text-slate-500">→</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                <p className="text-sm font-semibold text-blue-300">Founder mode</p>
                <p className="mt-2 text-xs leading-6 text-slate-300">
                  This feed is the athlete discovery core of AthLink.
                </p>
              </div>
            </div>
          </aside>

          {/* CENTER FEED */}
          <section className="min-w-0">
            <div className="mb-6 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(17,24,39,0.92))] p-6 shadow-2xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                    Personalised athlete feed
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Welcome back.
                  </h1>
                  <p className="mt-3 text-sm text-slate-300 md:text-base">
                    Signed in as <span className="font-semibold text-white">{userEmail}</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                    Saved
                  </button>
                  <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                    Complete Profile
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">{opportunities.length}</div>
                  <div className="mt-1 text-sm text-slate-400">Available opportunities</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">Smart Feed</div>
                  <div className="mt-1 text-sm text-slate-400">Curated athlete discovery</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">Next Step</div>
                  <div className="mt-1 text-sm text-slate-400">Profiles + applications</div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="glass rounded-3xl p-4">
                <div className="flex flex-col gap-4">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clubs, cities, or opportunities"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                  />

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {filters.map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveFilter(item)}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                          activeFilter === item
                            ? "bg-white text-slate-950"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
                    Featured Feed
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Recommended opportunities</h2>
                </div>
                <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                    />
                  ))}
                </div>
              ) : featured.length === 0 ? (
                <div className="glass rounded-3xl p-8 text-center text-slate-400">
                  No featured opportunities yet.
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {featured.map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                  Latest
                </p>
                <h2 className="mt-2 text-3xl font-bold">Newest opportunities</h2>
              </div>

              {loading ? (
                <div className="grid gap-5">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5"
                    />
                  ))}
                </div>
              ) : latest.length === 0 ? (
                <div className="glass rounded-3xl p-8 text-center text-slate-400">
                  No more opportunities found.
                </div>
              ) : (
                <div className="grid gap-5">
                  {latest.map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <div className="glass rounded-3xl p-5">
                <p className="text-lg font-semibold text-white">Your panel</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">Saved opportunities</p>
                    <p className="mt-1 text-sm text-slate-400">0 saved right now</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">Applications</p>
                    <p className="mt-1 text-sm text-slate-400">Track your progress here</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">Player profile</p>
                    <p className="mt-1 text-sm text-slate-400">Complete to improve discovery</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-5">
                <p className="text-lg font-semibold text-white">Trending clubs</p>
                <div className="mt-4 space-y-3">
                  {["Chelsea Academy", "Brentford B", "Fulham U21"].map((club) => (
                    <div
                      key={club}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{club}</p>
                        <p className="text-xs text-slate-400">Verified club</p>
                      </div>
                      <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-5">
                <p className="text-lg font-semibold text-white">Notifications</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    New trial posted in London
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    Your saved club posted again
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    Complete profile for better matches
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}