"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { PostCard } from "./feed/PostCard";
import type { Post } from "../lib/feed/types";
import Link from "next/link";
import { colors, typography, styles, borderRadius } from "../lib/design/tokens";

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
      <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
        <div className="animate-pulse">
          <div className="h-8 rounded-xl mb-6 w-48" style={{ backgroundColor: colors.surface }}></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl" style={{ backgroundColor: colors.surface }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "32px" }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 
            className="text-2xl font-bold"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            Player Activity
          </h2>
          <p 
            className="text-sm mt-1"
            style={{ color: colors.muted }}
          >
            Posts and highlights from {userName || "your"} football journey
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: typography.display,
                ...styles.displayHeader,
                color: colors.white
              }}
            >
              {posts.length}
            </div>
            <div className="text-xs" style={{ color: colors.muted }}>Posts</div>
          </div>
          
          <button
            onClick={handleCreatePost}
            className="px-4 py-2 text-sm font-semibold transition-all duration-300"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.accent, 
              color: colors.white,
              fontFamily: typography.display,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
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
          <div 
            className="mx-auto h-20 w-20 flex items-center justify-center mb-6"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.input}`
            }}
          >
            <svg className="h-10 w-10" style={{ color: colors.muted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          
          <h3 
            className="text-xl font-semibold mb-3"
            style={{ 
              fontFamily: typography.display,
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            No posts yet
          </h3>
          <p 
            className="mb-8 max-w-md mx-auto"
            style={{ color: colors.muted }}
          >
            Share your highlights, training sessions, achievements, and match moments to build your football portfolio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreatePost}
              className="px-6 py-3 text-sm font-semibold transition-all duration-300"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.accent, 
                color: colors.white,
                fontFamily: typography.display,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
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
              className="px-6 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: "transparent", 
                color: colors.white,
                border: `1px solid ${colors.surface}`
              }}
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
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ 
                fontFamily: typography.display,
                ...styles.displayHeader,
                color: colors.white
              }}
            >
              Content Ideas for Your Profile
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "⚡", title: "Match Highlights", desc: "Showcase your best moments" },
                { icon: "🏃", title: "Training Sessions", desc: "Share your workout routines" },
                { icon: "🏆", title: "Achievements", desc: "Celebrate your successes" },
                { icon: "⚽", title: "Match Moments", desc: "Key plays and skills" },
              ].map((idea, index) => (
                <div key={index} className="flex items-center gap-3 p-3" style={{ ...styles.buttonBorder, backgroundColor: colors.surface, border: `1px solid ${colors.input}` }}>
                  <span className="text-2xl">{idea.icon}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: colors.white }}>{idea.title}</div>
                    <div className="text-xs" style={{ color: colors.muted }}>{idea.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View All Posts Link */}
      {posts.length > 0 && (
        <div className="mt-8 text-center pt-6" style={{ borderTop: `1px solid ${colors.surface}` }}>
          <Link
            href={`/players/${userId}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: "transparent", 
              color: colors.white,
              border: `1px solid ${colors.surface}`
            }}
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
