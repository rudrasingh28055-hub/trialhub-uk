"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PrivacySettings } from "../../lib/verifications/types";

interface PrivacySettingsPanelProps {
  settings: PrivacySettings;
  onUpdate?: (settings: PrivacySettings) => void;
  editable?: boolean;
}

const visibilityOptions = [
  { value: 'public', label: 'Public', description: 'Visible to everyone', icon: '🌍' },
  { value: 'clubs_only', label: 'Verified Clubs Only', description: 'Only verified clubs can view', icon: '🏢' },
  { value: 'passport_only', label: 'Passport Link Only', description: 'Only via direct link', icon: '🔗' },
  { value: 'private', label: 'Private', description: 'Only you can view', icon: '🔒' },
];

const toggleOptions = [
  { key: 'show_full_name', label: 'Show Full Name', description: 'Display your full name on passport' },
  { key: 'show_contact_info', label: 'Show Contact Info', description: 'Allow clubs to see your email' },
  { key: 'allow_club_messages', label: 'Allow Club Messages', description: 'Receive messages from verified clubs' },
  { key: 'auto_share_with_verified_clubs', label: 'Auto-Share with Verified Clubs', description: 'Passport visible to verified clubs automatically' },
];

export function PrivacySettingsPanel({ 
  settings, 
  onUpdate, 
  editable = false 
}: PrivacySettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleVisibilityChange = (value: string) => {
    const newSettings = { ...localSettings, passport_visibility: value as PrivacySettings['passport_visibility'] };
    setLocalSettings(newSettings);
    onUpdate?.(newSettings);
  };

  const handleToggleChange = (key: keyof PrivacySettings) => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    onUpdate?.(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Visibility Section */}
      <div>
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Passport Visibility
        </h4>
        
        <div className="grid gap-2">
          {visibilityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => editable && handleVisibilityChange(option.value)}
              disabled={!editable}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                localSettings.passport_visibility === option.value
                  ? 'border-sky-400/50 bg-sky-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              } ${!editable ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-xl">{option.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    localSettings.passport_visibility === option.value ? 'text-sky-300' : 'text-white'
                  }`}>
                    {option.label}
                  </span>
                  {localSettings.passport_visibility === option.value && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
              </div>
              {localSettings.passport_visibility === option.value && (
                <div className="h-5 w-5 rounded-full bg-sky-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles Section */}
      <div className="pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Privacy Options
        </h4>
        
        <div className="space-y-3">
          {toggleOptions.map((option) => {
            const isEnabled = localSettings[option.key as keyof PrivacySettings] as boolean;
            
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{option.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                </div>
                
                {editable ? (
                  <button
                    onClick={() => handleToggleChange(option.key as keyof PrivacySettings)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      isEnabled ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white"
                      animate={{ x: isEnabled ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                ) : (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                    isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {isEnabled ? '✓' : '✕'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <p className="text-sm font-medium text-amber-300">Safety First</p>
            <p className="text-xs text-amber-200/70 mt-1">
              For athletes under 18, we recommend keeping your passport private or 
              visible to verified clubs only. Never share personal contact details publicly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
