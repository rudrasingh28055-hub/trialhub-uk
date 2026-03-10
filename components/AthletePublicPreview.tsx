"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  city: string | null;
  bio: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  city: string | null;
  bio: string | null;
}

interface PlayerProfile {
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
  verification_level: number | null;
}

export function AthletePublicPreview({ userId }: { userId: string }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileData() {
      const supabase = createClient();
      setLoading(true);

      try {
        if (!userId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, display_name, username, city, bio")
          .eq("user_id", userId)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          console.error("[AthletePublicPreview] Profile error", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
        }

        if (!cancelled) {
          setUserProfile(
            profile
              ? {
                  id: profile.id,
                  user_id: profile.user_id,
                  full_name: profile.full_name,
                  display_name: profile.display_name,
                  username: profile.username,
                  city: profile.city,
                  bio: profile.bio,
                }
              : null
          );
        }

        if (profile?.id) {
          const { data: player, error: playerError } = await supabase
            .from("player_profiles")
            .select(
              "age, primary_position, secondary_position, dominant_foot, height_cm, previous_club, video_url, instagram_url, verification_level"
            )
            .eq("profile_id", profile.id)
            .maybeSingle<PlayerProfile>();

          if (playerError) {
            console.error("[AthletePublicPreview] Player error", {
              message: playerError.message,
              code: playerError.code,
              details: playerError.details,
              hint: playerError.hint,
            });
          }

          if (!cancelled) {
            setPlayerProfile(player ?? null);
          }
        } else if (!cancelled) {
          setPlayerProfile(null);
        }
      } catch (error) {
        console.error("[AthletePublicPreview] Unexpected load error", {
          message: error instanceof Error ? error.message : "Unknown error",
          error,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfileData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const verificationBadges = {
    0: { label: "Player", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    1: { label: "Verified", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    2: { label: "Academy", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    3: { label: "Pro", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    4: { label: "Elite", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  } as const;

  const badge =
    verificationBadges[
      (playerProfile?.verification_level as keyof typeof verificationBadges) ?? 0
    ] ?? verificationBadges[0];

  const displayName =
    userProfile?.display_name ||
    userProfile?.full_name ||
    userProfile?.username ||
    "Athlete Name";

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Public Profile Preview</h2>
          <p className="mt-1 text-sm text-slate-400">
            This is how clubs and other users see your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">Live Preview</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/50 to-slate-900/50 p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 text-xl font-bold text-white shadow-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-xl font-bold text-white">{displayName}</h3>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              {playerProfile?.primary_position && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {playerProfile.primary_position}
                </span>
              )}

              {playerProfile?.age && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {playerProfile.age} years
                </span>
              )}

              {userProfile?.city && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {userProfile.city}
                </span>
              )}

              {playerProfile?.height_cm && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {playerProfile.height_cm}cm
                </span>
              )}
            </div>
          </div>
        </div>

        {userProfile?.bio && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm leading-relaxed text-slate-300">{userProfile.bio}</p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {playerProfile?.secondary_position && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/20">
                <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400">Secondary Position</div>
                <div className="text-sm font-medium text-white">{playerProfile.secondary_position}</div>
              </div>
            </div>
          )}

          {playerProfile?.dominant_foot && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400">Dominant Foot</div>
                <div className="text-sm font-medium text-white">{playerProfile.dominant_foot}</div>
              </div>
            </div>
          )}

          {playerProfile?.previous_club && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/20">
                <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400">Previous Club</div>
                <div className="text-sm font-medium text-white">{playerProfile.previous_club}</div>
              </div>
            </div>
          )}

          {playerProfile?.video_url && (
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/20">
                <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400">Highlight Video</div>
                <div className="text-sm font-medium text-white">Available</div>
              </div>
            </div>
          )}
        </div>

        {playerProfile?.instagram_url && (
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/20">
              <svg className="h-4 w-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-400">Instagram</div>
              <div className="text-sm font-medium text-white">Connected</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 border-t border-white/10 pt-4">
          <button className="flex-1 rounded-xl border border-sky-400/30 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-300 transition-colors hover:bg-sky-500/30">
            Contact
          </button>
          <button className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30">
            Save Player
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/players/${userId}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/20"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Full Public Profile
        </Link>
      </div>
    </div>
  );
}
