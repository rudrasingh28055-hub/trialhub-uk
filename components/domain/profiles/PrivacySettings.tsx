"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AccountVisibility, DiscoverabilityPolicy, MessagePolicy } from "@/lib/domain/profiles/types";

interface PrivacySettingsProps {
  initialSettings: {
    account_visibility: AccountVisibility;
    discoverability_policy: DiscoverabilityPolicy;
    message_policy: MessagePolicy;
  };
  onSave: (settings: any) => Promise<void>;
}

export function PrivacySettings({ initialSettings, onSave }: PrivacySettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(settings);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Privacy Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Account Visibility
          </label>
          <select
            value={settings.account_visibility}
            onChange={(e) => setSettings({...settings, account_visibility: e.target.value as any})}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Discoverability
          </label>
          <select
            value={settings.discoverability_policy}
            onChange={(e) => setSettings({...settings, discoverability_policy: e.target.value as any})}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
          >
            <option value="everyone">Everyone</option>
            <option value="logged_in_only">Logged In Users Only</option>
            <option value="limited">Limited</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Message Policy
          </label>
          <select
            value={settings.message_policy}
            onChange={(e) => setSettings({...settings, message_policy: e.target.value as any})}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
          >
            <option value="open">Open</option>
            <option value="requests">Requests Only</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
