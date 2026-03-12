"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { PrivacySettings } from "../../../components/domain/profiles/PrivacySettings";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AccountVisibility, DiscoverabilityPolicy, MessagePolicy } from "@/lib/domain/profiles/types";
import { colors, typography, styles, borderRadius } from "../../../lib/design/tokens";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [privacySettings, setPrivacySettings] = useState({
    account_visibility: 'public' as AccountVisibility,
    discoverability_policy: 'everyone' as DiscoverabilityPolicy,
    message_policy: 'requests' as MessagePolicy,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load current privacy settings
      const response = await fetch('/api/me');
      if (response.ok) {
        const { profile } = await response.json();
        if (profile) {
          setPrivacySettings({
            account_visibility: profile.account_visibility,
            discoverability_policy: profile.discoverability_policy,
            message_policy: profile.message_policy,
          });
        }
      }

      setLoading(false);
    }

    loadSettings();
  }, [router, supabase]);

  const handleSavePrivacy = async (settings: any) => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch('/api/me/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage("Privacy settings saved successfully!");
        setPrivacySettings(settings);
      } else {
        setMessage("Failed to save privacy settings");
      }
    } catch (error) {
      setMessage("Error saving privacy settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden" style={{ color: colors.white }}>
        <Navbar />
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
            Loading settings...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ color: colors.white }}>
      <Navbar />
      
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-6 lg:mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Settings
          </h1>
          <p style={{ color: colors.muted }}>Manage your account privacy and preferences</p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: message.includes("successfully") ? `${colors.success}10` : `${colors.danger}10`,
              border: message.includes("successfully") ? `1px solid ${colors.success}30` : `1px solid ${colors.danger}30`,
              color: message.includes("successfully") ? colors.success : colors.danger
            }}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          <PrivacySettings
            initialSettings={privacySettings}
            onSave={handleSavePrivacy}
          />
        </div>
      </section>
    </main>
  );
}
