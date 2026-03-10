"use client";

import { useEffect, useState, use } from "react";
import Navbar from "../../../components/Navbar";
import { FollowButton } from "../../../components/domain/social-graph/FollowButton";
import { FollowRequestsList } from "../../../components/domain/social-graph/FollowRequestsList";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import type { FollowStatus } from "@/lib/domain/social-graph/types";

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  account_visibility: 'public' | 'private';
}

interface FollowRequest {
  follower_user_id: string;
  followed_user_id: string;
  status: FollowStatus;
  created_at: string;
  approved_at: string | null;
  follower_profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { username } = use(params);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowRequests, setShowFollowRequests] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      console.log(`[UserProfilePage] Loading profile for username: ${username}`);
      
      // Load profile data (using simple API to bypass RLS issues)
      const profileResponse = await fetch(`/api/simple/users/${username}`);
      console.log(`[UserProfilePage] Profile response status:`, profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log(`[UserProfilePage] Profile data:`, profileData);
        setProfile(profileData);
      } else {
        const errorData = await profileResponse.json();
        console.log(`[UserProfilePage] Profile error:`, errorData);
      }

      // Load current user for follow functionality
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log(`[UserProfilePage] Current user:`, user.id);
        setCurrentUser({ id: user.id });

        // Load follow status if not viewing own profile
        if (user.id !== profile?.user_id) {
          // TODO: Add follow status API
          setFollowStatus(null);
        }

        // Load follow requests if viewing own profile
        if (user.id === profile?.user_id) {
          const followRequestsResponse = await fetch('/api/me/follow-requests');
          if (followRequestsResponse.ok) {
            const data = await followRequestsResponse.json();
            setFollowRequests(data.followRequests || []);
          }
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [username, supabase]);

  const handleFollow = async () => {
    if (!currentUser) return { status: 'pending' as FollowStatus };

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data.status);
        return { status: data.status };
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
    return { status: 'pending' as FollowStatus };
  };

  const handleUnfollow = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFollowStatus(null);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleApproveRequest = async (requesterId: string) => {
    try {
      const response = await fetch(`/api/me/follow-requests/${requesterId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setFollowRequests(prev => prev.filter(req => req.follower_user_id !== requesterId));
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    try {
      const response = await fetch(`/api/me/follow-requests/${requesterId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        setFollowRequests(prev => prev.filter(req => req.follower_user_id !== requesterId));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white">User not found</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.user_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center text-white text-2xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.display_name?.[0] || profile.username[0].toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-slate-400">@{profile.username}</p>
                {profile.city && <p className="text-slate-400">{profile.city}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    profile.account_visibility === 'public' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {profile.account_visibility}
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <FollowButton
                targetUsername={username}
                initialStatus={followStatus}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowFollowRequests(!showFollowRequests)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showFollowRequests ? 'Hide' : 'Show'} Follow Requests
              </button>
              <button
                onClick={() => router.push('/athlete/settings')}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
              >
                Privacy Settings
              </button>
            </div>

            {showFollowRequests && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Follow Requests</h2>
                <FollowRequestsList
                  requests={followRequests}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
