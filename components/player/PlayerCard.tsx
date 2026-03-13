"use client";

import Link from "next/link";
import { colors, typography, borderRadius, glassPanel } from "@/lib/design/tokens";
import { FollowButton } from "@/components/FollowButton";

export type PlayerCardProps = {
  profile_id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
  age: number | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_foot: string | null;
  height_cm: number | null;
  previous_club: string | null;
  video_url: string | null;
  instagram_url: string | null;
  rating?: number;
  scoutInterest?: number;
  isVerified?: boolean;
  avatarUrl?: string;
  currentProfileId?: string;
};

export default function PlayerCard(props: PlayerCardProps) {
  const {
    profile_id,
    full_name,
    city,
    bio,
    age,
    primary_position,
    secondary_position,
    dominant_foot,
    height_cm,
    previous_club,
    video_url,
    instagram_url,
    rating = 0,
    scoutInterest = 0,
    isVerified = false,
    avatarUrl,
    currentProfileId,
  } = props;

  return (
    <Link 
      href={`/profile/${profile_id}`}
      className="block transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <div 
        className="relative overflow-hidden cursor-pointer"
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          padding: '20px'
        }}
      >
        {/* Rating Badge */}
        <div 
          className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
          style={{
            backgroundColor: colors.electricViolet,
            color: colors.white,
            fontFamily: typography.family
          }}
        >
          {rating || '—'}
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              backgroundColor: colors.surface,
              color: colors.white,
              fontFamily: typography.family
            }}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={full_name || 'Player'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              full_name?.charAt(0)?.toUpperCase() || 'P'
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="text-xl font-bold truncate"
                style={{
                  color: colors.white,
                  fontFamily: typography.family
                }}
              >
                {full_name || "Unnamed Player"}
              </h3>
              {isVerified && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: colors.success,
                    color: colors.white
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.white
                }}
              >
                {primary_position || "Position"}
              </span>
              <span style={{ color: colors.muted }}>
                {city || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p 
            className="text-sm mb-4 line-clamp-2"
            style={{ 
              color: colors.muted,
              fontFamily: typography.body
            }}
          >
            {bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            className="p-3 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="text-xs" style={{ color: colors.muted }}>Age</div>
            <div 
              className="text-lg font-semibold"
              style={{ color: colors.white }}
            >
              {age ?? '—'}
            </div>
          </div>
          
          <div 
            className="p-3 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="text-xs" style={{ color: colors.muted }}>Height</div>
            <div 
              className="text-lg font-semibold"
              style={{ color: colors.white }}
            >
              {height_cm ? `${height_cm}cm` : '—'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-1 text-sm"
            style={{ color: colors.muted }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {scoutInterest} Scouts
          </div>

          {previous_club && (
            <div className="text-sm truncate" style={{ color: colors.muted }}>
              {previous_club}
            </div>
          )}
        </div>

        {/* Follow button */}
        {currentProfileId && currentProfileId !== profile_id && (
          <div
            className="mt-3 pt-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.preventDefault()}
          >
            <FollowButton
              currentProfileId={currentProfileId}
              targetProfileId={profile_id}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

