"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { AthletePassport } from "../../lib/verifications/types";

interface AthletePassportCardProps {
  passport: AthletePassport | null;
  profile: {
    id: string;
    full_name: string;
    city?: string;
    bio?: string;
  };
  playerProfile?: {
    age?: number;
    primary_position?: string;
    height_cm?: number;
  } | null;
  isOwner?: boolean;
}

export function AthletePassportCard({ 
  passport, 
  profile, 
  playerProfile,
  isOwner = false 
}: AthletePassportCardProps) {
  const readinessScore = passport?.readiness_score || 0;
  const completionPercentage = passport?.profile_completion_percentage || 0;
  
  const getReadinessColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-green-400";
    if (score >= 60) return "from-sky-500 to-blue-400";
    if (score >= 40) return "from-amber-500 to-yellow-400";
    return "from-red-500 to-orange-400";
  };
  
  const getReadinessLabel = (score: number) => {
    if (score >= 80) return "Trial Ready";
    if (score >= 60) return "Good Standing";
    if (score >= 40) return "Building Profile";
    return "Getting Started";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl font-black text-white shadow-lg">
            {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{profile.full_name}</h3>
            <p className="text-sm text-slate-400">{profile.city || "Location not set"}</p>
            {passport?.age_band && (
              <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300">
                {passport.age_band.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        {/* Readiness Score */}
        <div className="relative">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <motion.path
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${readinessScore}, 100` }}
              transition={{ duration: 1, ease: "easeOut" }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={`stroke-gradient-${readinessScore}`}
              style={{
                stroke: readinessScore >= 80 ? '#10b981' : readinessScore >= 60 ? '#3b82f6' : readinessScore >= 40 ? '#f59e0b' : '#ef4444'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-white">{readinessScore}</span>
            <span className="text-[8px] text-slate-400 uppercase">Ready</span>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <TrustIndicatorItem 
          label="Identity Verified" 
          verified={passport?.identity_verified || false}
          icon="🆔"
        />
        <TrustIndicatorItem 
          label="Age Verified" 
          verified={passport?.age_band_verified || false}
          icon="🎂"
        />
        <TrustIndicatorItem 
          label="Club History" 
          verified={passport?.current_club_verified || false}
          icon="⚽"
        />
        <TrustIndicatorItem 
          label="Evidence Complete" 
          verified={completionPercentage >= 80}
          icon="📋"
          value={`${completionPercentage}%`}
        />
      </div>

      {/* Profile Completion */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Profile Completion</span>
          <span className="text-sm font-bold text-white">{completionPercentage}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getReadinessColor(readinessScore)}`}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Player Details */}
      {playerProfile && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
          <DetailItem label="Age" value={playerProfile.age?.toString() || "-"} />
          <DetailItem label="Position" value={playerProfile.primary_position || "-"} />
          <DetailItem label="Height" value={playerProfile.height_cm ? `${playerProfile.height_cm}cm` : "-"} />
        </div>
      )}

      {/* Actions */}
      {isOwner && (
        <div className="mt-6 flex gap-3">
          <Link
            href="/athlete/passport/edit"
            className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white text-center transition-all hover:shadow-lg hover:shadow-sky-500/25"
          >
            Edit Passport
          </Link>
          <Link
            href={`/passport/${profile.id}`}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white text-center transition-all hover:bg-white/10"
          >
            View Public
          </Link>
        </div>
      )}

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          passport?.passport_status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
        }`} />
        <span className="text-xs text-slate-400">
          {passport?.passport_status === 'active' ? 'Active Passport' : 'Draft Mode'}
        </span>
        <span className="text-xs text-slate-500 ml-2">
          {getReadinessLabel(readinessScore)}
        </span>
      </div>
    </div>
  );
}

function TrustIndicatorItem({ 
  label, 
  verified, 
  icon,
  value 
}: { 
  label: string; 
  verified: boolean; 
  icon: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="flex items-center gap-1">
          {verified ? (
            <>
              <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium text-emerald-400">Verified</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-500">Pending</span>
            </>
          )}
          {value && <span className="text-xs text-slate-400 ml-auto">{value}</span>}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
