"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function MatchScore({ score, size = "md", showLabel = true }: MatchScoreProps) {
  const getColor = (score: number) => {
    if (score >= 85) return "from-emerald-500 to-green-500";
    if (score >= 70) return "from-blue-500 to-cyan-500";
    if (score >= 50) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getLabel = (score: number) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Good Match";
    if (score >= 50) return "Fair Match";
    return "Low Match";
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${getColor(
          score
        )} flex items-center justify-center font-black text-white shadow-lg`}
      >
        <span className="relative z-10">{score}</span>
        <div className="absolute inset-0 rounded-full bg-white/20" />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{getLabel(score)}</span>
          <span className="text-xs text-slate-400">Match Score</span>
        </div>
      )}
    </div>
  );
}

interface MatchScoreBreakdownProps {
  positionScore: number;
  ageScore: number;
  locationScore: number;
  experienceScore: number;
  skillScore: number;
}

export function MatchScoreBreakdown({
  positionScore,
  ageScore,
  locationScore,
  experienceScore,
  skillScore,
}: MatchScoreBreakdownProps) {
  const factors = [
    { label: "Position", score: positionScore, icon: "⚽" },
    { label: "Age", score: ageScore, icon: "🎂" },
    { label: "Location", score: locationScore, icon: "📍" },
    { label: "Experience", score: experienceScore, icon: "⭐" },
    { label: "Skills", score: skillScore, icon: "🎯" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {factors.map((factor) => (
        <div
          key={factor.label}
          className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
        >
          <span className="text-lg">{factor.icon}</span>
          <span className="mt-1 text-xs font-medium text-slate-300">{factor.label}</span>
          <span
            className={`mt-1 text-sm font-bold ${
              factor.score >= 70
                ? "text-emerald-400"
                : factor.score >= 50
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {factor.score}%
          </span>
        </div>
      ))}
    </div>
  );
}

interface MatchingReasonsProps {
  reasons: string[];
}

export function MatchingReasons({ reasons }: MatchingReasonsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-white">Why this matches:</h4>
      <ul className="space-y-1">
        {reasons.map((reason, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-2 text-sm text-slate-300"
          >
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{reason}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: {
    id: string;
    type: "player_for_club" | "opportunity_for_player";
    target: any;
    match_score: number;
    reasons: string[];
  };
  onView?: () => void;
  onSave?: () => void;
}

export function RecommendationCard({
  recommendation,
  onView,
  onSave,
}: RecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isPlayer = recommendation.type === "player_for_club";
  const target = recommendation.target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl"
    >
      {/* Match Score Badge */}
      <div className="absolute -top-3 -right-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
            recommendation.match_score >= 80
              ? "from-emerald-500 to-green-500"
              : recommendation.match_score >= 60
              ? "from-blue-500 to-cyan-500"
              : "from-yellow-500 to-orange-500"
          } font-black text-white shadow-lg`}
        >
          {recommendation.match_score}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-xl font-black text-white shadow-lg">
          {isPlayer
            ? target.full_name?.charAt(0)?.toUpperCase() || "A"
            : target.title?.charAt(0)?.toUpperCase() || "O"}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            {isPlayer ? target.full_name || "Unnamed Athlete" : target.title || "Untitled Opportunity"}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {isPlayer
              ? `${target.age || "N/A"} years • ${target.primary_position || "Unknown Position"} • ${target.city || "Unknown Location"}`
              : `${target.type || "Unknown Type"} • ${target.location_city || "Unknown Location"} • ${target.age_group || "All Ages"}`}
          </p>
        </div>
      </div>

      {/* Match Reasons */}
      <div className="mt-4 space-y-1">
        {recommendation.reasons.slice(0, 3).map((reason, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="truncate">{reason}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onView}
          className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/25"
        >
          View Details
        </button>
        <button
          onClick={onSave}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Hover Glow Effect */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-sky-500/20 to-blue-500/20 blur-xl"
        />
      )}
    </motion.div>
  );
}

interface SmartMatchingDashboardProps {
  recommendations: any[];
  userRole: "athlete" | "club";
}

export function SmartMatchingDashboard({
  recommendations,
  userRole,
}: SmartMatchingDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">AI Smart Matches</h2>
          <p className="text-slate-400">
            {userRole === "athlete"
              ? "Opportunities that match your profile"
              : "Athletes that match your requirements"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
          <span className="text-sm font-medium text-sky-300">AI Powered</span>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">No matches yet</h3>
          <p className="text-sm text-slate-400 mt-2">
            {userRole === "athlete"
              ? "Complete your profile to get better recommendations"
              : "Post more opportunities to find matching athletes"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onView={() => {
                // Handle view action
                window.location.href =
                  rec.type === "opportunity_for_player"
                    ? `/opportunities/${rec.target.id}`
                    : `/players/${rec.target.id}`;
              }}
              onSave={() => {
                // Handle save action
                console.log("Saved recommendation:", rec.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
