import Navbar from "@/components/Navbar";
import OpportunityCard from "../../components/OpportunityCard";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

export default async function FeedPage() {
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

  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("id,title,description,location_city,type,created_at")
    .order("created_at", { ascending: false });

  const rows: Opportunity[] = opportunities ?? [];

  const recommended =
    profile.city && rows.length > 0
      ? rows.filter(
          (item) =>
            item.location_city &&
            item.location_city.toLowerCase() === profile.city!.toLowerCase()
        )
      : [];

  const others =
    recommended.length > 0
      ? rows.filter(
          (item) =>
            !item.location_city ||
            item.location_city.toLowerCase() !== profile.city!.toLowerCase()
        )
      : rows;

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            AthLink Feed
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}.
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Signed in as {user.email} · role: {profile.role}
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            Feed load error: {error.message}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No opportunities yet.
          </div>
        ) : (
          <>
            {recommended.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 flex items-baseline justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Recommended for you
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Based on your city ({profile.city})
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {recommended.map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                  All opportunities
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {others.map((item) => (
                  <OpportunityCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}