"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { TrialEvent } from "../../lib/trials/types";

interface TrialCardProps {
  trial: TrialEvent;
  isClubView?: boolean;
  isRegistered?: boolean;
  clubName?: string;
}

export function TrialCard({ trial, isClubView = false, isRegistered = false, clubName }: TrialCardProps) {
  const isOpen = trial.status === 'published' && trial.capacity_remaining > 0;
  const isFull = trial.capacity_remaining === 0;
  const registrationCount = trial.trial_registrations?.[0]?.count || 0;
  
  const statusConfig = {
    draft: { color: 'bg-slate-600', text: 'Draft', icon: '✏️' },
    published: { color: 'bg-emerald-600', text: 'Open', icon: '🟢' },
    closed: { color: 'bg-amber-600', text: 'Closed', icon: '🟡' },
    in_progress: { color: 'bg-sky-600', text: 'In Progress', icon: '⚡' },
    completed: { color: 'bg-slate-600', text: 'Completed', icon: '✓' },
    cancelled: { color: 'bg-red-600', text: 'Cancelled', icon: '✕' },
  };
  
  const typeConfig = {
    open: { label: 'Open Trial', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    invite_only: { label: 'Invite Only', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    academy: { label: 'Academy', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  };
  
  const status = statusConfig[trial.status as keyof typeof statusConfig];
  const type = typeConfig[trial.type as keyof typeof typeConfig];
  
  // Format date
  const trialDate = new Date(trial.date);
  const formattedDate = trialDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  
  // Check if registration is open
  const now = new Date();
  const registrationOpen = trial.registration_opens_at 
    ? new Date(trial.registration_opens_at) <= now 
    : true;
  const registrationClosed = trial.registration_closes_at 
    ? new Date(trial.registration_closes_at) < now 
    : false;
  
  const canRegister = isOpen && registrationOpen && !registrationClosed && !isFull && !isRegistered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 
        p-6 backdrop-blur-sm transition-all hover:border-white/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {/* Type Badge */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
            border ${type.color}`}>
            {type.label}
          </span>
          
          {/* Title */}
          <h3 className="mt-3 text-lg font-bold text-white">{trial.title}</h3>
          
          {/* Club Name */}
          {clubName && (
            <p className="mt-1 text-sm text-slate-400">{clubName}</p>
          )}
        </div>
        
        {/* Date Badge */}
        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase tracking-wider">
            {trialDate.toLocaleDateString('en-GB', { month: 'short' })}
          </div>
          <div className="text-2xl font-black text-white">
            {trialDate.getDate()}
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
          📍 {trial.location_address || "Location TBC"}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
          🕐 {trial.start_time} - {trial.end_time}
        </span>
        {trial.age_eligibility && (
          <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            👤 Ages {trial.age_eligibility.min || 'any'}-{trial.age_eligibility.max || 'any'}
          </span>
        )}
        {trial.positions_needed && trial.positions_needed.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            ⚽ {trial.positions_needed.join(', ')}
          </span>
        )}
      </div>
      
      {/* Capacity */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">
            {registrationCount} registered · {trial.capacity_remaining} spots left
          </span>
          <span className={`font-medium ${
            trial.capacity_remaining > 5 ? 'text-emerald-400' : 
            trial.capacity_remaining > 0 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {trial.capacity_remaining === 0 ? 'Full' : 
             trial.capacity_remaining <= 3 ? 'Almost full' : 
             'Spots available'}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              trial.capacity_remaining === 0 ? 'bg-red-500' :
              trial.capacity_remaining <= 3 ? 'bg-amber-500' :
              'bg-emerald-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(registrationCount / trial.capacity_total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Description */}
      {trial.description && (
        <p className="mt-4 text-sm text-slate-400 line-clamp-2">{trial.description}</p>
      )}
      
      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.color}`} />
          <span className="text-xs text-slate-400">{status.text}</span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {isRegistered ? (
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Registered
            </span>
          ) : canRegister ? (
            <Link
              href={`/trials/${trial.id}/register`}
              className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 
                text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-500/25"
            >
              Register Now
            </Link>
          ) : isFull ? (
            <span className="text-sm text-red-400">Trial Full</span>
          ) : null}
          
          <Link
            href={isClubView ? `/club/trials/${trial.id}` : `/trials/${trial.id}`}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
