"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { AthleteProfileHeader } from "../../../components/AthleteProfileHeader";
import { AthletePublicPreview } from "../../../components/AthletePublicPreview";
import { AthletePostsSection } from "../../../components/AthletePostsSection";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { colors, typography, styles, borderRadius } from "../../../lib/design/tokens";

export default function AthleteProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [age, setAge] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState("");
  const [secondaryPosition, setSecondaryPosition] = useState("");
  const [dominantFoot, setDominantFoot] = useState("");
  const [height, setHeight] = useState("");
  const [previousClub, setPreviousClub] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [instagram, setInstagram] = useState("");

  const [playerProfileId, setPlayerProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: baseProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id, role, full_name, display_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("[AthleteProfilePage] Base profile error", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
        }

        if (!baseProfile) {
          router.push("/setup");
          return;
        }

        const effectiveRole = baseProfile.role ?? "athlete";
        if (effectiveRole !== "athlete") {
          router.push("/feed");
          return;
        }

        if (!cancelled) {
          setUserId(baseProfile.user_id ?? user.id);
          setProfileId(baseProfile.id);
          setUserName(baseProfile.display_name || baseProfile.full_name || null);
        }

        const { data: playerProfile, error: playerError } = await supabase
          .from("player_profiles")
          .select("*")
          .eq("profile_id", baseProfile.id)
          .maybeSingle();

        if (playerError) {
          console.error("[AthleteProfilePage] Player profile load error", {
            message: playerError.message,
            code: playerError.code,
            details: playerError.details,
            hint: playerError.hint,
          });
        }

        if (!playerProfile) {
          const { data: created, error: createError } = await supabase
            .from("player_profiles")
            .insert([{ profile_id: baseProfile.id }])
            .select("*")
            .single();

          if (createError) {
            console.error("[AthleteProfilePage] Player profile create error", {
              message: createError.message,
              code: createError.code,
              details: createError.details,
              hint: createError.hint,
            });
          }

          if (!cancelled && created) {
            setPlayerProfileId(created.id);
          }

          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setPlayerProfileId(playerProfile.id);
          setAge(playerProfile.age?.toString() || "");
          setPrimaryPosition(playerProfile.primary_position || "");
          setSecondaryPosition(playerProfile.secondary_position || "");
          setDominantFoot(playerProfile.dominant_foot || "");
          setHeight(playerProfile.height_cm?.toString() || "");
          setPreviousClub(playerProfile.previous_club || "");
          setVideoUrl(playerProfile.video_url || "");
          setInstagram(playerProfile.instagram_url || "");
          setLoading(false);
        }
      } catch (error) {
        console.error("[AthleteProfilePage] Unexpected load error", error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function saveProfile() {
    if (!playerProfileId) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("player_profiles")
      .update({
        age: age ? Number(age) : null,
        primary_position: primaryPosition || null,
        secondary_position: secondaryPosition || null,
        dominant_foot: dominantFoot || null,
        height_cm: height ? Number(height) : null,
        previous_club: previousClub || null,
        video_url: videoUrl || null,
        instagram_url: instagram || null,
      })
      .eq("id", playerProfileId);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile saved successfully.");
    setSaving(false);
  }

  const handleCreatePost = () => {
    router.push("/post/create");
  };

  const handleEditProfile = () => {
    setShowEditMode(!showEditMode);
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden" style={{ color: colors.white }}>
        <Navbar />
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
            Loading athlete profile...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ color: colors.white }}>
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          {userId && (
            <AthleteProfileHeader
              userId={userId}
              onEditProfile={handleEditProfile}
              onCreatePost={handleCreatePost}
            />
          )}
        </div>

        <div className="flex flex-col gap-8 xl:flex-row">
          <div className="flex-1 space-y-8">
            {showEditMode && (
              <div className="p-4 backdrop-blur-sm"
                style={{ 
                  ...styles.sheetBorder,
                  backgroundColor: `${colors.accent}10`, 
                  border: `1px solid ${colors.accent}30`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" style={{ color: colors.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span 
                      className="text-sm font-semibold"
                      style={{ 
                        ...styles.displayHeader,
                        color: colors.accent
                      }}
                    >
                      Edit Mode
                    </span>
                  </div>
                  <button
                    onClick={() => setShowEditMode(false)}
                    className="transition-colors"
                    style={{ color: colors.muted }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {showEditMode && (
              <>
                <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
                  <p 
                    className="mb-6 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ 
                      ...styles.displayHeader,
                      color: colors.muted
                    }}
                  >
                    Core Details
                  </p>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Age</label>
                      <input
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Height (cm)</label>
                      <input
                        placeholder="Height"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Primary Position</label>
                      <input
                        placeholder="e.g. CM, ST"
                        value={primaryPosition}
                        onChange={(e) => setPrimaryPosition(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Secondary Position</label>
                      <input
                        placeholder="Secondary position"
                        value={secondaryPosition}
                        onChange={(e) => setSecondaryPosition(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Dominant Foot</label>
                      <input
                        placeholder="Right / Left"
                        value={dominantFoot}
                        onChange={(e) => setDominantFoot(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
                  <p 
                    className="mb-6 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ 
                      ...styles.displayHeader,
                      color: colors.muted
                    }}
                  >
                    Career & Links
                  </p>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Previous Club</label>
                      <input
                        placeholder="Previous club"
                        value={previousClub}
                        onChange={(e) => setPreviousClub(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Highlight Video URL</label>
                      <input
                        placeholder="Video URL"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-medium" style={{ color: colors.muted }}>Instagram URL</label>
                      <input
                        placeholder="Instagram URL"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full text-sm outline-none transition-all"
                        style={{ 
                          ...styles.buttonBorder,
                          backgroundColor: colors.input, 
                          border: `1px solid ${colors.surface}`, 
                          color: colors.white,
                          fontFamily: typography.body,
                          padding: "12px 16px"
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {message && (
                      <div
                        className="text-sm"
                        style={{
                          color: message.includes("successfully") ? colors.success : colors.danger
                        }}
                      >
                        {message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditMode(false)}
                      className="px-6 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300"
                      style={{ 
                        ...styles.buttonBorder,
                        backgroundColor: "transparent", 
                        color: colors.white,
                        border: `1px solid ${colors.surface}`
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-6 py-3 text-sm font-semibold transition-all duration-300 disabled:opacity-60"
                      style={{ 
                        ...styles.buttonBorder,
                        backgroundColor: colors.accent, 
                        color: colors.white,
                        ...styles.displayHeader
                      }}
                    >
                      {saving ? "SAVING..." : "SAVE CHANGES"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {userId && <AthletePublicPreview userId={userId} />}

            {userId && <AthletePostsSection userId={userId} userName={userName || undefined} />}
          </div>

          {showEditMode && (
            <div className="w-full xl:w-80">
              <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
                <p 
                  className="mb-6 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ 
                    ...styles.displayHeader,
                    color: colors.muted
                  }}
                >
                  Profile Strength
                </p>

                <div className="space-y-3">
                  {[
                    ["Age", age],
                    ["Primary position", primaryPosition],
                    ["Dominant foot", dominantFoot],
                    ["Height", height],
                    ["Previous club", previousClub],
                    ["Highlight video", videoUrl],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-3"
                      style={{ 
                        ...styles.buttonBorder,
                        backgroundColor: colors.surface, 
                        border: `1px solid ${colors.input}`
                      }}
                    >
                      <span className="text-sm" style={{ color: colors.white }}>{label}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: value ? colors.success : colors.muted
                        }}
                      >
                        {value ? "Added" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6" style={{ borderTop: `1px solid ${colors.surface}`, paddingTop: "24px" }}>
                  <div className="text-center">
                    <div 
                      className="text-2xl font-bold"
                      style={{
                        ...styles.displayHeader,
                        color: colors.white
                      }}
                    >
                      {Math.round(
                        ([age, primaryPosition, dominantFoot, height, previousClub, videoUrl].filter(Boolean).length / 6) * 100
                      )}
                      %
                    </div>
                    <div className="text-xs" style={{ color: colors.muted }}>Complete</div>
                  </div>
                </div>
              </div>

              <div className="p-6 shadow-xl"
                style={{ 
                  ...styles.sheetBorder,
                  backgroundColor: `${colors.success}10`, 
                  border: `1px solid ${colors.success}30`,
                  marginTop: "24px"
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <svg className="h-5 w-5" style={{ color: colors.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p 
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ 
                      ...styles.displayHeader,
                      color: colors.success
                    }}
                  >
                    Pro Tips
                  </p>
                </div>

                <ul className="space-y-3 text-sm" style={{ color: colors.white }}>
                  <li className="flex items-start gap-2">
                    <div 
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" 
                      style={{ backgroundColor: colors.success }} 
                    />
                    <span>Add a highlight video to showcase your skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div 
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" 
                      style={{ backgroundColor: colors.success }} 
                    />
                    <span>Complete all fields for maximum visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div 
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" 
                      style={{ backgroundColor: colors.success }} 
                    />
                    <span>Connect Instagram to show your personality</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
