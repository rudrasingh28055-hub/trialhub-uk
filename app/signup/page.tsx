"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Step 1: Create auth user only - let database triggers handle the rest
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      // Step 2: Handle different signup scenarios
      if (data.user && !data.session) {
        // User created but no session (email confirmation required)
        setMessage("Account created. Check your email for confirmation.");
        setLoading(false);
        return;
      }

      // Step 3: If session exists (auto-confirmed), ensure user record exists
      if (data.session) {
        // Try to create user record, but don't fail if it already exists
        const { error: userError } = await supabase.from("users").upsert({
          id: data.user?.id,
          email: data.user?.email!,
          role: "athlete",
          status: "active",
        }, {
          onConflict: "id"
        });

        if (userError) {
          console.error("User record creation error:", userError);
          // Don't fail the signup - the user record might have been created by a trigger
        }

        router.push("/setup");
        router.refresh();
        return;
      }

    } catch (err) {
      console.error("Signup error:", err);
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
          <h1 className="mt-3 text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Start as an athlete or a club.
          </p>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              {message}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-white underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
