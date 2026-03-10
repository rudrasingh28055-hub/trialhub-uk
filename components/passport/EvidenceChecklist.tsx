"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EvidenceChecklist, PrivacySettings } from "../../lib/verifications/types";

interface EvidenceChecklistProps {
  checklist: EvidenceChecklist;
  onToggle?: (key: keyof EvidenceChecklist) => void;
  editable?: boolean;
}

const evidenceItems: { key: keyof EvidenceChecklist; label: string; description: string; priority: 'required' | 'recommended' | 'optional' }[] = [
  {
    key: "identity_document",
    label: "Identity Document",
    description: "Valid passport or national ID card",
    priority: "required",
  },
  {
    key: "proof_of_age",
    label: "Proof of Age",
    description: "Birth certificate or verified age document",
    priority: "required",
  },
  {
    key: "current_club_letter",
    label: "Current Club Letter",
    description: "Letter from your current club confirming your status",
    priority: "recommended",
  },
  {
    key: "coach_endorsement",
    label: "Coach Endorsement",
    description: "Verified endorsement from a qualified coach",
    priority: "recommended",
  },
  {
    key: "highlight_video",
    label: "Highlight Video",
    description: "Video showcasing your skills and gameplay",
    priority: "recommended",
  },
  {
    key: "academic_records",
    label: "Academic Records",
    description: "School or college records (important for youth players)",
    priority: "optional",
  },
  {
    key: "medical_clearance",
    label: "Medical Clearance",
    description: "Sports medical clearance certificate",
    priority: "optional",
  },
];

export function EvidenceChecklistView({ 
  checklist, 
  onToggle, 
  editable = false 
}: EvidenceChecklistProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = evidenceItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'required': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'recommended': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'optional': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Evidence Progress</span>
          <span className="text-sm font-bold text-white">{completedCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Complete all required evidence to maximize your passport strength
        </p>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {evidenceItems.map((item) => {
          const isCompleted = checklist[item.key];
          const isExpanded = expanded === String(item.key);

          return (
            <motion.div
              key={String(item.key)}
              layout
              className={`rounded-xl border p-4 transition-all ${
                isCompleted 
                  ? 'border-emerald-400/30 bg-emerald-500/5' 
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                {editable ? (
                  <button
                    onClick={() => onToggle?.(item.key)}
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
                      isCompleted
                        ? 'border-emerald-400 bg-emerald-500 text-white'
                        : 'border-slate-600 hover:border-sky-400'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : '○'}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                      {item.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : String(item.key))}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <p className="text-sm text-slate-400">{item.description}</p>
                    
                    {editable && !isCompleted && (
                      <div className="mt-3 flex gap-2">
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors">
                          Upload Document
                        </button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
                          Request Verification
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
