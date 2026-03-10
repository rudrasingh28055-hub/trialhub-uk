"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TrialRegistration } from "../../lib/trials/types";

interface RegistrationListProps {
  registrations: TrialRegistration[];
  isClubView: boolean;
  onCheckIn?: (id: string) => Promise<void>;
  onEvaluate?: (registration: TrialRegistration) => void;
}

const statusConfig = {
  pending: { color: 'bg-amber-500/20 text-amber-300', label: 'Pending' },
  confirmed: { color: 'bg-sky-500/20 text-sky-300', label: 'Confirmed' },
  attended: { color: 'bg-emerald-500/20 text-emerald-300', label: 'Attended' },
  no_show: { color: 'bg-red-500/20 text-red-300', label: 'No Show' },
  cancelled: { color: 'bg-slate-600/20 text-slate-400', label: 'Cancelled' },
};

const outcomeConfig = {
  pending: { color: 'text-slate-400', label: 'Pending' },
  offered_contract: { color: 'text-emerald-400', label: 'Contract Offered' },
  rejected: { color: 'text-red-400', label: 'Not Selected' },
  waitlist: { color: 'text-amber-400', label: 'Waitlist' },
  academy_invite: { color: 'text-violet-400', label: 'Academy Invite' },
};

export function RegistrationList({ 
  registrations, 
  isClubView, 
  onCheckIn,
  onEvaluate 
}: RegistrationListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const handleCheckIn = useCallback(async (id: string) => {
    if (!onCheckIn) return;
    setCheckingIn(id);
    try {
      await onCheckIn(id);
    } finally {
      setCheckingIn(null);
    }
  }, [onCheckIn]);

  // Filter out cancelled for athlete view, show all for club
  const visibleRegistrations = isClubView 
    ? registrations 
    : registrations.filter(r => r.status !== 'cancelled');

  if (visibleRegistrations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
        <p className="text-slate-400">No registrations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleRegistrations.map((registration) => {
        const isExpanded = expandedId === registration.id;
        const status = statusConfig[registration.status as keyof typeof statusConfig];
        const outcome = outcomeConfig[registration.outcome_status as keyof typeof outcomeConfig];

        return (
          <motion.div
            key={registration.id}
            layout
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            {/* Main Row */}
            <div 
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : registration.id)}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full 
                bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                {registration.profiles?.full_name?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {registration.profiles?.full_name || 'Unknown'}
                  </span>
                  {registration.athlete_passports?.age_band && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                      {registration.athlete_passports.age_band.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  {registration.outcome_status !== 'pending' && (
                    <span className={`text-xs font-medium ${outcome.color}`}>
                      {outcome.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isClubView && registration.status === 'confirmed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckIn(registration.id);
                  }}
                  disabled={checkingIn === registration.id}
                  className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium 
                    text-emerald-300 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {checkingIn === registration.id ? '...' : 'Check In'}
                </button>
              )}

              {/* Expand Icon */}
              <svg 
                className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4 space-y-3">
                    {/* Athlete Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Current Club</span>
                        <p className="text-slate-300">
                          {registration.athlete_passports?.current_club_name || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Identity Verified</span>
                        <p className={registration.athlete_passports?.identity_verified ? 'text-emerald-400' : 'text-amber-400'}>
                          {registration.athlete_passports?.identity_verified ? 'Yes ✓' : 'Pending'}
                        </p>
                      </div>
                    </div>

                    {/* Special Requirements */}
                    {registration.special_requirements && (
                      <div>
                        <span className="text-slate-500 text-sm">Special Requirements</span>
                        <p className="text-slate-300 text-sm mt-1">{registration.special_requirements}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {registration.notes && (
                      <div>
                        <span className="text-slate-500 text-sm">Notes</span>
                        <p className="text-slate-300 text-sm mt-1">{registration.notes}</p>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Registered: {new Date(registration.registered_at).toLocaleString()}</p>
                      {registration.confirmed_at && (
                        <p>Confirmed: {new Date(registration.confirmed_at).toLocaleString()}</p>
                      )}
                      {registration.checked_in_at && (
                        <p>Checked in: {new Date(registration.checked_in_at).toLocaleString()}</p>
                      )}
                    </div>

                    {/* Club Actions */}
                    {isClubView && onEvaluate && registration.status === 'attended' && (
                      <div className="pt-3 border-t border-white/10">
                        <button
                          onClick={() => onEvaluate(registration)}
                          className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 
                            px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all"
                        >
                          Evaluate Athlete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
