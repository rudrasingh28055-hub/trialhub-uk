import Navbar from "../../components/Navbar";
import OpportunityCard from "../../components/OpportunityCard";
import { createClient } from "../../lib/supabase/server";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

type OpportunitiesSearchParams = {
  q?: string;
  city?: string;
  type?: string;
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<OpportunitiesSearchParams>;
}) {
  const supabase = await createClient();
  const { q = "", city = "", type = "" } = await searchParams;

  let query = supabase
    .from("opportunities")
    .select("id,title,description,location_city,type,created_at")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  if (city) {
    query = query.ilike("location_city", `%${city}%`);
  }

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,location_city.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  const opportunities: Opportunity[] = data ?? [];

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Opportunities
          </p>
          <h1 className="mt-2 text-4xl font-bold">All live opportunities</h1>
          <p className="mt-3 text-sm text-slate-400">
            Browse all active trials, academies, and league listings on AthLink.
          </p>
        </div>

        <form className="mb-8 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by title or description"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-white placeholder:text-slate-500"
          />

          <input
            name="city"
            defaultValue={city}
            placeholder="City"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-white placeholder:text-slate-500"
          />

          <select
            name="type"
            defaultValue={type}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-white"
          >
            <option value="">All types</option>
            <option value="TRIAL">Trials</option>
            <option value="ACADEMY">Academies</option>
            <option value="LEAGUE">Leagues</option>
          </select>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Apply filters
          </button>
        </form>

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            Error loading opportunities: {error.message}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No opportunities found.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
