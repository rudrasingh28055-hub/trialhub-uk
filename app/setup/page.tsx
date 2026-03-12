"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.black }}>
        <div style={{ color: colors.white }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.black }}>
      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 
            className="text-center text-3xl font-bold tracking-tight"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Complete Your Profile
          </h2>
          <p 
            className="mt-2 text-center text-sm"
            style={{ color: colors.muted }}
          >
            Tell us about yourself to get started
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
            {message && (
              <div className={`mb-4 p-3 rounded text-sm ${
                message.includes("success") 
                  ? ""
                  : ""
              }`}
              style={{ 
                backgroundColor: message.includes("success") ? `${colors.success}10` : `${colors.danger}10`,
                border: message.includes("success") ? `1px solid ${colors.success}30` : `1px solid ${colors.danger}30`,
                color: message.includes("success") ? colors.success : colors.danger
              }}
              >
                {message}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ color: colors.white }}
                >
                  I am a
                </label>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("athlete")}
                    className="flex-1 py-2 px-4 font-medium transition-colors rounded-lg"
                    style={{
                      ...styles.buttonBorder,
                      backgroundColor: role === "athlete" ? colors.accent : colors.surface,
                      color: role === "athlete" ? colors.white : colors.muted
                    }}
                  >
                    Athlete
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("club")}
                    className="flex-1 py-2 px-4 font-medium transition-colors rounded-lg"
                    style={{
                      ...styles.buttonBorder,
                      backgroundColor: role === "club" ? colors.accent : colors.surface,
                      color: role === "club" ? colors.white : colors.muted
                    }}
                  >
                    Club
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium" style={{ color: colors.white }}>
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full text-white shadow-sm sm:text-sm sm:leading-6 outline-none transition-all"
                    style={{ 
                      ...styles.buttonBorder,
                      backgroundColor: colors.input, 
                      border: `1px solid ${colors.surface}`, 
                      color: colors.white,
                      fontFamily: typography.body,
                      padding: "8px 12px"
                    }}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium" style={{ color: colors.white }}>
                  City
                </label>
                <div className="mt-2">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full text-white shadow-sm sm:text-sm sm:leading-6 outline-none transition-all"
                    style={{ 
                      ...styles.buttonBorder,
                      backgroundColor: colors.input, 
                      border: `1px solid ${colors.surface}`, 
                      color: colors.white,
                      fontFamily: typography.body,
                      padding: "8px 12px"
                    }}
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full justify-center py-2 px-3 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  style={{ 
                    ...styles.buttonBorder,
                    backgroundColor: colors.accent, 
                    color: colors.white,
                    fontFamily: typography.display,
                    ...styles.displayHeader
                  }}
                >
                  {saving ? "SAVING..." : "COMPLETE PROFILE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
