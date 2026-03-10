"use client";

import { motion } from "framer-motion";

interface TrustScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function TrustScoreBadge({ score, size = "md", showDetails = false }: TrustScoreBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 90) return "from-emerald-500 to-green-500";
    if (score >= 70) return "from-blue-500 to-cyan-500";
    if (score >= 50) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getLabel = (score: number) => {
    if (score >= 90) return "Verified Pro";
    if (score >= 70) return "Verified";
    if (score >= 50) return "Basic";
    return "New";
  };

  const sizeClasses = {
    sm: "h-6 text-xs px-2",
    md: "h-8 text-sm px-3",
    lg: "h-10 text-base px-4",
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${getColor(
          score
        )} ${sizeClasses[size]} font-bold text-white shadow-lg`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>{score}%</span>
      </motion.div>
      {showDetails && (
        <span className="text-sm font-medium text-slate-300">{getLabel(score)}</span>
      )}
    </div>
  );
}

interface VerificationBadgeProps {
  badge: {
    badge_name: string;
    badge_icon?: string;
    badge_color?: string;
    badge_description?: string;
    awarded_at: string;
  };
}

export function VerificationBadge({ badge }: VerificationBadgeProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="group relative flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${
          badge.badge_color || "from-sky-500 to-blue-500"
        } text-2xl shadow-lg`}
      >
        {badge.badge_icon || "🏆"}
      </div>
      <span className="mt-2 text-center text-xs font-semibold text-white">
        {badge.badge_name}
      </span>
      <span className="mt-1 text-center text-[10px] text-slate-400">
        {new Date(badge.awarded_at).toLocaleDateString()}
      </span>
      
      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100">
        {badge.badge_description || badge.badge_name}
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
      </div>
    </motion.div>
  );
}

interface TrustScoreBreakdownProps {
  identityScore: number;
  experienceScore: number;
  skillScore: number;
  reviewScore: number;
  activityScore: number;
}

export function TrustScoreBreakdown({
  identityScore,
  experienceScore,
  skillScore,
  reviewScore,
  activityScore,
}: TrustScoreBreakdownProps) {
  const factors = [
    { label: "Identity", score: identityScore, icon: "🆔", weight: 25 },
    { label: "Experience", score: experienceScore, icon: "💼", weight: 25 },
    { label: "Skills", score: skillScore, icon: "🎯", weight: 20 },
    { label: "Reviews", score: reviewScore, icon: "⭐", weight: 20 },
    { label: "Activity", score: activityScore, icon: "⚡", weight: 10 },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Trust Score Breakdown</h3>
      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="flex items-center gap-3">
            <span className="text-lg">{factor.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">{factor.label}</span>
                <span className="text-sm font-bold text-white">{factor.score}/{factor.weight}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(factor.score / factor.weight) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    factor.score >= factor.weight * 0.8
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : factor.score >= factor.weight * 0.5
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "bg-gradient-to-r from-yellow-500 to-orange-500"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: {
    id: string;
    reviewer_name: string;
    reviewer_avatar?: string;
    rating: number;
    title?: string;
    content?: string;
    is_verified: boolean;
    created_at: string;
    categories?: { category: string; rating: number }[];
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 font-bold text-white">
            {review.reviewer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{review.reviewer_name}</span>
              {review.is_verified && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  VERIFIED
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${
                i < review.rating ? "text-yellow-400" : "text-slate-600"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      {review.title && (
        <h4 className="mt-3 font-semibold text-white">{review.title}</h4>
      )}

      {review.content && (
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{review.content}</p>
      )}

      {review.categories && review.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.categories.map((cat) => (
            <span
              key={cat.category}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
            >
              {cat.category}: {cat.rating}/5
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface DocumentVerificationUploadProps {
  onUpload: (file: File, documentType: string) => void;
  isUploading?: boolean;
}

export function DocumentVerificationUpload({
  onUpload,
  isUploading = false,
}: DocumentVerificationUploadProps) {
  const documentTypes = [
    { value: "identity", label: "ID/Passport", icon: "🆔" },
    { value: "education", label: "Education Certificate", icon: "🎓" },
    { value: "employment", label: "Employment/Contract", icon: "💼" },
    { value: "skill_certificate", label: "Skill Certificate", icon: "🏆" },
    { value: "achievement", label: "Achievement/Award", icon: "🥇" },
    { value: "medical", label: "Medical Clearance", icon: "🏥" },
  ];

  const [selectedType, setSelectedType] = useState(documentTypes[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, selectedType);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-bold text-white">Verify Your Documents</h3>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        {documentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all ${
              selectedType === type.value
                ? "border-sky-500 bg-sky-500/20 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 disabled:opacity-50"
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-slate-300">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-slate-300">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-slate-500">PDF, JPG, PNG (max 10MB)</span>
          </div>
        )}
      </button>
    </div>
  );
}

import { useState, useRef } from "react";
