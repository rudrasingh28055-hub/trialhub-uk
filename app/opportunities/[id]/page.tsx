"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "New listing";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOpportunity() {
      const { data } = await supabase
        .from("opportunities")
        .select("id,title,description,location_city,type,created_at")
        .eq("id", id)
        .single();

      setOpportunity(data || null);
      setLoading(false);
    }

    if (id) loadOpportunity();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="glass rounded-[30px] p-10">Loading opportunity...</div>
        </div>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="glass rounded-[28px] p-10 text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Opportunity not found
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">This listing does not exist</h1>
            <p className="mt-4 text-slate-400">
              The opportunity may have been removed or the link may be incorrect.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="glass glow-card rounded-[30px] p-8">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
                {(opportunity.type || "TRIAL").toUpperCase()}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                ✓ Verified
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {opportunity.title || "Untitled opportunity"}
            </h1>

            <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Location
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {opportunity.location_city || "Location TBC"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Posted on
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {formatDate(opportunity.created_at)}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Type
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {(opportunity.type || "TRIAL").toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-white">About this opportunity</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-300">
                {opportunity.description || "No description provided yet."}
              </p>
            </div>
          </div>

          <div className="glass glow-card h-fit rounded-[30px] p-6">
            <h3 className="text-2xl font-semibold text-white">Take action</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Applications, shortlists and club communication will go here next.
            </p>

            <button className="glow-button mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Apply to Opportunity
            </button>

            <button className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Save Opportunity
            </button>

            <Link
              href="/feed"
              className="mt-4 inline-flex w-full justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Go to Feed
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}