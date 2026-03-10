import Link from "next/link";
import Navbar from "../components/Navbar";
import { QuickActionsPanel } from "../components/QuickActionsPanel";
import { createClient } from "../lib/supabase/server";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Just now";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTypeClasses(type: string | null) {
  switch ((type || "").toUpperCase()) {
    case "ACADEMY":
      return "border-violet-400/20 bg-violet-500/10 text-violet-300";
    case "LEAGUE":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-sky-400/20 bg-sky-500/10 text-sky-300";
  }
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "athlete" | "club" | null = null;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "athlete" || profile?.role === "club") {
      role = profile.role;
    }

    displayName = profile?.full_name ?? null;
  }

  const { data: opportunitiesRaw } = await supabase
    .from("opportunities")
    .select("id, title, description, location_city, type, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const opportunities = (opportunitiesRaw ?? []) as Opportunity[];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950/40" />
        
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:pb-24 md:pt-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300 shadow-lg backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Elite football discovery platform
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-7xl xl:text-8xl leading-[0.9]">
                <span className="bg-gradient-to-r from-white via-sky-100 to-blue-100 bg-clip-text text-transparent">
                  Discover talent.
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                  Find trials.
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 bg-clip-text text-transparent">
                  Build careers.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl font-light">
                AthLink gives athletes and clubs one premium platform for discovery,
                messaging, applications, invites, and recruitment workflows.
              </p>

              <div className="mt-12 flex flex-wrap gap-4">
                <Link
                  href={role === "club" ? "/players" : "/opportunities"}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/25 hover:-translate-y-1"
                >
                  <span className="relative z-10">{role === "club" ? "Scout players" : "Explore opportunities"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>

                <Link
                  href={role === "club" ? "/club/dashboard" : "/messages"}
                  className="group rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-1 hover:shadow-xl"
                >
                  {role === "club" ? "Open dashboard" : "Open messages"}
                </Link>
              </div>

              {user && (
                <div className="mt-12 flex flex-wrap gap-3 text-sm">
                  <div className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-slate-200 shadow-lg">
                    <span className="text-slate-400">Welcome back,</span> {displayName || user.email}
                  </div>
                  {role && (
                    <div className="rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-400/30 px-6 py-3 font-bold uppercase tracking-[0.14em] text-sky-300 shadow-lg backdrop-blur-sm">
                      {role}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="animate-fade-up-delay">
              <QuickActionsPanel userRole={role} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-950/30" />
        
        <div className="relative mb-12 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300 shadow-lg backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              Latest opportunities
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white md:text-5xl">
              <span className="bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent">
                Live listings
              </span>
            </h2>
          </div>

          <Link
            href="/opportunities"
            className="group rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              View all
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm p-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No opportunities live yet</h3>
            <p className="text-slate-400">Check back soon for exciting football opportunities</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((item, index) => (
              <div
                key={item.id}
                className="group animate-card rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-7 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 hover:shadow-2xl hover:shadow-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.title?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${getTypeClasses(
                      item.type
                    )}`}
                  >
                    {(item.type || "TRIAL").toUpperCase()}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-white group-hover:text-sky-100 transition-colors duration-300">
                    {item.title || "Untitled opportunity"}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{item.location_city || "Location TBC"}</span>
                    <span className="text-slate-600">•</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                    {item.description || "Open football opportunity for athletes looking for their next step."}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-sm">
                      Open now
                    </span>
                  </div>

                  <Link
                    href={`/opportunities/${item.id}`}
                    className="group/btn rounded-full bg-gradient-to-r from-white to-slate-100 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all duration-300 hover:from-slate-100 hover:to-white hover:shadow-lg hover:shadow-white/25 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center gap-1">
                      View listing
                      <svg className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}