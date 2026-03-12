"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, typography, styles, borderRadius } from "@/lib/design/tokens";

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
    <main className="min-h-screen px-6 py-16" style={{ backgroundColor: colors.black }}>
      <div className="mx-auto max-w-md">
        <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
          <p 
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ 
              ...styles.displayHeader,
              color: colors.accent
            }}
          >
            Debut
          </p>
          <h1 
            className="mt-3 text-3xl font-bold"
            style={{ 
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Login
          </h1>
          <p 
            className="mt-2 text-sm"
            style={{ color: colors.muted }}
          >
            Sign in to access your athlete or club account.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{ 
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3"
              style={{ 
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.accent, 
                color: colors.white,
                ...styles.displayHeader
              }}
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-4 text-sm" style={{ ...styles.sheetBorder, backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30`, color: colors.danger }}>
              {message}
            </div>
          )}

          <p className="mt-6 text-sm" style={{ color: colors.muted }}>
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="font-medium underline"
              style={{ color: colors.white }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
