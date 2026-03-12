"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AccountVisibility, DiscoverabilityPolicy, MessagePolicy } from "@/lib/domain/profiles/types";
import { colors, typography, styles, borderRadius } from "../../../lib/design/tokens";

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
    <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
      <h3 
        className="text-lg font-semibold"
        style={{ 
          color: colors.white,
          fontFamily: typography.display,
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}
      >
        Privacy Settings
      </h3>
      
      <div className="space-y-4" style={{ marginTop: "24px" }}>
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: colors.white }}
          >
            Account Visibility
          </label>
          <select
            value={settings.account_visibility}
            onChange={(e) => setSettings({...settings, account_visibility: e.target.value as any})}
            className="w-full px-3 py-2 rounded-lg outline-none transition-all"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.input, 
              border: `1px solid ${colors.surface}`, 
              color: colors.white,
              fontFamily: typography.body
            }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: colors.white }}
          >
            Discoverability
          </label>
          <select
            value={settings.discoverability_policy}
            onChange={(e) => setSettings({...settings, discoverability_policy: e.target.value as any})}
            className="w-full px-3 py-2 rounded-lg outline-none transition-all"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.input, 
              border: `1px solid ${colors.surface}`, 
              color: colors.white,
              fontFamily: typography.body
            }}
          >
            <option value="everyone">Everyone</option>
            <option value="logged_in_only">Logged In Users Only</option>
            <option value="limited">Limited</option>
          </select>
        </div>

        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: colors.white }}
          >
            Message Policy
          </label>
          <select
            value={settings.message_policy}
            onChange={(e) => setSettings({...settings, message_policy: e.target.value as any})}
            className="w-full px-3 py-2 rounded-lg outline-none transition-all"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.input, 
              border: `1px solid ${colors.surface}`, 
              color: colors.white,
              fontFamily: typography.body
            }}
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
        className="px-4 py-2 rounded-lg transition-all disabled:opacity-50"
        style={{ 
          ...styles.buttonBorder,
          backgroundColor: colors.accent, 
          color: colors.white,
          fontFamily: typography.display,
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginTop: "24px"
        }}
      >
        {isLoading ? 'SAVING...' : 'SAVE SETTINGS'}
      </button>
    </div>
  );
}
