"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Trial = {
  id: string;
  title: string | null;
  location_city: string | null;
};

export default function Home() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  async function loadTrials() {
    const { data, error } = await supabase
      .from("opportunities")
      .select("id,title,location_city")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Load error: ${error.message}`);
      return;
    }

    setTrials(data || []);
  }

  async function createTrial() {
    setMessage("");

    if (!title || !city) {
      setMessage("Please enter both title and city.");
      return;
    }

    const { error } = await supabase.from("opportunities").insert([
      {
        title,
        location_city: city,
        type: "TRIAL",
        description: "Open football trial",
      },
    ]);

    if (error) {
      setMessage(`Insert error: ${error.message}`);
      return;
    }

    setMessage("Trial posted successfully.");
    setTitle("");
    setCity("");
    await loadTrials();
  }

  useEffect(() => {
    loadTrials();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>⚽ TrialHub UK</h1>
      <p>Find and post football trials across the UK.</p>

      <h2>Create Trial</h2>

      <input
        placeholder="Trial Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginRight: 10 }}
      />

      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{ marginRight: 10 }}
      />

      <button onClick={createTrial}>Post Trial</button>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}

      <h2 style={{ marginTop: 40 }}>Available Trials</h2>

      {trials.length === 0 ? (
        <p>No trials yet.</p>
      ) : (
        trials.map((trial) => (
          <div
            key={trial.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 10,
            }}
          >
            <strong>{trial.title}</strong>
            <div>{trial.location_city}</div>
          </div>
        ))
      )}
    </main>
  );
}