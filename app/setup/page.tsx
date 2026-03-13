"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Role = "athlete" | "club";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("athlete");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user already exists in users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("User table error:", userError);
      }

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, city")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile table error:", profileError);
      }

      if (profileData) {
        setFullName(profileData.full_name ?? "");
        setCity(profileData.city ?? "");
        if (userData?.role === "athlete" || userData?.role === "club") {
          setRole(userData.role);
        }
      }

      setLoadingProfile(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setSaving(false);
      return;
    }

    try {
      // Step 1: Ensure user exists in users table
      const { error: userError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email!,
          role: role,
          status: "active",
        },
        { onConflict: "id" }
      );

      if (userError) {
        setMessage(`User save error: ${userError.message}`);
        setSaving(false);
        return;
      }

      // Step 2: Create/update profile with new schema
      const username = `${role}_${user.id.slice(0, 6)}`;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id, // Use same ID as user to satisfy foreign key
          user_id: user.id,
          username: username,
          display_name: fullName.trim() || null,
          full_name: fullName.trim() || null,
          city: city.trim() || null,
          role: role, // Add role to satisfy NOT NULL constraint
          account_visibility: "public",
          discoverability_policy: "everyone",
          message_policy: "requests",
          verification_status: "unverified",
          trusted_status: "none",
        },
        { onConflict: "id" } // Use id for conflict resolution
      );

      if (profileError) {
        setMessage(`Profile save error: ${profileError.message}`);
        setSaving(false);
        return;
      }

      // Step 3: Create role-specific profile
      if (role === "athlete") {
        const { error: athleteError } = await supabase.from("athlete_profiles").upsert(
          {
            user_id: user.id,
          },
          { onConflict: "user_id" }
        );

        if (athleteError) {
          setMessage(`Athlete profile error: ${athleteError.message}`);
          setSaving(false);
          return;
        }
      } else if (role === "club") {
        const { error: clubError } = await supabase.from("club_profiles").upsert(
          {
            user_id: user.id,
            club_name: fullName.trim() || "Club Name",
          },
          { onConflict: "user_id" }
        );

        if (clubError) {
          setMessage(`Club profile error: ${clubError.message}`);
          setSaving(false);
          return;
        }
      }

      setMessage("Profile created successfully!");

      // Redirect after successful creation
      setTimeout(() => {
        if (role === "athlete") {
          router.push("/athlete/profile");
        } else {
          router.push("/club/dashboard");
        }
      }, 1500);

    } catch (error) {
      setMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0B0B0F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTop: '2px solid #7C3AED',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isSuccess = message.includes("success");

  const roleCards: { id: Role; icon: string; title: string; description: string }[] = [
    { id: 'athlete', icon: '🏃', title: 'Athlete', description: 'Showcase your talent and get scouted' },
    { id: 'club',    icon: '🏟️', title: 'Club',    description: 'Discover and recruit top talent' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0B0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
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

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: i === 0 ? 24 : 8,
              height: 8,
              borderRadius: 99,
              background: i === 0 ? '#7C3AED' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            color: '#F8FAFC', fontFamily: "'Satoshi', sans-serif", fontWeight: 800,
            fontSize: 28, letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            Set up your profile
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
            Tell us about yourself to get started.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Role selection */}
          <div>
            <label style={{
              display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif',
              fontSize: 13, fontWeight: 500, marginBottom: 12,
            }}>
              I am a
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {roleCards.map((card) => {
                const selected = role === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setRole(card.id)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: selected ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.08)',
                      background: selected ? 'rgba(124,58,237,0.12)' : '#111118',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{
                      color: selected ? '#F8FAFC' : 'rgba(255,255,255,0.7)',
                      fontFamily: "'Satoshi', sans-serif", fontWeight: 700,
                      fontSize: 15, marginBottom: 4,
                    }}>
                      {card.title}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif',
                      fontSize: 12, lineHeight: 1.5,
                    }}>
                      {card.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="fullName" style={{
              display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif',
              fontSize: 13, fontWeight: 500, marginBottom: 8,
            }}>
              {role === 'club' ? 'Club name' : 'Full name'}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'club' ? 'e.g. FC Northampton' : 'e.g. Marcus Rashford'}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" style={{
              display: 'block', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif',
              fontSize: 13, fontWeight: 500, marginBottom: 8,
            }}>
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Manchester"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC', fontFamily: 'Inter, sans-serif', fontSize: 14,
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
          </div>

          {/* Message */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none',
              background: saving ? 'rgba(124,58,237,0.5)' : '#7C3AED',
              color: 'white', fontFamily: "'Satoshi', sans-serif", fontWeight: 700,
              fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em', transition: 'opacity 0.15s',
            }}
          >
            {saving ? 'Saving...' : 'Complete profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
