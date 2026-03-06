"use client";

import Navbar from "../../components/Navbar";
import { saveMockUser } from "../../lib/mockAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    saveMockUser(email.trim());
    router.push("/feed");
  }

  return (
    <main className="min-h-screen text-white">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              Enter the AthLink network
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Login to your athlete feed.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
              Start with a simple founder-mode login. Real auth comes next.
            </p>
          </div>

          <div className="glass glow-card rounded-[28px] p-8">
            <h2 className="text-2xl font-semibold text-white">Sign in to AthLink</h2>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
              />

              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-400"
              />

              <button className="glow-button w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Login
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}