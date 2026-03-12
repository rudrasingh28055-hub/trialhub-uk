"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreateOpportunityPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("TRIAL");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [positionNeeded, setPositionNeeded] = useState("");
  const [trialDate, setTrialDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/setup");
        return;
      }

      if (profile.role !== "club") {
        router.push("/feed");
        return;
      }

      setCheckingAccess(false);
    }

    checkUser();
  }, [router, supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setPosting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setPosting(false);
      return;
    }

    const { data: club, error: clubError } = await supabase
      .from("club_profiles")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (clubError) {
      setMessage(`Club profile error: ${clubError.message}`);
      setPosting(false);
      return;
    }

    if (!club) {
      setMessage("Club profile not found. Please complete your club setup first.");
      setPosting(false);
      return;
    }

    if (!title.trim() || !city.trim()) {
      setMessage("Title and city are required.");
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("opportunities").insert({
      club_profile_id: club.id,
      title: title.trim(),
      location_city: city.trim(),
      type: type.trim() || null,
      description: description.trim() || null,
      age_group: ageGroup.trim() || null,
      position_needed: positionNeeded.trim() || null,
      trial_date: trialDate || null,
      deadline: deadline || null,
    });

    if (error) {
      setMessage(`Create opportunity error: ${error.message}`);
      setPosting(false);
      return;
    }

    router.push("/club/dashboard");
    router.refresh();
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <section className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            Loading create opportunity page...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Club Tools
          </p>
          <h1 className="mt-2 text-3xl font-bold">Create Opportunity</h1>
          <p className="mt-3 text-sm text-slate-400">
            Post a new trial, academy opening, or league opportunity.
          </p>

          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="TRIAL">TRIAL</option>
              <option value="ACADEMY">ACADEMY</option>
              <option value="LEAGUE">LEAGUE</option>
            </select>

            <textarea
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="Description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="Age group (e.g. U18, U21, Senior)"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
              placeholder="Position needed"
              value={positionNeeded}
              onChange={(e) => setPositionNeeded(e.target.value)}
            />

            <div>
              <label className="mb-2 block text-sm text-slate-400">Trial date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                value={trialDate}
                onChange={(e) => setTrialDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">Application deadline</label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={posting}
              className="w-full rounded-xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {posting ? "Creating..." : "Create Opportunity"}
            </button>

            {message && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {message}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}