"use client";

import { motion } from "framer-motion";
import type { VerificationTier, VerificationStatus } from "../../lib/verifications/types";

interface VerificationBadgeProps {
  tier: VerificationTier;
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const tierConfig: Record<VerificationTier, {
  label: string;
  color: string;
  bgGradient: string;
  icon: string;
}> = {
  unverified: {
    label: "Unverified",
    color: "text-slate-400",
    bgGradient: "from-slate-600 to-slate-500",
    icon: "⚪",
  },
  bronze: {
    label: "Bronze Verified",
    color: "text-amber-400",
    bgGradient: "from-amber-600 to-amber-500",
    icon: "🥉",
  },
  silver: {
    label: "Silver Verified",
    color: "text-slate-300",
    bgGradient: "from-slate-400 to-slate-300",
    icon: "🥈",
  },
  gold: {
    label: "Gold Verified",
    color: "text-yellow-400",
    bgGradient: "from-yellow-500 to-amber-400",
    icon: "🥇",
  },
};

const statusConfig: Record<VerificationStatus, {
  label: string;
  badgeColor: string;
}> = {
  pending: {
    label: "Pending Review",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  in_review: {
    label: "Under Review",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  verified: {
    label: "Verified",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  suspended: {
    label: "Suspended",
    badgeColor: "bg-red-600/20 text-red-400 border-red-600/30",
  },
};

export function VerificationBadge({ 
  tier, 
  status, 
  size = "md",
  showTooltip = true 
}: VerificationBadgeProps) {
  const tierInfo = tierConfig[tier];
  const statusInfo = statusConfig[status];
  
  const sizeClasses = {
    sm: "h-6 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  };
  
  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="relative group">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-2 rounded-full border border-white/10 
          bg-gradient-to-r ${tierInfo.bgGradient} ${sizeClasses[size]} 
          font-semibold text-white shadow-lg backdrop-blur-sm`}
      >
        <span className={iconSizes[size]}>{tierInfo.icon}</span>
        <span>{tierInfo.label}</span>
      </motion.div>
      
      {/* Status badge */}
      {status !== "verified" && (
        <span className={`absolute -top-1 -right-1 inline-flex items-center px-2 py-0.5 
          rounded-full text-xs font-medium border ${statusInfo.badgeColor}`}>
          {statusInfo.label}
        </span>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 
          transition-all duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64">
          <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl 
            p-3 shadow-2xl">
            <p className="text-sm font-semibold text-white">{tierInfo.label}</p>
            <p className="text-xs text-slate-400 mt-1">
              {status === "verified" 
                ? "This club has been verified by the AthLink trust team."
                : `Status: ${statusInfo.label}. Verification ensures club legitimacy and athlete safety.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrustScoreMeter({ 
  score, 
  size = "md" 
}: { 
  score: number; 
  size?: "sm" | "md" | "lg";
}) {
  const getColor = (s: number) => {
    if (s >= 80) return "from-emerald-500 to-green-400";
    if (s >= 60) return "from-sky-500 to-blue-400";
    if (s >= 40) return "from-amber-500 to-yellow-400";
    return "from-red-500 to-orange-400";
  };
  
  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Improvement";
  };
  
  const sizeClasses = {
    sm: { container: "w-24", score: "text-lg" },
    md: { container: "w-32", score: "text-2xl" },
    lg: { container: "w-40", score: "text-3xl" },
  };

  return (
    <div className={`${sizeClasses[size].container} relative`}>
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <motion.path
          initial={{ strokeDasharray: "0, 100" }}
          animate={{ strokeDasharray: `${score}, 100` }}
          transition={{ duration: 1, ease: "easeOut" }}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`text-emerald-500`} />
            <stop offset="100%" className={`text-green-400`} />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${sizeClasses[size].score} font-black text-white`}>
          {score}
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Trust
        </span>
      </div>
      
      {/* Label */}
      <p className="text-center mt-2 text-xs font-medium text-slate-300">
        {getLabel(score)}
      </p>
    </div>
  );
}

export function VerifiedCheckmark({ 
  size = "md",
  verified = true 
}: { 
  size?: "sm" | "md" | "lg";
  verified?: boolean;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (!verified) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-slate-600/50 flex items-center justify-center`}>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-green-500 
        flex items-center justify-center shadow-lg shadow-emerald-500/30`}
    >
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </motion.div>
  );
}

export function TrustIndicator({ 
  label, 
  verified, 
  tooltip 
}: { 
  label: string; 
  verified: boolean;
  tooltip?: string;
}) {
  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <VerifiedCheckmark verified={verified} />
      <span className="text-sm font-medium text-slate-300">{label}</span>
      
      {tooltip && (
        <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 
          transition-all duration-200 left-full ml-2 w-48">
          <div className="rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl 
            p-2 shadow-xl">
            <p className="text-xs text-slate-300">{tooltip}</p>
          </div>
        </div>
      )}
    </div>
  );
}
