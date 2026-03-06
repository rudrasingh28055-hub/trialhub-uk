"use client";

import { useEffect, useState } from "react";
import { getMockUser } from "../../lib/mockAuth";
import { useRouter } from "next/navigation";
import OpportunityCard from "../../components/OpportunityCard";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Navbar";

type Opportunity = {
  id: string;
  title: string | null;
  description: string | null;
  location_city: string | null;
  type: string | null;
  created_at: string | null;
};

export default function FeedPage() {
  const [data, setData] = useState<Opportunity[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = getMockUser();

    if (!user) {
      router.push("/login");
      return;
    }

    async function load() {
      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      setData(data || []);
    }

    load();
  }, [router]);

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="mb-3 text-5xl font-bold">Athlete Feed</h1>
        <p className="mb-10 text-slate-400">
          Your personalised AthLink opportunity feed.
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <OpportunityCard key={item.id} item={item} variant="dark" />
          ))}
        </div>
      </div>
    </main>
  );
}