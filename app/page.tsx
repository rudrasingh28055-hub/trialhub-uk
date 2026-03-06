"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import OpportunityCard from "../components/OpportunityCard";
import Link from "next/link";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

const typeOptions = ["ALL", "TRIAL", "LEAGUE", "ACADEMY"];

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
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="grid-futuristic relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              New-era athlete discovery platform
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              The network where athletes meet opportunity.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Discover verified trials, leagues and recruitment opportunities.
              AthLink helps players get noticed and gives clubs a smarter way to
              reach talent.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#opportunities"
                className="glow-button rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Explore Opportunities
              </a>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Enter Feed
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              <div className="glass rounded-3xl p-4">
                <div className="text-2xl font-bold">{opportunities.length}</div>
                <div className="mt-1 text-sm text-slate-400">Live listings</div>
              </div>
              <div className="glass rounded-3xl p-4">
                <div className="text-2xl font-bold">UK</div>
                <div className="mt-1 text-sm text-slate-400">Launch market</div>
              </div>
              <div className="glass rounded-3xl p-4">
                <div className="text-2xl font-bold">2-Sided</div>
                <div className="mt-1 text-sm text-slate-400">Players & clubs</div>
              </div>
              <div className="glass rounded-3xl p-4">
                <div className="text-2xl font-bold">Verified</div>
                <div className="mt-1 text-sm text-slate-400">Trust first</div>
              </div>
            </div>
          </div>

          <div className="glass glow-card rounded-[28px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-white">Smart Search</div>
                <div className="text-sm text-slate-400">
                  Filter by city and opportunity type
                </div>
              </div>
              <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Live
              </div>
            </div>

            <div className="space-y-4">
              <input
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="London, Manchester, Birmingham"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
              />

              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400"
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option} className="bg-slate-900">
                    {option === "ALL" ? "All Opportunities" : option}
                  </option>
                ))}
              </select>

              <a
                href="#opportunities"
                className="glow-button inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Search AthLink
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Opportunity feed
            </div>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">
              Discover live opportunities
            </h2>
          </div>

          <Link
            href="/feed"
            className="w-fit rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open Feed
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((item) => (
              <OpportunityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section
        id="post"
        className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            For organisers
          </div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">
            Publish your next listing
          </h2>
          <p className="mt-4 max-w-xl text-slate-400">
            Create trials, leagues and academy opportunities in a cleaner,
            more trustworthy way.
          </p>
        </div>

        <div className="glass glow-card rounded-[28px] p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-white">Create Opportunity</h3>
          </div>

          <div className="grid gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-400"
              >
                <option value="TRIAL" className="bg-slate-900">TRIAL</option>
                <option value="LEAGUE" className="bg-slate-900">LEAGUE</option>
                <option value="ACADEMY" className="bg-slate-900">ACADEMY</option>
              </select>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Description"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
            />

            <button
              onClick={createOpportunity}
              disabled={posting}
              className="glow-button rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {posting ? "Posting..." : "Post Opportunity"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}