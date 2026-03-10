"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { PostCard } from "./feed/PostCard";
import type { Post } from "../lib/feed/types";
import Link from "next/link";

interface AthletePostsSectionProps {
  userId: string;
  userName?: string;
}

export function AthletePostsSection({ userId, userName }: AthletePostsSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserAndPosts() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load user's posts
      const { data: userPosts, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(id, full_name, role, player_profile:player_profiles(primary_position, verification_level))
        `)
        .eq("author_id", userId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading posts:", error);
      } else {
        setPosts(userPosts || []);
      }

      setLoading(false);
    }

    loadUserAndPosts();
  }, [userId, supabase]);

  const handleCreatePost = () => {
    router.push("/post/create");
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    // Update local state optimistically
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked_by_user: isLiked,
              likes_count: isLiked ? (post.likes_count + 1) : (post.likes_count - 1)
            }
          : post
      )
    );
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-6 w-48"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Player Activity</h2>
          <p className="text-sm text-slate-400 mt-1">
            Posts and highlights from {userName || "your"} football journey
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{posts.length}</div>
            <div className="text-xs text-slate-400">Posts</div>
          </div>
          
          <button
            onClick={handleCreatePost}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-1"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Post
            </span>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId || undefined}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="mx-auto h-20 w-20 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-3">No posts yet</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Share your highlights, training sessions, achievements, and match moments to build your football portfolio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreatePost}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/25 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Post
              </span>
            </button>
            
            <Link
              href="/feed"
              className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Explore Feed
              </span>
            </Link>
          </div>
          
          {/* Content Ideas */}
          <div className="mt-12 text-left max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-white mb-4">Content Ideas for Your Profile</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "⚡", title: "Match Highlights", desc: "Showcase your best moments" },
                { icon: "🏃", title: "Training Sessions", desc: "Share your workout routines" },
                { icon: "🏆", title: "Achievements", desc: "Celebrate your successes" },
                { icon: "⚽", title: "Match Moments", desc: "Key plays and skills" },
              ].map((idea, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                  <span className="text-2xl">{idea.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{idea.title}</div>
                    <div className="text-xs text-slate-400">{idea.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View All Posts Link */}
      {posts.length > 0 && (
        <div className="mt-8 text-center pt-6 border-t border-white/10">
          <Link
            href={`/players/${userId}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            View All Posts on Public Profile
          </Link>
        </div>
      )}
    </div>
  );
}
