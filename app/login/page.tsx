"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Ensure user record exists in public.users
      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email!,
        role: "athlete",
        status: "active",
      }, {
        onConflict: "id"
      });

      if (userError) {
        console.error("Failed to ensure user record:", userError);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/setup");
        router.refresh();
        return;
      }

      // Prioritize feed as the main landing experience
      router.push("/feed");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            AthLink
          </p>
          <h1 className="mt-3 text-3xl font-bold">Login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your athlete or club account.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              {message}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-400">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-medium text-white underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
