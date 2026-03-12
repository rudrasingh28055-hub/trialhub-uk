"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { PrivacySettings } from "../../../components/domain/profiles/PrivacySettings";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AccountVisibility, DiscoverabilityPolicy, MessagePolicy } from "@/lib/domain/profiles/types";

export default function ClubSettingsPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Club Settings</h1>
          <p className="text-slate-400">Manage your club privacy and preferences</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("successfully") 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <PrivacySettings
            initialSettings={privacySettings}
            onSave={handleSavePrivacy}
          />
        </div>
      </div>
    </div>
  );
}
