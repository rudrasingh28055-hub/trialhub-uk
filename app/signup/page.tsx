"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  const isSuccess = message.includes("created") || message.includes("Check");

  const features = [
    { icon: '⚡', text: 'Upload match highlights with AI-powered spotlight detection' },
    { icon: '🔍', text: 'Get discovered by scouts from professional clubs' },
    { icon: '📊', text: 'Track profile views, scout interest, and engagement' },
  ];

  return (
    <main style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0B0B0F' }}>
      {/* Left brand panel — hidden on mobile */}
      <div
        style={{
          flex: '0 0 45%',
          background: 'linear-gradient(160deg, #0F0B1E 0%, #0B0B0F 60%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '48px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="hidden lg:flex lg:flex-col"
      >
        {/* Logo + pitch */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: 18 }}>D</span>
            </div>
            <span style={{ color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em' }}>
              Debut
            </span>
          </div>

          <h2 style={{
            color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800,
            fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16,
          }}>
            Join the game.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif',
            fontSize: 15, lineHeight: 1.7, maxWidth: 320,
          }}>
            Build your digital football identity. Upload highlights, connect with scouts,
            and take your career to the next level.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 14,
              }}>
                {f.icon}
              </div>
              <span style={{
                color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif',
                fontSize: 13, lineHeight: 1.6, paddingTop: 6,
              }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="lg:hidden">
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: '#7C3AED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: 16 }}>D</span>
            </div>
            <span style={{ color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800, fontSize: 20 }}>Debut</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800,
              fontSize: 28, letterSpacing: '-0.02em', marginBottom: 8,
            }}>
              Create account
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif',
                fontSize: 13, fontWeight: 500, marginBottom: 8,
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif',
                fontSize: 13, fontWeight: 500, marginBottom: 8,
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
              />
            </div>

            {message && (
              <div style={{
                padding: '12px 14px', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif',
                backgroundColor: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: isSuccess ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                color: isSuccess ? '#10B981' : '#EF4444',
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none',
                background: loading ? 'rgba(124,58,237,0.5)' : '#7C3AED',
                color: 'white', fontFamily: "'Satoshi', sans-serif", fontWeight: 700,
                fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em', transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
