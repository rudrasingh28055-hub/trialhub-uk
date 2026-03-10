"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Test API endpoints
      const results: string[] = [];

      try {
        // Test /api/me
        const meResponse = await fetch('/api/me');
        if (meResponse.ok) {
          const meData = await meResponse.json();
          setProfile(meData.profile);
          results.push('✅ /api/me - Working');
        } else {
          results.push('❌ /api/me - Failed');
        }
      } catch (error) {
        results.push('❌ /api/me - Error');
      }

      try {
        // Test privacy endpoint
        const privacyResponse = await fetch('/api/me/privacy', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_visibility: 'public' })
        });
        if (privacyResponse.ok) {
          results.push('✅ /api/me/privacy - Working');
        } else {
          results.push('❌ /api/me/privacy - Failed');
        }
      } catch (error) {
        results.push('❌ /api/me/privacy - Error');
      }

      try {
        // Test follow requests endpoint
        const followRequestsResponse = await fetch('/api/me/follow-requests');
        if (followRequestsResponse.ok) {
          results.push('✅ /api/me/follow-requests - Working');
        } else {
          results.push('❌ /api/me/follow-requests - Failed');
        }
      } catch (error) {
        results.push('❌ /api/me/follow-requests - Error');
      }

      setTestResults(results);
    }

    loadUser();
  }, [router, supabase]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sprint 1 Test Page</h1>
          <p className="text-slate-400">Testing all new privacy and social graph features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">User Info</h2>
            <div className="space-y-2 text-slate-300">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              {profile && (
                <>
                  <p><strong>Username:</strong> {profile.username}</p>
                  <p><strong>Display Name:</strong> {profile.display_name}</p>
                  <p><strong>Account Visibility:</strong> {profile.account_visibility}</p>
                  <p><strong>Discoverability:</strong> {profile.discoverability_policy}</p>
                  <p><strong>Message Policy:</strong> {profile.message_policy}</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">API Test Results</h2>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <p key={index} className="text-slate-300">{result}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/athlete/settings"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
            >
              Athlete Settings
            </a>
            <a
              href="/club/settings"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
            >
              Club Settings
            </a>
            <a
              href={`/users/${profile?.username || 'testuser'}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
            >
              Profile View
            </a>
            <a
              href="/feed"
              className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-center"
            >
              Back to Feed
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
