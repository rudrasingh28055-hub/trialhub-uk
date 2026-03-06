"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

const typeOptions = ["ALL", "TRIAL", "LEAGUE", "ACADEMY"];

function formatDate(dateString: string | null) {
  if (!dateString) return "New listing";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("TRIAL");
  const [description, setDescription] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState("ALL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function loadOpportunities() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("opportunities")
      .select("id,title,description,location_city,type,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Load error: ${error.message}`);
      setLoading(false);
      return;
    }

    setOpportunities(data || []);
    setLoading(false);
  }

  async function createOpportunity() {
    setMessage("");

    if (!title.trim() || !city.trim()) {
      setMessage("Please enter both a title and city.");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("opportunities").insert([
      {
        title: title.trim(),
        location_city: city.trim(),
        type,
        description: description.trim() || "Open opportunity",
      },
    ]);

    if (error) {
      setMessage(`Insert error: ${error.message}`);
      setPosting(false);
      return;
    }

    setMessage("Opportunity posted successfully.");
    setTitle("");
    setCity("");
    setType("TRIAL");
    setDescription("");
    setPosting(false);
    await loadOpportunities();
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const cityMatch =
        !searchCity.trim() ||
        (item.location_city || "")
          .toLowerCase()
          .includes(searchCity.trim().toLowerCase());

      const typeMatch =
        searchType === "ALL" || (item.type || "").toUpperCase() === searchType;

      return cityMatch && typeMatch;
    });
  }, [opportunities, searchCity, searchType]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">AthLink</div>
            <div className="text-sm text-slate-500">
              Connecting athletes to opportunity
            </div>
          </div>

          <div className="hidden gap-8 text-sm text-slate-600 md:flex">
            <a href="#opportunities" className="hover:text-slate-900">
              Opportunities
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#post" className="hover:text-slate-900">
              Post Opportunity
            </a>
          </div>

          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
            Join Waitlist
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Verified football trials, leagues & scouting opportunities
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Find your next football opportunity.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Discover trials, leagues and athlete opportunities in one place.
            AthLink helps players get seen and gives clubs a cleaner way to
            reach talent.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#opportunities"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Browse Opportunities
            </a>
            <a
              href="#post"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Post an Opportunity
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-2xl font-bold">{opportunities.length}</div>
              <div className="text-sm text-slate-500">Live listings</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-2xl font-bold">UK</div>
              <div className="text-sm text-slate-500">Initial market</div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-2xl font-bold">2-sided</div>
              <div className="text-sm text-slate-500">Players & clubs</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-950">
                Search Opportunities
              </div>
              <div className="text-sm text-slate-500">
                Filter by city and opportunity type
              </div>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Live
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                City
              </label>
              <input
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="e.g. London, Manchester"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Opportunities" : option}
                  </option>
                ))}
              </select>
            </div>

            <a
              href="#opportunities"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Search Now
            </a>
          </div>
        </div>
      </section>

      <section
        id="opportunities"
        className="mx-auto max-w-7xl px-6 pb-16 pt-4"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Latest opportunities
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Discover verified listings
            </h2>
          </div>

          <div className="flex gap-3">
            <input
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Filter by city"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Types" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <div className="text-lg font-semibold">No opportunities found</div>
            <div className="mt-2 text-slate-500">
              Try changing your search filters or post the first opportunity.
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {(item.type || "TRIAL").toUpperCase()}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    ✓ Verified
                  </span>
                </div>

                <h3 className="text-2xl font-bold tracking-tight">
                  {item.title || "Untitled opportunity"}
                </h3>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <div>📍 {item.location_city || "Location TBC"}</div>
                  <div>📅 {formatDate(item.created_at)}</div>
                  <div>📝 {item.description || "Open football opportunity"}</div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    AthLink listing
                  </span>
                  <Link
                    href={`/opportunity/${item.id}`}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        id="post"
        className="mx-auto max-w-7xl px-6 pb-16 pt-2 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-8"
      >
        <div className="mb-8 lg:mb-0">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            For clubs & organisers
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Post your next opportunity
          </h2>
          <p className="mt-4 max-w-xl text-slate-600">
            Create football trial and league listings in seconds. Reach more
            players, centralise visibility, and build trust with verified
            listings.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="font-semibold">1. Create listing</div>
              <div className="mt-1 text-sm text-slate-500">
                Add the title, city and type of opportunity.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="font-semibold">2. Get discovered</div>
              <div className="mt-1 text-sm text-slate-500">
                Players can search, view and apply to opportunities.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="font-semibold">3. Build trust</div>
              <div className="mt-1 text-sm text-slate-500">
                Verified listings make the platform safer and more credible.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Create Opportunity</h3>
            <p className="mt-1 text-sm text-slate-500">
              Publish a trial, league, or academy event.
            </p>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. U21 Open Trial Day"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Birmingham"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                >
                  <option value="TRIAL">TRIAL</option>
                  <option value="LEAGUE">LEAGUE</option>
                  <option value="ACADEMY">ACADEMY</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the opportunity"
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
              />
            </div>

            <button
              onClick={createOpportunity}
              disabled={posting}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {posting ? "Posting..." : "Post Opportunity"}
            </button>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-t border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              How AthLink works
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Built for athletes and organisers
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-3xl">👤</div>
              <h3 className="text-xl font-semibold">Create your presence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Players and organisers can build a profile and show credibility.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-3xl">🔎</div>
              <h3 className="text-xl font-semibold">Discover opportunities</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search trials, leagues and development events in one place.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 text-3xl">🚀</div>
              <h3 className="text-xl font-semibold">Take the next step</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Apply, get seen and move closer to your next football
                opportunity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}