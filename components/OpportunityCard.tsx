"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

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

function getTypeColor(type: string | null) {
  switch ((type || "").toUpperCase()) {
    case "ACADEMY":
      return "bg-violet-500/15 text-violet-300 border border-violet-400/20";
    case "LEAGUE":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20";
    default:
      return "bg-blue-500/15 text-blue-300 border border-blue-400/20";
  }
}

export default function OpportunityCard({
  item,
}: {
  item: Opportunity;
}) {
  const supabase = createClient();

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    async function loadSavedState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaved(false);
        return;
      }

      const { data: player } = await supabase
        .from("player_profiles")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!player) {
        setSaved(false);
        return;
      }

      const { data: existingSaved } = await supabase
        .from("saved_opportunities")
        .select("id")
        .eq("athlete_profile_id", player.id)
        .eq("opportunity_id", item.id)
        .maybeSingle();

      setSaved(!!existingSaved);
    }

    loadSavedState();
  }, [item.id, supabase]);

  async function handleShare() {
    const url = `${window.location.origin}/opportunities/${item.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  async function handleSave() {
    if (loadingSave) return;

    setLoadingSave(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingSave(false);
      return;
    }

    const { data: player } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!player) {
      setLoadingSave(false);
      return;
    }

    if (!saved) {
      await supabase.from("saved_opportunities").insert({
        athlete_profile_id: player.id,
        opportunity_id: item.id,
      });

      setSaved(true);
    } else {
      await supabase
        .from("saved_opportunities")
        .delete()
        .eq("athlete_profile_id", player.id)
        .eq("opportunity_id", item.id);

      setSaved(false);
    }

    setLoadingSave(false);
  }

  return (
    <div className="glass glow-card rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
            {item.title?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">
                {item.title || "Untitled opportunity"}
              </p>

              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Verified
              </span>
            </div>

            <p className="text-sm text-slate-400">
              {item.location_city || "Location TBC"} • {formatDate(item.created_at)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={loadingSave}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            saved
              ? "bg-white text-slate-950"
              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          } ${loadingSave ? "opacity-60" : ""}`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeColor(item.type)}`}
        >
          {(item.type || "TRIAL").toUpperCase()}
        </span>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {item.location_city || "City TBC"}
        </span>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Open now
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-7 text-slate-300">
        {item.description ||
          "Open football opportunity for athletes looking for their next step."}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/opportunities/${item.id}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            Apply
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            {copied ? "Copied" : "Share"}
          </button>
        </div>

        <Link
          href={`/opportunities/${item.id}`}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          View
        </Link>
      </div>
    </div>
  );
}