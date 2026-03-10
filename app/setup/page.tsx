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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Tell us about yourself to get started
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 px-6 py-8 shadow-lg sm:rounded-lg sm:px-8">
            {message && (
              <div className={`mb-4 p-3 rounded text-sm ${
                message.includes("success") 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {message}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSave}>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  I am a
                </label>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("athlete")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      role === "athlete"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Athlete
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("club")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      role === "club"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Club
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
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
                    className="block w-full rounded-lg border-0 bg-slate-700 py-2 text-white shadow-sm ring-1 ring-inset ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-300">
                  City
                </label>
                <div className="mt-2">
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full rounded-lg border-0 bg-slate-700 py-2 text-white shadow-sm ring-1 ring-inset ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full justify-center rounded-lg bg-blue-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Complete Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
