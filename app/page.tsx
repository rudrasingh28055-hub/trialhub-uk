"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import OpportunityCard from "../components/OpportunityCard";
import Navbar from "../components/Navbar";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("opportunities")
        .select("*");

      setData(data || []);
    }

    load();
  }, []);

  return (
    <main>
      <Navbar />

      <div className="p-20">
        <h1 className="text-5xl mb-8">
          AthLink
        </h1>

        <div className="grid gap-6">
          {data.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}