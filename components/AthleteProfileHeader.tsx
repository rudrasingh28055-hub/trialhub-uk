"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import { colors, typography, styles, borderRadius } from "../lib/design/tokens";

interface UserRow {
  id: string;
  email?: string | null;
  role?: string | null;
}

interface ProfileRow {
  id: string;
  user_id: string;
  role?: string | null;
  full_name: string | null;
  username: string | null;
  display_name: string | null;
  city: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  username: string | null;
  display_name: string | null;
  city: string | null;
}

interface PlayerProfile {
  age: number | null;
  primary_position: string | null;
  height_cm: number | null;
  previous_club: string | null;
  verification_level: number | null;
}

interface AthleteProfileHeaderProps {
  userId: string;
  onEditProfile: () => void;
  onCreatePost: () => void;
}

export function AthleteProfileHeader({
  userId,
  onEditProfile,
}: AthleteProfileHeaderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileData() {
      setLoading(true);
      const supabase = createClient();

      try {
        const targetUserId = userId;
        if (!targetUserId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [{ data: appUser, error: userError }, { data: profile, error: profileError }] =
          await Promise.all([
            supabase
              .from("users")
              .select("id, email, role")
              .eq("id", targetUserId)
              .maybeSingle<UserRow>(),
            supabase
              .from("profiles")
              .select("id, user_id, role, full_name, username, display_name, city")
              .eq("user_id", targetUserId)
              .maybeSingle<ProfileRow>(),
          ]);

        if (userError) {
          console.error("[AthleteProfileHeader] Users query error", {
            message: userError.message,
            code: userError.code,
            details: userError.details,
            hint: userError.hint,
          });
        }

        if (profileError) {
          console.error("[AthleteProfileHeader] Profile error", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
        }

        const mergedProfile: UserProfile | null =
          appUser || profile
            ? {
                id: profile?.id ?? appUser?.id ?? targetUserId,
                user_id: profile?.user_id ?? appUser?.id ?? targetUserId,
                email: appUser?.email ?? null,
                role: appUser?.role ?? profile?.role ?? null,
                full_name: profile?.full_name ?? null,
                username: profile?.username ?? null,
                display_name: profile?.display_name ?? null,
                city: profile?.city ?? null,
              }
            : null;

        if (!cancelled) {
          setUserProfile(mergedProfile);
        }

        if (profile?.id) {
          const { data: player, error: playerError } = await supabase
            .from("player_profiles")
            .select("age, primary_position, height_cm, previous_club, verification_level")
            .eq("profile_id", profile.id)
            .maybeSingle();

          if (playerError) {
            console.error("[AthleteProfileHeader] Player profile query error", {
              message: playerError.message,
              code: playerError.code,
              details: playerError.details,
              hint: playerError.hint,
            });
          }

          if (!cancelled) {
            setPlayerProfile((player as PlayerProfile) ?? null);
          }
        } else if (!cancelled) {
          setPlayerProfile(null);
        }
      } catch (error) {
        console.error("[AthleteProfileHeader] Unexpected load error", {
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

  const requiredFields = [
    playerProfile?.age,
    playerProfile?.primary_position,
    playerProfile?.height_cm,
    userProfile?.full_name ?? userProfile?.display_name,
    userProfile?.city,
  ];

  const completedFields = requiredFields.filter(
    (field) => field !== null && field !== undefined && field !== ""
  ).length;

  const completionPercentage = Math.round(
    (completedFields / requiredFields.length) * 100
  );

  const verificationBadges = {
    0: { label: "Player", color: colors.muted },
    1: { label: "Verified", color: colors.accent },
    2: { label: "Academy", color: colors.success },
    3: { label: "Pro", color: colors.accent },
    4: { label: "Elite", color: colors.accent },
  } as const;

  const badge =
    verificationBadges[
      (playerProfile?.verification_level as keyof typeof verificationBadges) ?? 0
    ] ?? verificationBadges[0];

  const displayName =
    userProfile?.display_name ||
    userProfile?.full_name ||
    userProfile?.username ||
    "Athlete Profile";

  if (loading) {
    return (
      <div className="animate-pulse">
        <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, height: "128px" }} />
      </div>
    );
  }

  return (
    <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div 
              className="flex h-20 w-20 items-center justify-center text-2xl font-bold text-white shadow-lg"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.accent
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2"
              style={{ backgroundColor: colors.success, borderColor: colors.black }}
            >
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: typography.display,
                ...styles.displayHeader,
                color: colors.white
              }}
            >
              {displayName}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span 
                className="px-3 py-1 text-xs font-semibold"
                style={{ 
                  ...styles.pillBorder,
                  backgroundColor: `${badge.color}10`, 
                  border: `1px solid ${badge.color}30`,
                  color: badge.color
                }}
              >
                {badge.label}
              </span>
              <span 
                className="px-3 py-1 text-xs font-semibold"
                style={{ 
                  ...styles.pillBorder,
                  backgroundColor: `${colors.accent}10`, 
                  border: `1px solid ${colors.accent}30`,
                  color: colors.accent
                }}
              >
                {userProfile?.role === "club" ? "Club" : "Athlete"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4 text-sm lg:grid-cols-4">
          <div>
            <div className="mb-1 text-xs" style={{ color: colors.muted }}>Position</div>
            <div className="font-semibold" style={{ color: colors.white }}>
              {playerProfile?.primary_position || "Not set"}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs" style={{ color: colors.muted }}>Age</div>
            <div className="font-semibold" style={{ color: colors.white }}>
              {playerProfile?.age ? `${playerProfile.age} years` : "Not set"}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs" style={{ color: colors.muted }}>Height</div>
            <div className="font-semibold" style={{ color: colors.white }}>
              {playerProfile?.height_cm ? `${playerProfile.height_cm}cm` : "Not set"}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs" style={{ color: colors.muted }}>Location</div>
            <div className="font-semibold" style={{ color: colors.white }}>
              {userProfile?.city || "Not set"}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <button
            onClick={onEditProfile}
            className="px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-300"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: "transparent", 
              color: colors.white,
              border: `1px solid ${colors.surface}`
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </span>
          </button>

          <Link
            href={`/players/${userId}`}
            className="px-4 py-2 text-sm font-semibold transition-all duration-300"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: `${colors.accent}10`, 
              color: colors.accent,
              border: `1px solid ${colors.accent}30`
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Profile
            </span>
          </Link>
        </div>
      </div>

      <div style={{ marginTop: "24px", borderTop: `1px solid ${colors.surface}`, paddingTop: "24px" }}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 
              className="text-sm font-semibold"
              style={{ 
                fontFamily: typography.display,
                ...styles.displayHeader,
                color: colors.white
              }}
            >
              Profile Completion
            </h3>
            <p className="text-xs" style={{ color: colors.muted }}>
              Complete your profile to increase visibility to clubs
            </p>
          </div>
          <div className="text-right">
            <div 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: typography.display,
                ...styles.displayHeader,
                color: colors.white
              }}
            >
              {completionPercentage}%
            </div>
            <div className="text-xs" style={{ color: colors.muted }}>Complete</div>
          </div>
        </div>

        <div className="relative h-3 overflow-hidden rounded-full" style={{ backgroundColor: colors.surface }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ 
              width: `${completionPercentage}%`,
              backgroundColor: colors.accent
            }}
          />
        </div>

        {completionPercentage < 100 && (
          <div className="mt-3 text-xs" style={{ color: colors.muted }}>
            Add {requiredFields.length - completedFields} more field
            {requiredFields.length - completedFields === 1 ? "" : "s"} to complete your profile
          </div>
        )}
      </div>
    </div>
  );
}
