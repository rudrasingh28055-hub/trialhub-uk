"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, typography, styles, borderRadius } from "@/lib/design/tokens";

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
    <main className="min-h-screen px-6 py-16" style={{ backgroundColor: colors.black }}>
      <div className="mx-auto max-w-md">
        <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
          <p 
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.accent
            }}
          >
            Debut
          </p>
          <h1 
            className="mt-3 text-3xl font-bold"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Create account
          </h1>
          <p 
            className="mt-2 text-sm"
            style={{ color: colors.muted }}
          >
            Start as an athlete or a club.
          </p>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
              placeholderStyle={{ color: colors.muted }}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
              placeholderStyle={{ color: colors.muted }}
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
                fontFamily: typography.display,
                ...styles.displayHeader
              }}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>

          {message && (
            <div className="mt-4 p-4 text-sm" style={{ ...styles.sheetBorder, backgroundColor: `${colors.success}10`, border: `1px solid ${colors.success}30`, color: colors.success }}>
              {message}
            </div>
          )}

          <p className="mt-6 text-sm" style={{ color: colors.muted }}>
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-medium underline"
              style={{ color: colors.white }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
